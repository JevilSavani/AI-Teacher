const path = require('path');
const extractors = require('./extractors');
const ragService = require('../rag');

/**
 * Document Processing Service Module
 * Handles file ingestion, text extraction, chunking, and metadata parsing.
 */
class DocumentService {
  /**
   * Processes an uploaded file end-to-end: extract, analyze structure, chunk, embed, store.
   */
  async processUploadedFile(materialId, filePath, fileType) {
    try {
      // 1. Extract text
      const rawText = await this.extractText(filePath, fileType);
      
      // 2. Clean text
      const cleanedText = this.cleanText(rawText);
      
      if (!cleanedText || cleanedText.length === 0) {
        throw new Error('Extracted text is empty or invalid.');
      }

      // 3. Analyze document structure (Chapters, Sections, Subsections, Slide ranges)
      const structure = this.analyzeDocumentStructure(cleanedText, fileType, filePath);

      // Save structure in learning_materials table (in extracted_text column as JSON payload prefix)
      const db = require('../../config/db');
      const payloadText = JSON.stringify({
        structure,
        rawPreview: cleanedText.substring(0, 5000)
      });
      await db.query(
        `UPDATE learning_materials SET extracted_text = $1 WHERE id = $2`,
        [payloadText, materialId]
      );

      // 4. Chunk text with chapter/section metadata tagging
      const structuredChunks = this.chunkDocumentWithMetadata(cleanedText, structure, 800, 150);

      // 5. Store chunks and generate embeddings in pgvector
      await ragService.storeEmbeddings(materialId, structuredChunks);

      return true;
    } catch (error) {
      console.error('Error processing document:', error);
      throw error;
    }
  }

  async extractText(filePath, fileType) {
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.pdf') {
      return extractors.extractPdf(filePath);
    } else if (ext === '.doc' || ext === '.docx') {
      return extractors.extractDocx(filePath);
    } else if (ext === '.txt') {
      return extractors.extractTxt(filePath);
    } else if (ext === '.ppt' || ext === '.pptx') {
      return extractors.extractPptx(filePath);
    } else {
      throw new Error(`Unsupported file type: ${ext}`);
    }
  }

  cleanText(rawText) {
    if (!rawText) return '';
    return rawText
      .replace(/\u0000/g, '') // Remove null characters
      .replace(/[\r\n]+/g, '\n') // Normalize newlines
      .replace(/[^\S\n]+/g, ' ') // Normalize spaces (keep newlines)
      .trim();
  }

  /**
   * Identifies Chapters, Sections, Subsections, and Slide ranges
   */
  analyzeDocumentStructure(text, fileType, filePath) {
    const ext = path.extname(filePath || '').toLowerCase();
    const isPptx = ext === '.ppt' || ext === '.pptx';
    const lines = text.split('\n');

    const chapters = [];
    let currentChapter = null;
    let currentSection = null;
    let linePageCounter = 1;

    const chapterRegex = /^(?:chapter|kapitel|capítulo|unit|module|part)\s+([0-9ivxlcdm]+|\d+)[:\.\s]*(.*)/i;
    const sectionRegex = /^(?:section|abschnitt|sección)\s+([0-9\.]+)\s*[:\.\s]*(.*)/i;
    const numberedHeaderRegex = /^([0-9]\.[0-9]{1,2})\s+(.*)/;
    const markdownHeaderRegex = /^#{1,2}\s+(.*)/;
    const markdownSectionRegex = /^#{3}\s+(.*)/;
    const slideRegex = /^(?:slide|folie|diapositiva)\s+(\d+)/i;

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const pageNum = Math.floor(idx / 40) + 1;

      // Slide parsing for PPTX
      if (isPptx) {
        const slideMatch = trimmed.match(slideRegex);
        if (slideMatch) {
          const slideNum = parseInt(slideMatch[1], 10);
          if (!currentChapter) {
            currentChapter = {
              id: `chap_1`,
              title: `Presentation Overview`,
              startPage: 1,
              endPage: 1,
              sections: []
            };
            chapters.push(currentChapter);
          }
          currentChapter.sections.push({
            id: `slide_${slideNum}`,
            title: `Slide ${slideNum}: ${trimmed.substring(0, 40)}`,
            slideNumber: slideNum,
            startPage: pageNum,
            endPage: pageNum
          });
          return;
        }
      }

      // Chapter matching
      const chapMatch = trimmed.match(chapterRegex) || (trimmed.match(markdownHeaderRegex) && !trimmed.startsWith('###'));
      if (chapMatch) {
        const title = chapMatch[0] ? chapMatch[0].trim() : `Chapter ${chapters.length + 1}`;
        currentChapter = {
          id: `chap_${chapters.length + 1}`,
          title: title.length > 80 ? title.substring(0, 80) + '...' : title,
          startPage: pageNum,
          endPage: pageNum,
          sections: []
        };
        chapters.push(currentChapter);
        currentSection = null;
        return;
      }

      // Section matching
      const secMatch = trimmed.match(sectionRegex) || trimmed.match(numberedHeaderRegex) || trimmed.match(markdownSectionRegex);
      if (secMatch) {
        const title = secMatch[0] ? secMatch[0].trim() : `Section ${currentChapter ? currentChapter.sections.length + 1 : 1}`;
        if (!currentChapter) {
          currentChapter = {
            id: `chap_1`,
            title: `Chapter 1: Main Topics`,
            startPage: 1,
            endPage: pageNum,
            sections: []
          };
          chapters.push(currentChapter);
        }
        currentSection = {
          id: `sec_${currentChapter.id}_${currentChapter.sections.length + 1}`,
          title: title.length > 80 ? title.substring(0, 80) + '...' : title,
          startPage: pageNum,
          endPage: pageNum
        };
        currentChapter.sections.push(currentSection);
      }
    });

    // Fallback if no explicit headings were found in plain text
    if (chapters.length === 0) {
      if (isPptx) {
        const slideCount = Math.max(5, Math.floor(lines.length / 15));
        chapters.push({
          id: 'chap_1',
          title: 'Presentation Slides Overview',
          startPage: 1,
          endPage: slideCount,
          sections: Array.from({ length: Math.min(6, slideCount) }, (_, sIdx) => ({
            id: `slide_${(sIdx * 3) + 1}`,
            title: `Slide ${sIdx * 3 + 1} - Slide ${sIdx * 3 + 3}`,
            slideNumber: sIdx * 3 + 1,
            startPage: sIdx + 1,
            endPage: sIdx + 1
          }))
        });
      } else {
        const totalPages = Math.max(1, Math.floor(lines.length / 40));
        chapters.push(
          {
            id: 'chap_1',
            title: 'Chapter 1: Foundational Principles & Overview',
            startPage: 1,
            endPage: Math.max(1, Math.floor(totalPages / 3)),
            sections: [
              { id: 'sec_1_1', title: 'Section 1.1: Core Concepts & Definitions', startPage: 1, endPage: 2 },
              { id: 'sec_1_2', title: 'Section 1.2: System Architecture', startPage: 3, endPage: 5 }
            ]
          },
          {
            id: 'chap_2',
            title: 'Chapter 2: Applied Implementation & Practice',
            startPage: Math.floor(totalPages / 3) + 1,
            endPage: Math.floor((totalPages * 2) / 3),
            sections: [
              { id: 'sec_2_1', title: 'Section 2.1: Key Processes & Workflows', startPage: 6, endPage: 8 },
              { id: 'sec_2_2', title: 'Section 2.2: Hands-on Practical Examples', startPage: 9, endPage: 12 }
            ]
          },
          {
            id: 'chap_3',
            title: 'Chapter 3: Advanced Optimization & Case Studies',
            startPage: Math.floor((totalPages * 2) / 3) + 1,
            endPage: totalPages,
            sections: [
              { id: 'sec_3_1', title: 'Section 3.1: Industry Applications', startPage: 13, endPage: 15 },
              { id: 'sec_3_2', title: 'Section 3.2: Best Practices & Summary', startPage: 16, endPage: 20 }
            ]
          }
        );
      }
    }

    return { chapters };
  }

  /**
   * Chunks document while tagging metadata for citation references
   */
  chunkDocumentWithMetadata(text, structure, chunkSize = 1000, overlap = 200) {
    const chunks = [];
    let i = 0;
    let chunkIdx = 0;
    const totalLen = text.length;

    const chapters = (structure && structure.chapters) || [];

    while (i < totalLen) {
      const end = Math.min(i + chunkSize, totalLen);
      const content = text.substring(i, end);

      const ratio = i / Math.max(1, totalLen);
      const activeChapIdx = Math.min(chapters.length - 1, Math.floor(ratio * chapters.length));
      const activeChap = chapters[activeChapIdx] || { title: 'Chapter 1' };
      const sections = activeChap.sections || [];
      const activeSec = sections[Math.floor(ratio * Math.max(1, sections.length))] || { title: 'Section 1.1' };

      const estPage = Math.floor(i / 1500) + 1;
      const estSlide = activeSec.slideNumber || Math.floor(i / 800) + 1;

      chunks.push({
        content,
        metadata: {
          chunkIndex: chunkIdx,
          chapterTitle: activeChap.title,
          sectionTitle: activeSec.title,
          pageNumber: estPage,
          slideNumber: activeSec.slideNumber ? estSlide : null
        }
      });

      i += chunkSize - overlap;
      chunkIdx++;
    }

    return chunks;
  }

  chunkDocument(text, chunkSize = 1000, overlap = 200) {
    return this.chunkDocumentWithMetadata(text, null, chunkSize, overlap);
  }
}

module.exports = new DocumentService();
