const API_BASE = '/api';

function getToken(): string {
  return localStorage.getItem('ts-manager-token') || '';
}

export function setToken(token: string) {
  localStorage.setItem('ts-manager-token', token);
}

export function clearToken() {
  localStorage.removeItem('ts-manager-token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });

  if (res.status === 401 || res.status === 403) {
    clearToken();
    window.location.reload();
    throw new Error('Unauthorized');
  }

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export const api = {
  // Auth
  verifyToken: () => request<{ success: boolean }>('/auth/verify', { method: 'POST' }),

  // Orders
  getOrders: () => request<{ data: any[] }>('/orders'),
  createOrder: (input: any) => request<{ data: any }>('/orders', { method: 'POST', body: JSON.stringify(input) }),
  updateOrder: (id: number, input: any) => request<{ data: any }>(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  deleteOrder: (id: number) => request<{ success: boolean }>(`/orders/${id}`, { method: 'DELETE' }),
  deliverOrder: (id: number) => request<{ data: any }>(`/orders/${id}/deliver`, { method: 'POST' }),

  // Containers
  getContainers: () => request<{ data: any[] }>('/containers'),
  getContainer: (id: number) => request<{ data: any }>(`/containers/${id}`),
  exportContainer: (id: number) => {
    // Direct download - use window.open or fetch with blob
    const url = `${API_BASE}/containers/${id}/export`;
    return fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then((res) => res.blob());
  },
  importContainer: (id: number) => request<{ data: any }>(`/containers/${id}/import`, { method: 'POST' }),
  resetContainer: (id: number) => request<{ data: any }>(`/containers/${id}/reset`, { method: 'POST' }),
  recycleContainer: (id: number) => request<{ success: boolean }>(`/containers/${id}/recycle`, { method: 'POST' }),
  refreshContainer: (id: number) => request<{ data: any }>(`/containers/${id}/refresh`, { method: 'POST' }),

  // System
  getHealth: () => request<{ data: any }>('/system/health'),
  getInfo: () => request<{ data: any }>('/system/info'),
  getStats: () => request<{ data: any }>('/system/stats'),
};
