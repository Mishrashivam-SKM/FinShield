const BASE_URL = 'http://localhost/api'; // Going through Nginx reverse proxy

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  });

  if (!response.ok) {
    const errorJson = await response.json();
    throw new Error(errorJson.error || 'Network response was not ok');
  }

  return response.json();
};
