import api from './api';

export const documentService = {
  /**
   * Upload a new document
   * @param {File} file 
   * @param {string} title 
   * @param {Function} onUploadProgress 
   */
  uploadDocument: async (file, title, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);

    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data.data;
  },

  /**
   * Get all user documents
   */
  getDocuments: async () => {
    const response = await api.get('/documents');
    return response.data.data;
  },

  /**
   * Get a specific document
   */
  getDocumentById: async (id) => {
    const response = await api.get(`/documents/${id}`);
    return response.data.data;
  },

  /**
   * Delete a document
   */
  deleteDocument: async (id) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data.data;
  },

  /**
   * Ask a question about a document using RAG
   */
  askDocument: async (id, question) => {
    const response = await api.post(`/documents/${id}/ask`, { question });
    return response.data.data;
  }
};
