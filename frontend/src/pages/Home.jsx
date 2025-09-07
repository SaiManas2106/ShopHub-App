import React, { useEffect, useState } from 'react'
import API from '../api'
import { Link } from 'react-router-dom'

function placeholderImage(name) {
  const txt = encodeURIComponent(name || 'product')
  return `https://via.placeholder.com/300x200.png?text=${txt}`
}

function handleImgError(e, category) {
  const img = e.currentTarget
  if (img.dataset.onerror) return
  img.dataset.onerror = '1'
  img.src = `/images/${category || 'fallback'}-fallback.jpg`
}

export default function Home() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')

  const [filters, setFilters] = useState({
    category: '',
    minPrice: 0,
    maxPrice: 7000
  })

  useEffect(() => { fetchItems() }, [filters, q])

  async function fetchItems() {
    setLoading(true)
    try {
      const res = await API.getItems({
        category: filters.category || undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        q: q || undefined
      })
      setItems(Array.isArray(res) ? res : [])
    } catch (e) {
      console.error(e)
      setItems([])
    } finally { setLoading(false) }
  }

  async function addToCart(itemId) {
    const token = localStorage.getItem('token')
    if (!token) {
      if (confirm('You need to login to add items to your cart. Go to login?')) 
        window.location.href = '/login'
      return
    }
    try {
      await API.addToCart(itemId, 1, token)
      alert('Added to cart')
    } catch (e) {
      console.error(e)
      alert('Could not add to cart')
    }
  }

  return (
    <div className="home-container">
      {/* Filters Sidebar */}
      <aside className="filters">
        <h3>Filters ⚙️</h3>
        
        <div className="filter-group">
          <label>Price Range: ₹{filters.minPrice} - ₹{filters.maxPrice}</label>
          <div className="price-range">
            <input
              type="number"
              value={filters.minPrice}
              min="0"
              max={filters.maxPrice}
              onChange={e => setFilters({ ...filters, minPrice: Number(e.target.value) })}
              className="range-input"
            />
            <input
              type="number"
              value={filters.maxPrice}
              min={filters.minPrice}
              max="7000"
              onChange={e => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
              className="range-input"
            />
          </div>
        </div>

        <div className="filter-group">
          <label>Category</label>
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">All</option>
            <option value="clothing">Clothing</option>
            <option value="home">Home</option>
            <option value="electronics">Electronics</option>
            <option value="sports">Sports</option>
            <option value="books">Books</option>
          </select>
        </div>

        <button
          className="reset-btn"
          onClick={() => setFilters({ category: '', minPrice: 0, maxPrice: 7000 })}
        >
          🔄 Reset Filters
        </button>
      </aside>

      {/* Products Grid */}
      <main className="products">
        {loading ? (
          <div className="empty">Loading products…</div>
        ) : (
          <div className="grid">
            {items && items.length ? items.map(it => (
              <div className="card" key={it.id}>
                <div className="media">
                  <img
                    src={it.image || placeholderImage(it.name)}
                    alt={it.name}
                    onError={(e) => handleImgError(e, it.category)}
                  />
                </div>
                <h3>{it.name}</h3>
                <div className="meta">
                  <div className="category">{it.category}</div>
                  <div className="price">₹{it.price}</div>
                </div>
                <p>{it.description || 'No description provided.'}</p>
                <div className="row">
                  <button className="button" onClick={() => addToCart(it.id)}>Add to Cart</button>
                  <Link className="button secondary" to={`/product/${it.id}`}>Details</Link>
                </div>
              </div>
            )) : (
              <div className="empty">No products found. Try changing filters.</div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
