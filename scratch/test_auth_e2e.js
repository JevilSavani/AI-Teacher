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

  const token = localStorageToken;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
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
      return {
        status: response.status,
        ok: response.ok,
        success: false,
        message: `Server response error (${response.status}): ${rawText.substring(0, 100)}`
      };
    }

    return {
      status: response.status,
      ok: response.ok,
      success: data.success !== undefined ? data.success : response.ok,
      ...data
    };
  } catch (error) {
    return { success: false, ok: false, status: 0, message: error.message };
  }
}

let localStorageToken = null;

async function testE2EAuth() {
  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  const testName = 'Production Test User';

  console.log(`\n--- Registering Test User (${testEmail}) ---`);
  const regRes = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: testName, email: testEmail, password: testPassword })
  });
  console.log('Register Result:', regRes.ok ? 'SUCCESS' : 'FAILED', regRes.message);

  if (regRes.ok) {
    console.log('\n--- Logging In with Newly Registered User ---');
    const loginRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    console.log('Login Result:', loginRes.ok ? 'SUCCESS' : 'FAILED');
    console.log('Token Received:', loginRes.data?.token ? `${loginRes.data.token.substring(0, 20)}...` : 'NONE');

    if (loginRes.data?.token) {
      localStorageToken = loginRes.data.token;
      console.log('\n--- Fetching Authenticated Profile (/auth/me) ---');
      const meRes = await apiRequest('/auth/me');
      console.log('GetMe Result:', meRes.ok ? 'SUCCESS' : 'FAILED');
      console.log('User Name in Response:', meRes.data?.user?.name);
    }
  }
}

testE2EAuth();
