const path = require('path');
const extractors = require('./extractors');
const ragService = require('../rag');

/**
 * Document Processing Service Module
 * Handles file ingestion, text extraction, chunking, and metadata parsing.
 */
class DocumentService {
  /**
   * Processes an uploaded file end-to-end: extract, chunk, embed, store.
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

      // 3. Chunk text
      const chunks = this.chunkDocument(cleanedText, 800, 150);

      // 4. Store chunks and generate embeddings
      await ragService.storeEmbeddings(materialId, chunks);

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
   * Basic chunking implementation by characters/words.
   */
  chunkDocument(text, chunkSize = 1000, overlap = 200) {
    const chunks = [];
    let i = 0;
    while (i < text.length) {
      const end = Math.min(i + chunkSize, text.length);
      chunks.push(text.substring(i, end));
      i += chunkSize - overlap;
    }
    return chunks;
  }
}

module.exports = new DocumentService();
