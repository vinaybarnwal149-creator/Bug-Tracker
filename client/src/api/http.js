let inMemoryAccessToken = null;
let refreshPromise = null;
let onAuthFailureCallback = null;

export const setAccessToken = (token) => {
  inMemoryAccessToken = token;
};

export const getAccessToken = () => inMemoryAccessToken;

export const setOnAuthFailure = (callback) => {
  onAuthFailureCallback = callback;
};

const refreshAccessToken = async () => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) {
        throw new Error('Refresh failed');
      }
      const data = await res.json();
      if (data.success && data.data?.accessToken) {
        setAccessToken(data.data.accessToken);
        return data.data;
      }
      throw new Error('Invalid refresh response');
    } catch (err) {
      setAccessToken(null);
      if (onAuthFailureCallback) {
        onAuthFailureCallback();
      }
      throw err;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export const request = async (url, options = {}, isRetry = false) => {
  const headers = { ...options.headers };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (inMemoryAccessToken) {
    headers['Authorization'] = `Bearer ${inMemoryAccessToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401 && !isRetry && !url.includes('/auth/login') && !url.includes('/auth/register') && !url.includes('/auth/refresh')) {
    try {
      await refreshAccessToken();
      return request(url, options, true);
    } catch (refreshErr) {
      throw new Error('Session expired. Please log in again.');
    }
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type');
  const data = contentType && contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const error = new Error(data?.error?.message || response.statusText || 'Request failed');
    error.status = response.status;
    error.code = data?.error?.code;
    error.details = data?.error?.details;
    throw error;
  }

  return data;
};

export const http = {
  get: (url, params) => {
    let finalUrl = url;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          searchParams.append(k, v);
        }
      });
      const qs = searchParams.toString();
      if (qs) finalUrl += `?${qs}`;
    }
    return request(finalUrl, { method: 'GET' });
  },
  post: (url, body) => request(url, { method: 'POST', body: JSON.stringify(body) }),
  patch: (url, body) => request(url, { method: 'PATCH', body: JSON.stringify(body) }),
  put: (url, body) => request(url, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (url) => request(url, { method: 'DELETE' }),
  upload: (url, formData) => request(url, { method: 'POST', body: formData })
};
