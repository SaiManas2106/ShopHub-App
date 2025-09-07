import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import API from '../api'

function handleImgError(e, category) {
  const img = e.currentTarget
  if (img.dataset.onerror) return
  img.dataset.onerror = '1'
  img.src = `/images/${category || 'fallback'}-fallback.jpg`
}

export default function Product() {
  const { id } = useParams()
  const nav = useNavigate()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    if (id) load()
  }, [id])

  async function load() {
    setLoading(true)
    try {
      const res = await API.getItem(id)
      setItem(res && res.id ? res : null)
    } catch (e) {
      console.error(e)
      setItem(null)
    } finally { setLoading(false) }
  }

  async function addToCart() {
    const token = localStorage.getItem('token')
    if (!token) {
      if (confirm('Please login to add to cart. Go to login?')) nav('/login')
      return
    }
    try {
      await API.addToCart(id, 1, token)
      alert('Added to cart')
    } catch (e) {
      console.error(e)
      alert('Could not add to cart')
    }
  }

  if (loading) return <div className="empty">Loading…</div>
  if (!item) return <div className="empty">Product not found.</div>

  return (
    <div style={{display:'grid', gridTemplateColumns:'360px 1fr', gap:20}}>
      <div className="card">
        <img
          src={item.image}
          alt={item.name}
          style={{width:'100%', height:300, objectFit:'cover', borderRadius:8}}
          onError={(e)=>handleImgError(e, item.category)}
        />
        <div style={{marginTop:12}}>
          <div className="muted small" style={{textTransform:'capitalize'}}>{item.category}</div>
          <h3 style={{marginTop:6}}>{item.name}</h3>
          <div className="badge" style={{display:'inline-block', marginTop:8}}>₹{item.price}</div>
        </div>
      </div>

      <div>
        <div className="card" style={{padding:20}}>
          <h3>About this product</h3>
          <p className="muted" style={{marginTop:8}}>{item.description}</p>

          <div style={{display:'flex', gap:12, marginTop:18}}>
            <button className="button" onClick={addToCart}>Add to cart</button>
            <button className="button secondary" onClick={()=>nav(-1)}>Back</button>
          </div>
        </div>
      </div>
    </div>
  )
}
