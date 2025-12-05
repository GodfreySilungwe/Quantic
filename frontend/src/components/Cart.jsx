import React, { useState } from 'react'
import { useCart } from '../context/CartContext'

export default function Cart() {
  const { items, clearCart, addToCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [orderId, setOrderId] = useState(null)
  const [customer, setCustomer] = useState({ customer_name: '', customer_email: '', customer_phone: '' })
  const [error, setError] = useState(null)

  const totalCents = items.reduce((s, it) => s + (it.price_cents || 0) * (it.qty || 1), 0)
  
  // Calculate original price (before any discounts)
  const originalTotalCents = items.reduce((s, it) => {
    const orig = it.original_price_cents || it.price_cents || 0
    return s + orig * (it.qty || 1)
  }, 0)
  
  const savings = originalTotalCents - totalCents

  async function handleCheckout(e) {
    e.preventDefault()
    setError(null)
    if (!customer.customer_name) {
      setError('Please enter your name')
      return
    }
    const payload = {
      items: items.map((it) => ({ menu_item_id: it.id, qty: it.qty })),
      ...customer,
    }
    setLoading(true)
    try {
      const res = await fetch('/api/cart/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Checkout failed')
      } else {
        setOrderId(data.order_id)
        clearCart()
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  // promotions removed from Cart; promos are shown on main Menu page now

  if (orderId)
    return (
      <div>
        <h2>Thank you!</h2>
        <p>Your order id: {orderId}</p>
      </div>
    )

  return (
    <div className="cart">
      <main className="cart-main">
        <h2>Cart</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <div className="muted-small">{items.length === 0 ? 'Your cart is empty' : `${items.length} item(s)`}</div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button type="button" className="btn" onClick={() => {
              if (!items.length) return
              if (window.confirm('Clear cart?')) clearCart()
            }}>Clear cart</button>
          </div>
        </div>

        <ul>
          {items.map((it) => {
            const hasDiscount = it.discount_percent && it.discount_percent > 0
            const originalPrice = it.original_price_cents ? (it.original_price_cents / 100).toFixed(2) : null
            const discountedPrice = (it.price_cents / 100).toFixed(2)
            return (
              <li key={it.id} style={{ marginBottom: 12, padding: 8, backgroundColor: hasDiscount ? '#f0f8ff' : 'transparent', borderRadius: 4, border: hasDiscount ? '1px solid #e0f0ff' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <strong>{it.name}</strong> x {it.qty}
                    {hasDiscount && <span style={{ marginLeft: 8, color: '#ff6b6b', fontWeight: 600, fontSize: 12 }}>🎉 {it.discount_percent}% OFF</span>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {hasDiscount && originalPrice && (
                      <div style={{ fontSize: 12, color: '#999', textDecoration: 'line-through' }}>
                        ${originalPrice} each
                      </div>
                    )}
                    <div>{discountedPrice} each</div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        <p>
          <strong>Total: </strong>
          {(totalCents / 100).toFixed(2)}
          {savings > 0 && (
            <span style={{ marginLeft: 12, color: '#ff6b6b', fontWeight: 600 }}>
              💰 You saved: ${(savings / 100).toFixed(2)}
            </span>
          )}
        </p>

        <form onSubmit={handleCheckout} style={{ maxWidth: 480 }}>
          <div>
            <label>Name</label>
            <input value={customer.customer_name} onChange={(e) => setCustomer({ ...customer, customer_name: e.target.value })} />
          </div>
          <div>
            <label>Email</label>
            <input value={customer.customer_email} onChange={(e) => setCustomer({ ...customer, customer_email: e.target.value })} />
          </div>
          <div>
            <label>Phone</label>
            <input value={customer.customer_phone} onChange={(e) => setCustomer({ ...customer, customer_phone: e.target.value })} />
          </div>
          {error && <div style={{ color: 'red' }}>{error}</div>}
          <div style={{ marginTop: 12 }}>
            <button type="submit" disabled={loading || items.length === 0}>{loading ? 'Processing...' : 'Checkout'}</button>
          </div>
        </form>
      </main>
    </div>
  )
}
