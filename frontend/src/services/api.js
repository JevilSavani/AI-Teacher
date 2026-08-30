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
