const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Helper to get auth headers
const getHeaders = (isJson = true) => {
  const headers: Record<string, string> = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

// Generic fetch wrapper
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(!options.body || !(options.body instanceof FormData)),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  // Handle file downloads
  const contentType = response.headers.get('Content-Type');
  if (contentType && contentType.includes('text/csv')) {
    return response.text() as unknown as T;
  }

  return response.json();
}

export const api = {
  // Auth API
  auth: {
    register: (data: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    me: () => request<any>('/auth/me', { method: 'GET' }),
  },

  // Forms API
  forms: {
    getAll: () => request<any[]>('/forms', { method: 'GET' }),
    getPrivate: (formId: string) => request<any>(`/forms/private/${formId}`, { method: 'GET' }),
    getPublic: (formId: string) => request<any>(`/forms/public/${formId}`, { method: 'GET' }),
    create: (data: any) => request<any>('/forms', { method: 'POST', body: JSON.stringify(data) }),
    update: (formId: string, data: any) => request<any>(`/forms/${formId}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (formId: string) => request<any>(`/forms/${formId}`, { method: 'DELETE' }),
    duplicate: (formId: string) => request<any>(`/forms/${formId}/duplicate`, { method: 'POST' }),
  },

  // Responses API
  responses: {
    submit: (formId: string, answers: Record<string, any>) => 
      request<any>(`/responses/${formId}`, { method: 'POST', body: JSON.stringify({ answers }) }),
    getAll: (formId: string) => request<any[]>(`/responses/${formId}`, { method: 'GET' }),
    getAnalytics: (formId: string) => request<any>(`/responses/${formId}/analytics`, { method: 'GET' }),
    exportCSV: async (formId: string) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const response = await fetch(`${API_URL}/responses/${formId}/export`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to export responses');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `form_${formId}_submissions.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  }
};
