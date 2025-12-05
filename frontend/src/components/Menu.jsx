import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ItemCard from './ItemCard'
import { useCart } from '../context/CartContext'

export default function Menu({ categories = [], searchQuery = '', onSearchChange }) {
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
      <aside className="promotions" style={{ background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)', color: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(255, 107, 107, 0.3)' }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>🎉 BIG DISCOUNTS</h2>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 500, opacity: 0.95 }}>Limited-time offers on selected items</p>
        </div>

        {promos.length === 0 && (
          <div style={{ padding: '20px 0', textAlign: 'center', opacity: 0.9 }}>
            <p style={{ margin: 0, fontSize: 14 }}>No active promotions at the moment</p>
          </div>
        )}

        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {promos.map((p) => (
            <li key={p.id} style={{ marginBottom: 16, padding: '16px', background: 'rgba(255, 255, 255, 0.15)', borderRadius: '8px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{p.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>{p.category}</div>
                  <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 8, lineHeight: 1.4 }}>{p.description}</div>
                  <div style={{ display: 'inline-block', background: 'rgba(255, 255, 255, 0.25)', padding: '4px 10px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                    {p.discount_percent}% OFF
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 80 }}>
                  <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 4 }}>Now:</div>
                  <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 8 }}>${((p.price_cents * (100 - p.discount_percent)) / 10000).toFixed(2)}</div>
                  <button className="btn" onClick={() => addToCart(p, 1)} style={{ background: 'white', color: '#ff6b6b', border: 'none', padding: '8px 14px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Add</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      <main className="menu-main">
        {searchQuery ? (
          // filtered search results view
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, background: 'linear-gradient(90deg, #2b8a78 0%, #1f5a52 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>🔍 Search Results</h2>
            <div className="items">
              {categories
                .flatMap((c) =>
                  (c.items || []).map((it) => ({ ...it, category: c }))
                )
                .filter((it) =>
                  it.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  it.description.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((it) => (
                  <ItemCard key={it.id} item={it} />
                ))}
            </div>
          </section>
        ) : (
          // normal category view
          categories.map((c, idx) => {
            const colors = [
              { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', icon: '☕' },
              { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', icon: '🍰' },
              { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', icon: '🥤' },
              { bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', icon: '🌿' },
              { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', icon: '⭐' },
              { bg: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', icon: '✨' }
            ]
            const color = colors[idx % colors.length]
            return (
              <section key={c.id} className="category" style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ fontSize: 32 }}>{color.icon}</div>
                  <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, background: color.bg, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '-0.5px' }}>{c.name}</h2>
                </div>
                <div className="items">
                  {(c.items || []).map((it) => (
                    <ItemCard key={it.id} item={it} />
                  ))}
                </div>
              </section>
            )
          })
        )}

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
