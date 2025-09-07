import React, { useState, useEffect } from 'react'
import API from '../api'

export default function Cart() {
  const [cartItems, setCartItems] = useState([])
  const [detailed, setDetailed] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadCart() }, [])

  async function loadCart() {
    const token = localStorage.getItem('token')
    if (!token) {
      setDetailed([])
      setCartItems([])
      return
    }
    setLoading(true)
    try {
      const cart = await API.getCart(token)
      setCartItems(Array.isArray(cart) ? cart : [])
      const items = await API.getItems()
      const det = (Array.isArray(cart) ? cart : []).map(c => {
        const it = (Array.isArray(items) ? items : []).find(i => i.id === c.itemId) || { name: 'Unknown', price: 0, image: '' }
        return {
          ...c,
          name: it.name,
          price: it.price,
          image: it.image || (`https://via.placeholder.com/150x100.png?text=${encodeURIComponent(it.name || 'product')}`)
        }
      })
      setDetailed(det)
    } catch (e) {
      console.error(e)
      setDetailed([])
    } finally { setLoading(false) }
  }

  async function remove(itemId) {
    const token = localStorage.getItem('token')
    await API.removeFromCart(itemId, token)
    await loadCart()
  }

  async function update(itemId, qty) {
    if (qty < 1) return
    const token = localStorage.getItem('token')
    await API.updateCart(itemId, qty, token)
    await loadCart()
  }

  const total = detailed.reduce((s, i) => s + (Number(i.price || 0) * Number(i.qty || 0)), 0)

  if (!localStorage.getItem('token')) {
    return <div className="empty">Your cart is stored on the server. Please <a href="/login">login</a> to view and persist your cart.</div>
  }

  return (
    <div className="cart-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 12 }}>
        <h2>Your cart</h2>
        <div className="small muted">{detailed.length} items</div>
      </div>

      {loading ? <div className="empty">Loading…</div> :
        (detailed.length === 0 ? (
          <div className="empty">No items in cart — add some from the products page.</div>
        ) : (
          <>
            <ul className="cart-list">
              {detailed.map(it => (
                <li key={it.itemId} className="cart-item">
                  <div className="cart-item-left">
                    <div className="cart-thumb">
                      <img src={it.image} alt={it.name} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }} />
                    </div>
                    <div style={{ marginLeft: 12 }}>
                      <strong>{it.name}</strong>
                      <div className="small muted">₹{it.price}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Quantity controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => update(it.itemId, it.qty - 1)} className="qty-btn">−</button>
                      <span style={{ minWidth: 24, textAlign: 'center' }}>{it.qty}</span>
                      <button onClick={() => update(it.itemId, it.qty + 1)} className="qty-btn">+</button>
                    </div>

                    {/* Line total */}
                    <div style={{ minWidth: 100, textAlign: 'right' }}>
                      <div className="muted small">Line total</div>
                      <div style={{ fontWeight: 700 }}>₹{Number(it.price) * Number(it.qty)}</div>
                    </div>

                    <button className="remove-btn" onClick={() => remove(it.itemId)}>Remove</button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Subtotal + Checkout */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Subtotal: ₹{total}</div>
                <button className="checkout-btn">Proceed to Checkout</button>
              </div>
            </div>
          </>
        ))
      }
    </div>
  )
}
