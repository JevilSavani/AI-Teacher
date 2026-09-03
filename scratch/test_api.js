const API_BASE_URL = 'https://ai-teacher-sfkr.onrender.com/api';

async function apiRequest(endpoint, options = {}) {
  const baseUrl = (API_BASE_URL || 'https://ai-teacher-sfkr.onrender.com/api').replace(/\/+$/, '');
  const url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
    ? endpoint
    : `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = {
    ...(options.headers || {})
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    let data = {};
    let rawText = '';

    try {
      rawText = await response.text();
      if (rawText && rawText.trim().length > 0) {
        data = JSON.parse(rawText);
      }
    } catch (parseError) {
      const textPreview = rawText ? rawText.substring(0, 300) : '[Empty Response]';

      console.error(`[API Error] Request to ${url} returned status ${response.status} (${response.statusText || 'Unknown Status'}), but response body is not valid JSON:`, {
        url,
        status: response.status,
        statusText: response.statusText,
        responseText: textPreview
      });

      return {
        status: response.status,
        ok: response.ok,
        success: false,
        message: `Server response error (${response.status} ${response.statusText || ''}): ${textPreview.startsWith('<') ? 'Received HTML/Non-JSON response' : textPreview}`
      };
    }

    if (!response.ok) {
      const textPreview = rawText.length > 500 ? rawText.substring(0, 500) + '...' : rawText;
      console.error(`[API Request Failed] ${options.method || 'GET'} ${url} -> Status ${response.status} (${response.statusText || ''})`, {
        url,
        status: response.status,
        statusText: response.statusText,
        message: data.message || data.error || 'API call failed',
        responseText: textPreview
      });
    }

    return {
      status: response.status,
      ok: response.ok,
      success: data.success !== undefined ? data.success : response.ok,
      ...data
    };
  } catch (error) {
    console.error(`[API Network Error] ${options.method || 'GET'} ${url}:`, {
      url,
      status: 0,
      error: error.message || 'Network request failed'
    });

    return {
      success: false,
      ok: false,
      status: 0,
      message: error.message || 'Network request failed'
    };
  }
}

async function runTests() {
  console.log('--- Test 1: Deployed Render Backend Login Request ---');
  const res1 = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'user@example.com', password: 'password123' })
  });
  console.log('\nResult 1 (Login Output):', JSON.stringify(res1, null, 2));

  console.log('\n--- Test 2: Deployed Render Health Endpoint ---');
  const res2 = await apiRequest('/health');
  console.log('\nResult 2 (Health Output):', JSON.stringify(res2, null, 2));

  console.log('\n--- Test 3: Non-JSON Response Handling ---');
  const res3 = await apiRequest('https://ai-teacher-sfkr.onrender.com/non-existent-page-that-returns-html');
  console.log('\nResult 3 (Non-JSON Output):', JSON.stringify(res3, null, 2));
}

runTests();
