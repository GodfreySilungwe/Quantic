import React, { useEffect, useState } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Menu from './components/Menu'
import ItemDetail from './components/ItemDetail'
import Cart from './components/Cart'
import About from './components/About'
import Reservation from './components/Reservation'
import NewsletterSignup from './components/NewsletterSignup'
import Gallery from './components/Gallery'
// lazy-load admin dashboard
const AdminDashboardLazy = React.lazy(() => import('./components/AdminDashboard'))
import { CartProvider, useCart } from './context/CartContext'

function HeaderBar() {
  const { items } = useCart()
  const total = items.reduce((s, i) => s + (i.qty || 0), 0)
  const badgeStyle = {
    display: 'inline-block',
    minWidth: 20,
    padding: '2px 6px',
    borderRadius: 12,
    background: '#ff6b6b',
    color: 'white',
    fontSize: 12,
    marginLeft: 6
  }

  return (
    <header className="app-header">
      <Link to="/">Home</Link>
      <Link to="/cart">Cart{total > 0 && <span style={badgeStyle}>{total}</span>}</Link>
      <Link to="/about">About</Link>
      <Link to="/reserve">Reserve</Link>
      <Link to="/admin">Admin</Link>
      <Link to="/gallery">Gallery</Link>
      <div style={{ marginLeft: 12 }}>
        <NewsletterSignup />
      </div>
    </header>
  )
}

function App() {
  const [categories, setCategories] = useState([])

  useEffect(() => {
    fetch('/api/menu')
      .then((r) => r.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error('Failed to load menu:', err))
  }, [])

  return (
    <CartProvider>
      <HeaderBar />

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Menu categories={categories} />} />
          <Route path="/about" element={<About />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/reserve" element={<Reservation />} />
          <Route path="/item/:id" element={<ItemDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route
            path="/admin"
            element={
              // lazy import AdminDashboard to avoid loading admin code in normal user flows
              <React.Suspense fallback={<div>Loading admin…</div>}>
                <AdminDashboardLazy />
              </React.Suspense>
            }
          />
        </Routes>
      </main>
    </CartProvider>
  )
}

export default App

