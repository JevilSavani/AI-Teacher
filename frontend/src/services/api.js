import { API_BASE_URL } from '../utils/constants';

/**
 * Standard fetch wrapper with error handling and response formatting
 */
export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json();
    return {
      status: response.status,
      ok: response.ok,
      ...data
    };
  } catch (error) {
    return {
      success: false,
      ok: false,
      status: 0,
      message: error.message || 'Network request failed'
    };
  }
}

/**
 * Axios-like API client for convenience
 */
const api = {
  get: async (endpoint, config = {}) => {
    return apiRequest(endpoint, {
      method: 'GET',
      ...config
    });
  },

  post: async (endpoint, data, config = {}) => {
    const options = {
      method: 'POST',
      ...config,
      body: config.headers?.['Content-Type'] === 'multipart/form-data' ? data : JSON.stringify(data)
    };

    // For multipart/form-data, don't set Content-Type header, let browser set it
    if (config.headers?.['Content-Type'] === 'multipart/form-data') {
      delete config.headers['Content-Type'];
    }

    return apiRequest(endpoint, options);
  },

  put: async (endpoint, data, config = {}) => {
    return apiRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...config
    });
  },

  delete: async (endpoint, config = {}) => {
    return apiRequest(endpoint, {
      method: 'DELETE',
      ...config
    });
  },

  patch: async (endpoint, data, config = {}) => {
    return apiRequest(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...config
    });
  }
};

export default api;
