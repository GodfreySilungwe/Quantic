import React, { useEffect, useState } from 'react'

function useAdminFetch(path, adminSecret) {
  return fetch(path, { headers: { 'X-Admin-Secret': adminSecret } }).then(async (r) => {
    if (!r.ok) {
      const err = await r.json().catch(() => ({}))
      throw new Error(err.error || `HTTP ${r.status}`)
    }
    return r.json()
  })
}

export default function AdminDashboard() {
  const [adminSecret, setAdminSecret] = useState(localStorage.getItem('admin_secret') || '')
  const [tab, setTab] = useState('orders')
  const [orders, setOrders] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!adminSecret) return
    setError(null)
    // fetch categories for the create form / mapping
    // If adminSecret is available, prefer the admin endpoint. Otherwise fall back to the public /api/menu
    const fetchCats = adminSecret
      ? () => useAdminFetch('/api/admin/categories', adminSecret)
      : () => fetch('/api/menu').then((r) => r.json()).then((cats) => cats.map((c) => ({ id: c.id, name: c.name })))

    fetchCats()
      .then(setCategories)
      .catch(() => {})

    if (tab === 'orders') {
      useAdminFetch('/api/admin/orders', adminSecret)
        .then(setOrders)
        .catch((e) => setError(e.message))
    } else {
      useAdminFetch('/api/admin/menu_items', adminSecret)
        .then(setMenuItems)
        .catch((e) => setError(e.message))
    }
  }, [tab, adminSecret])

  function promptForSecret() {
    const s = window.prompt('Enter admin secret (dev)')
    if (s) {
      localStorage.setItem('admin_secret', s)
      setAdminSecret(s)
      setError(null)
    }
  }

  async function toggleAvailable(item) {
    if (!adminSecret) return promptForSecret()
    try {
      const res = await fetch(`/api/admin/menu_items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': adminSecret },
        body: JSON.stringify({ available: !item.available }),
      })
      if (!res.ok) throw new Error('update failed')
      setMenuItems((prev) => prev.map((m) => (m.id === item.id ? { ...m, available: !m.available } : m)))
    } catch (e) {
      setError(String(e))
    }
  }

  async function createItem(e) {
    e.preventDefault()
    const form = e.target
    const name = form.name.value
    const price = Math.round(parseFloat(form.price.value) * 100)
    const description = form.description.value
    const categoryVal = form.category_id ? form.category_id.value : ''
    const category_id = categoryVal ? parseInt(categoryVal, 10) : null
    if (!name || isNaN(price)) return setError('invalid inputs')
    try {
      const res = await fetch('/api/admin/menu_items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': adminSecret },
        body: JSON.stringify({ name, price_cents: price, description, category_id }),
      })
      if (!res.ok) throw new Error('create failed')
      const data = await res.json()
      // refresh list
      const items = await useAdminFetch('/api/admin/menu_items', adminSecret)
      setMenuItems(items)
      form.reset()
    } catch (e) {
      setError(String(e))
    }
  }

  return (
    <div>
      <h2>Admin Dashboard</h2>
      {!adminSecret && (
        <div>
          <p>This area is protected by a simple dev secret.</p>
          <button onClick={promptForSecret}>Enter admin secret</button>
        </div>
      )}

      {adminSecret && (
        <div>
          <div style={{ marginBottom: 12 }}>
            <button onClick={() => setTab('orders')} disabled={tab === 'orders'}>Orders</button>
            <button onClick={() => setTab('menu')} disabled={tab === 'menu'} style={{ marginLeft: 8 }}>Menu</button>
          </div>

          {error && <div style={{ color: 'red' }}>{error}</div>}

          {tab === 'orders' && (
            <div>
              <h3>Recent Orders</h3>
              {orders.length === 0 && <p>No orders</p>}
              <ul>
                {orders.map((o) => (
                  <li key={o.id} style={{ marginBottom: 8 }}>
                    <strong>#{o.id}</strong> — {o.customer_name} — {(o.total_cents/100).toFixed(2)} — {o.status}
                    <div>
                      {o.items.map((it, idx) => (
                        <div key={idx}>item {it.menu_item_id} x {it.qty} @ {(it.unit_price_cents/100).toFixed(2)}</div>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tab === 'menu' && (
            <div>
              <h3>Menu Items</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Available</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {menuItems.map((m) => (
                    <tr key={m.id}>
                      <td>{m.name}</td>
                      <td>{(m.price_cents/100).toFixed(2)}</td>
                      <td>{m.available ? 'yes' : 'no'}</td>
                      <td><button onClick={() => toggleAvailable(m)}>{m.available ? 'Disable' : 'Enable'}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h4 style={{ marginTop: 12 }}>Create new item</h4>
              <form onSubmit={createItem}>
                <div>
                  <input name="name" placeholder="Name" />
                </div>
                <div>
                  <input name="price" placeholder="Price (e.g. 3.50)" />
                </div>
                <div>
                  <select name="category_id">
                    <option value="">-- select category --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <input name="description" placeholder="Description" />
                </div>
                <div style={{ marginTop: 8 }}>
                  <button type="submit">Create</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
