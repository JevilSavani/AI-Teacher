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
      chunks.map(async (chunk, index) => {
        const vector = await llmProvider.generateEmbedding(chunk);
        return {
          materialId,
          content: chunk,
          chunkIndex: index,
          embedding: `[${vector.join(',')}]` // pgvector format
        };
      })
    );

    // Store in DB
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      for (const item of embeddings) {
        await client.query(
          `INSERT INTO document_chunks (material_id, content, chunk_index, embedding)
           VALUES ($1, $2, $3, $4)`,
          [item.materialId, item.content, item.chunkIndex, item.embedding]
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

  async retrieveRelevantContext(queryText, materialId, topK = 5) {
    const queryEmbedding = await llmProvider.generateEmbedding(queryText);
    const vectorStr = `[${queryEmbedding.join(',')}]`;

    // Semantic search using cosine distance (<=>)
    const result = await db.query(
      `SELECT id, content, chunk_index, 
              1 - (embedding <=> $1) AS similarity 
       FROM document_chunks 
       WHERE material_id = $2 
       ORDER BY embedding <=> $1 
       LIMIT $3`,
      [vectorStr, materialId, topK]
    );

    return result.rows;
  }

  buildContext(chunks) {
    return chunks.map((c, i) => `[Source ${i + 1}]: ${c.content}`).join('\n\n');
  }

  async answerWithRAG(query, materialId) {
    const relevantChunks = await this.retrieveRelevantContext(query, materialId);
    if (relevantChunks.length === 0) {
      return "I couldn't find any relevant information in the document to answer your question.";
    }

    const context = this.buildContext(relevantChunks);
    const systemPrompt = `You are a helpful AI Teacher. Use ONLY the provided context from the student's document to answer the question. 
If the answer is not contained within the context, say "I don't have enough information in the uploaded document to answer that." 
Cite your sources using the [Source X] labels provided.

Context:
${context}`;

    const answer = await llmProvider.generateCompletion(query, systemPrompt);
    return {
      answer,
      sources: relevantChunks.map(c => ({ chunkId: c.id, index: c.chunk_index, similarity: c.similarity }))
    };
  }
}

module.exports = new RagService();
