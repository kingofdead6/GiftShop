/**
 * The illueur client's only door to the server.
 *
 * Deliberately not client/api.js: that file points at the Evora Home API on
 * Render. illueur talks to its own server (server/, database "illueur"):
 * localhost in development, VITE_API_URL once deployed.
 *
 * The session is an httpOnly cookie, so every request sends credentials and
 * nothing about the session is ever stored in JS.
 */
const BASE = import.meta.env.VITE_API_URL || 'https://giftshop-3o8e.onrender.com/api';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, signal, form } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: form || (body === undefined ? undefined : JSON.stringify(body)),
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('Serveur injoignable. Vérifiez votre connexion.', 0);
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.message || 'Une erreur est survenue', res.status);
  return data;
}

const qs = (params = {}) => {
  const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)).toString();
  return s ? `?${s}` : '';
};

export const api = {
  me: (signal) => request('/auth/me', { signal }),
  login: (identifier, password) => request('/auth/login', { method: 'POST', body: { identifier, password } }),
  register: (body) => request('/auth/register', { method: 'POST', body }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  updateProfile: (body) => request('/auth/profile', { method: 'PUT', body }),
  changePassword: (body) => request('/auth/password', { method: 'PUT', body }),
  toggleWishlist: (slug) => request(`/auth/wishlist/${slug}`, { method: 'POST' }),

  catalogue: (signal) => request('/catalogue', { signal }),

  createDemande: (body) => request('/demandes', { method: 'POST', body }),
  myDemandes: (signal) => request('/demandes/mine', { signal }),

  admin: {
    overview: (signal) => request('/admin/illueur/overview', { signal }),
    demandes: (params, signal) => request(`/admin/demandes${qs(params)}`, { signal }),
    updateDemande: (id, body) => request(`/admin/demandes/${id}`, { method: 'PUT', body }),
    users: (params, signal) => request(`/admin/users${qs(params)}`, { signal }),
    setRole: (id, role) => request(`/admin/users/${id}/role`, { method: 'PUT', body: { role } }),

    catalogue: (signal) => request('/admin/catalogue', { signal }),
    createPiece: (body) => request('/admin/pieces', { method: 'POST', body }),
    updatePiece: (id, body) => request(`/admin/pieces/${id}`, { method: 'PUT', body }),
    deletePiece: (id) => request(`/admin/pieces/${id}`, { method: 'DELETE' }),
    reorderPieces: (ids) => request('/admin/pieces/reorder', { method: 'PUT', body: { ids } }),
    uploadPhoto: (id, file) => {
      const form = new FormData();
      form.append('photo', file);
      return request(`/admin/pieces/${id}/photo`, { method: 'POST', form });
    },
    deletePhoto: (id) => request(`/admin/pieces/${id}/photo`, { method: 'DELETE' }),
    createCollection: (body) => request('/admin/collections', { method: 'POST', body }),
    updateCollection: (id, body) => request(`/admin/collections/${id}`, { method: 'PUT', body }),
    deleteCollection: (id, moveTo) => request(`/admin/collections/${id}${qs({ moveTo })}`, { method: 'DELETE' }),
    reorderCollections: (ids) => request('/admin/collections/reorder', { method: 'PUT', body: { ids } }),
  },
};

export default api;
