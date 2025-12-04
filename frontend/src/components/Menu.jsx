import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ItemCard from './ItemCard'
import { useCart } from '../context/CartContext'

export default function Menu({ categories = [] }) {
  const { addToCart } = useCart()
  const [promos, setPromos] = useState([])

  useEffect(() => {
    let mounted = true

    const fetchMenu = () => {
      fetch('/api/menu')
        .then((r) => r.json())
        .then((data) => {
          if (!mounted) return
          // server returns { categories: [...], promotions: [...] }
          const cats = Array.isArray(data) ? data : (data.categories || [])
          const flat = (cats || []).flatMap((c) => (c.items || []).map((it) => ({ ...it, category: c.name })))
          // server now includes discount_percent on each item if it has an active promotion
          const promoItems = flat.filter((it) => it.discount_percent !== null && it.discount_percent !== undefined)
          if (promoItems.length > 0) {
            setPromos(promoItems.slice(0, 3))
          } else {
            setPromos([])
          }
        })
        .catch(() => {})
    }

    fetchMenu()

    // listen for admin updates (in same tab)
    const onUpdate = () => fetchMenu()
    window.addEventListener('promotions-updated', onUpdate)

    // also listen for storage events (other tabs)
    const onStorage = (e) => {
      if (e.key === 'promotions_updated_at') fetchMenu()
    }
    window.addEventListener('storage', onStorage)

    return () => {
      mounted = false
      window.removeEventListener('promotions-updated', onUpdate)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return (
    <div className="menu menu-grid">
      <aside className="promotions">
        <h3>Promotions</h3>
        <p className="muted-small">Special offers — add them quickly to your cart.</p>
        {promos.length === 0 && <p className="muted-small">No active promotions</p>}
        <ul>
          {promos.map((p) => (
            <li key={p.id} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{p.name}</div>
                  <div className="muted-small">{p.category} • {p.description}</div>
                  <div style={{ marginTop: 6 }}>
                    <small className="muted-small">{p.discount_percent}% off</small>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700 }}>{((p.price_cents * (100 - p.discount_percent)) / 10000).toFixed(2)}</div>
                  <button className="btn" onClick={() => addToCart(p, 1)} style={{ marginTop: 6 }}>Add</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      <main className="menu-main">
        {categories.map((c) => (
          <section key={c.id} className="category">
            <h2>{c.name}</h2>
            <div className="items">
              {(c.items || []).map((it) => (
                <ItemCard key={it.id} item={it} />
              ))}
            </div>
          </section>
        ))}

        <section className="home-hero" style={{ padding: 20, borderTop: '1px solid #eee', marginTop: 20 }}>
          <h1 style={{ margin: 0 }}>Café Fausse</h1>
          <p style={{ margin: '6px 0' }}>
            <strong>Email:</strong> <a href="mailto:silungwegod@gmail.com">silungwegod@gmail.com</a>
            &nbsp;•&nbsp;
            <strong>Phone:</strong> <a href="tel:(202) 555-4567">(202) 555-4567</a>
          </p>

          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div>
              <h4 style={{ margin: '6px 0' }}>Hours</h4>
              <ul style={{ marginTop: 6 }}>
                <li>Mon–Fri: 07:30 — 19:00</li>
                <li>Sat: 08:00 — 18:00</li>
                <li>Sun: 09:00 — 15:00</li>
              </ul>
            </div>

            <div>
              <h4 style={{ margin: '6px 0' }}>Quick links</h4>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Link to="/menu">View Menu</Link>
                <Link to="/cart">Your Cart</Link>
                <Link to="/reserve">Make a Reservation</Link>
                <Link to="/about">About Us</Link>
                <Link to="/gallery">Gallery</Link>
              </nav>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
