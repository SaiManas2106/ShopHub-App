// frontend/src/api.js
const API = (url => {
  const base = url || (import.meta.env.VITE_API_BASE || 'https://shop-hub-app-one.vercel.app')

  function getHeaders(token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    return headers;
  }

  async function parse(res) {
    const text = await res.text().catch(()=>'' )
    try {
      return text ? JSON.parse(text) : {}
    } catch (e) {
      return { data: text }
    }
  }

  function buildQuery(params) {
    if (!params || Object.keys(params).length === 0) return ''
    const qp = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v === null || v === undefined) return
      if (typeof v === 'string' && v.trim() === '') return
      qp.append(k, String(v))
    })
    const qs = qp.toString()
    return qs ? ('?' + qs) : ''
  }

  return {
    signup: async (data) => {
      const res = await fetch(base + '/auth/signup', { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) })
      return parse(res)
    },
    login: async (data) => {
      const res = await fetch(base + '/auth/login', { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) })
      return parse(res)
    },
    getItems: async (params, token) => {
      const qs = buildQuery(params)
      const res = await fetch(base + '/items' + qs, { headers: getHeaders(token) })
      return parse(res)
    },
    getItem: async (id, token) => {
      const res = await fetch(base + '/items/' + id, { headers: getHeaders(token) })
      return parse(res)
    },
    addToCart: async (itemId, qty, token) => {
      const res = await fetch(base + '/cart/add', { method: 'POST', headers: getHeaders(token), body: JSON.stringify({ itemId, qty }) })
      return parse(res)
    },
    getCart: async (token) => {
      const res = await fetch(base + '/cart', { headers: getHeaders(token) })
      return parse(res)
    },
    removeFromCart: async (itemId, token) => {
      const res = await fetch(base + '/cart/remove', { method: 'POST', headers: getHeaders(token), body: JSON.stringify({ itemId }) })
      return parse(res)
    },
    updateCart: async (itemId, qty, token) => {
      const res = await fetch(base + '/cart/update', { method: 'POST', headers: getHeaders(token), body: JSON.stringify({ itemId, qty }) })
      return parse(res)
    },
    createItem: async (data, token) => {
      const res = await fetch(base + '/items', { method: 'POST', headers: getHeaders(token), body: JSON.stringify(data) })
      return parse(res)
    },
    updateItem: async (id, data, token) => {
      const res = await fetch(base + '/items/' + id, { method: 'PUT', headers: getHeaders(token), body: JSON.stringify(data) })
      return parse(res)
    },
    deleteItem: async (id, token) => {
      const res = await fetch(base + '/items/' + id, { method: 'DELETE', headers: getHeaders(token) })
      return parse(res)
    }
  }
})()

export default API
