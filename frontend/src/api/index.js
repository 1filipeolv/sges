const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = async (path, options = {}) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE}/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro na requisição');
  return data;
};
