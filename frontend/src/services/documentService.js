import api from './api';

export const documentService = {
  /**
   * Upload a new document
   */
  uploadDocument: async (file, title, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    const docTitle = title || (file ? file.name : 'Document');
    formData.append('title', docTitle);

    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });

    if (!response.ok) {
      throw new Error(response.message || 'Failed to upload document');
    }

    return response.data;
  },

  /**
   * Get all user documents
   */
  getDocuments: async () => {
    const response = await api.get('/documents');

    if (!response.ok) {
      throw new Error(response.message || 'Failed to load documents');
    }

    return Array.isArray(response.data)
      ? response.data
      : (Array.isArray(response.data?.data) ? response.data.data : []);
  },

  /**
   * Get a specific document
   */
  getDocumentById: async (id) => {
    const response = await api.get(`/documents/${id}`);

    if (!response.ok) {
      throw new Error(response.message || 'Failed to load document');
    }

    return response.data;
  },

  /**
   * Delete a document
   */
  deleteDocument: async (id) => {
    const response = await api.delete(`/documents/${id}`);

    if (!response.ok) {
      throw new Error(response.message || 'Failed to delete document');
    }

    return response.data;
  },

  /**
   * Ask a question about a document using RAG
   */
  askDocument: async (id, question, chapterTitle = null, sectionTitle = null) => {
    const response = await api.post(`/documents/${id}/ask`, { question, chapterTitle, sectionTitle });

    if (!response.ok) {
      throw new Error(response.message || 'Failed to ask document question');
    }

    return response.data;
  }
};
