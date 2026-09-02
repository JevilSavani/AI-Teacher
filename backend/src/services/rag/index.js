const db = require('../../config/db');
const llmProvider = require('../ai/llmProvider');

/**
 * RAG (Retrieval-Augmented Generation) Service Module
 * Handles vector embedding generation, pgvector indexing, semantic similarity search, and context assembly.
 */
class RagService {
  async storeEmbeddings(materialId, chunks) {
    // Generate embeddings for all chunks in parallel
    const embeddings = await Promise.all(
      chunks.map(async (chunkObj, index) => {
        const textContent = typeof chunkObj === 'object' ? chunkObj.content : String(chunkObj);
        const chunkMeta = typeof chunkObj === 'object' ? (chunkObj.metadata || {}) : {};
        
        const vector = await llmProvider.generateEmbedding(textContent);
        return {
          materialId,
          content: textContent,
          chunkIndex: index,
          metadata: JSON.stringify(chunkMeta),
          embedding: `[${vector.join(',')}]` // pgvector format
        };
      })
    );

    // Store in DB
    const pool = db.getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const item of embeddings) {
        await client.query(
          `INSERT INTO document_chunks (material_id, content, chunk_index, embedding, metadata)
           VALUES ($1, $2, $3, $4, $5)`,
          [item.materialId, item.content, item.chunkIndex, item.embedding, item.metadata]
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Resolves ambiguous query terms (it, this, why, explain it, give example) using active lesson context and history.
   */
  resolveQueryContext(queryText, lessonContext = {}, history = []) {
    if (!queryText || typeof queryText !== 'string') return '';
    let clean = queryText.trim();

    const activeTopic = lessonContext.concept || lessonContext.sectionTitle || lessonContext.chapterTitle || lessonContext.topic || '';

    // Check for ambiguous pronouns / short phrases
    const isAmbiguous = /^(explain|what\s*is|why|how|give|show|tell)/i.test(clean) || /\b(it|this|that)\b/i.test(clean) || clean.length < 20;

    // Retrieve previous message topic if relevant
    let historyTopic = '';
    if (Array.isArray(history) && history.length > 0) {
      const lastUserMsg = [...history].reverse().find(m => m.role === 'user' && m.content);
      if (lastUserMsg) historyTopic = lastUserMsg.content;
    }

    if (isAmbiguous && activeTopic) {
      clean = `${clean} regarding ${activeTopic}`;
    }

    return clean;
  }

  async retrieveRelevantContext(queryText, materialId, topK = 5, filter = {}, lessonContext = {}) {
    const resolvedQuery = this.resolveQueryContext(queryText, lessonContext);
    
    let semanticRows = [];
    try {
      const queryEmbedding = await llmProvider.generateEmbedding(resolvedQuery);
      const vectorStr = `[${queryEmbedding.join(',')}]`;

      const result = await db.query(
        `SELECT id, content, chunk_index, metadata, 
                1 - (embedding <=> $1) AS similarity 
         FROM document_chunks 
         WHERE material_id = $2 
         ORDER BY embedding <=> $1 
         LIMIT $3`,
        [vectorStr, materialId, topK * 2]
      );
      semanticRows = result.rows || [];
    } catch (err) {
      console.warn('[RagService] Semantic vector query notice:', err.message);
    }

    // Direct section matching to ensure selected section content is retrieved
    let sectionRows = [];
    if (filter.chapterTitle || filter.sectionTitle || lessonContext.sectionTitle || lessonContext.chapterTitle) {
      try {
        const secName = filter.sectionTitle || lessonContext.sectionTitle || '';
        const chapName = filter.chapterTitle || lessonContext.chapterTitle || '';
        const cleanSec = secName.replace(/^section\s+/i, '').replace(/^[0-9\.]+\s*/, '').trim();
        const cleanChap = chapName.replace(/^chapter\s+/i, '').replace(/^[0-9\.]+\s*/, '').trim();
        const searchPattern = `%${cleanSec || cleanChap}%`;

        if (searchPattern.length > 2) {
          const directResult = await db.query(
            `SELECT id, content, chunk_index, metadata, 0.85 AS similarity 
             FROM document_chunks 
             WHERE material_id = $1 
               AND (
                 metadata->>'sectionTitle' ILIKE $2 
                 OR metadata->>'chapterTitle' ILIKE $2 
                 OR content ILIKE $2
               )
             ORDER BY chunk_index ASC 
             LIMIT $3`,
            [materialId, searchPattern, topK]
          );
          sectionRows = directResult.rows || [];
        }
      } catch (e) {
        console.warn('[RagService] Section-first direct fetch notice:', e.message);
      }
    }

    // Combine and deduplicate (prioritizing section-matched rows)
    const combinedMap = new Map();
    sectionRows.forEach(r => combinedMap.set(r.id, r));
    semanticRows.forEach(r => {
      if (!combinedMap.has(r.id)) combinedMap.set(r.id, r);
    });

    let finalChunks = Array.from(combinedMap.values());

    // Fallback: If 0 chunks found, fetch top document chunks so AI never falsely claims "insufficient information"
    if (finalChunks.length === 0) {
      try {
        const fallbackResult = await db.query(
          `SELECT id, content, chunk_index, metadata, 0.70 AS similarity 
           FROM document_chunks 
           WHERE material_id = $1 
           ORDER BY chunk_index ASC 
           LIMIT $2`,
          [materialId, topK]
        );
        finalChunks = fallbackResult.rows || [];
      } catch (fErr) {}
    }

    return finalChunks.slice(0, topK);
  }

  buildContext(chunks) {
    return chunks.map((c) => c.content).join('\n\n');
  }

  async answerWithRAG(query, materialId, filter = {}, lessonContext = {}, history = []) {
    const resolvedQuery = this.resolveQueryContext(query, lessonContext, history);
    const relevantChunks = await this.retrieveRelevantContext(query, materialId, 5, filter, lessonContext);

    if (relevantChunks.length === 0) {
      return {
        answer: "I couldn't find any relevant information in the selected document section to answer your question.",
        sources: []
      };
    }

    const context = this.buildContext(relevantChunks);
    const activeTopic = lessonContext.concept || lessonContext.sectionTitle || lessonContext.chapterTitle || lessonContext.topic || 'Current Section';
    const level = lessonContext.level || 'Intermediate';
    const language = lessonContext.language || 'English';

    let historyText = '';
    if (Array.isArray(history) && history.length > 0) {
      const recent = history.slice(-4);
      historyText = '\nRECENT CONVERSATION HISTORY:\n' + recent.map(m => `${m.role === 'user' ? 'Student' : 'AI Teacher'}: ${m.content}`).join('\n') + '\n';
    }

    const systemPrompt = `You are a world-class AI Teacher providing interactive, context-aware teaching based on the student's uploaded material.

STUDENT LEARNING CONTEXT:
- Document ID: ${materialId}
- Current Chapter: ${lessonContext.chapterTitle || filter.chapterTitle || 'Selected Chapter'}
- Current Section: ${lessonContext.sectionTitle || filter.sectionTitle || 'Selected Section'}
- Active Concept / Topic: ${activeTopic}
- Learner Difficulty Level: ${level}
- Teaching Language: Strictly ${language}

PEDAGOGICAL TEACHING INSTRUCTIONS:
1. Explain the concept clearly matching the student's level (${level}).
2. If student asks ambiguous or pronoun-based questions like "explain it", "what is this", "give me an example", "why do we use it", resolve "it/this" to "${activeTopic}".
3. Ground your explanation strictly in the document material provided below. Do not hallucinate facts unsupported by the material.
4. Give a clear, simple explanation first, followed by technical details appropriate for a ${level} student.
5. Include concrete C++/code or practical examples directly from the material whenever available.
6. If the material only partially explains the concept, explain what is available in the document and clearly indicate what is not covered.
7. Always end with a helpful follow-up question to check the student's understanding.
8. CRITICAL LANGUAGE RULE: Write all text, explanations, and questions strictly in ${language}. Keep standard C++/SQL code syntax unchanged.

${historyText}

DOCUMENT MATERIAL CONTEXT:
${context}`;

    const rawAnswer = await llmProvider.generateCompletion(resolvedQuery, systemPrompt);
    const cleanAnswer = (rawAnswer || '').replace(/\[Source\s*\d+\]/gi, '').trim();

    const sources = relevantChunks.map(c => {
      const meta = typeof c.metadata === 'string' ? JSON.parse(c.metadata || '{}') : (c.metadata || {});
      let label = `Page ${meta.pageNumber || (c.chunk_index + 1)}`;
      if (meta.slideNumber) label = `Slide ${meta.slideNumber}`;
      if (meta.sectionTitle) label = `${meta.sectionTitle}, ${label}`;
      if (meta.chapterTitle) label = `${meta.chapterTitle}, ${label}`;

      return {
        chunkId: c.id,
        index: c.chunk_index,
        similarity: c.similarity,
        source: label
      };
    });

    return {
      answer: cleanAnswer,
      sources
    };
  }
}

module.exports = new RagService();
