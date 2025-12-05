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
  const [promotions, setPromotions] = useState([])
  const [error, setError] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)

  // dedupe menu items for dropdowns
  const uniqueMenuItems = React.useMemo(() => {
    const map = new Map()
    for (const it of menuItems || []) map.set(it.id, it)
    return Array.from(map.values())
  }, [menuItems])

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
    } else if (tab === 'menu') {
      useAdminFetch('/api/admin/menu_items', adminSecret)
        .then(setMenuItems)
        .catch((e) => setError(e.message))
    } else if (tab === 'categories') {
      useAdminFetch('/api/admin/categories', adminSecret)
        .then(setCategories)
        .catch((e) => setError(e.message))
    } else if (tab === 'promotions') {
      // load menu items for dropdown. If admin secret is present, use admin endpoint;
      // otherwise fall back to public `/api/menu` so the dropdown still shows items.
      if (adminSecret) {
        useAdminFetch('/api/admin/menu_items', adminSecret).then(setMenuItems).catch(() => {})
        useAdminFetch('/api/admin/promotions', adminSecret).then(setPromotions).catch((e) => setError(e.message))
      } else {
        // fetch public menu and flatten items
        fetch('/api/menu')
          .then((r) => r.json())
          .then((data) => {
            // `/api/menu` may return an array or an object { categories: [...] }
            const cats = Array.isArray(data) ? data : (data.categories || [])
            const items = []
            for (const c of cats) {
              for (const it of (c.items || [])) {
                items.push({ id: it.id, name: it.name, price_cents: it.price_cents, category_id: c.id, description: it.description, available: it.available, image_filename: it.image_filename })
              }
            }
            setMenuItems(items)
          })
          .catch(() => {})
        // no admin promotions without secret
        setPromotions([])
      }
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

  // helper to perform admin requests and surface JSON/text errors
  async function fetchAdmin(path, opts = {}) {
    if (!adminSecret) return promptForSecret()
    opts.headers = { ...(opts.headers || {}), 'X-Admin-Secret': adminSecret }
    try {
      const res = await fetch(path, opts)
      const contentType = res.headers.get('content-type') || ''
      if (res.ok) {
        if (contentType.includes('application/json')) return await res.json()
        return await res.text()
      }
      // read error body if available
      let body = ''
      try {
        body = contentType.includes('application/json') ? JSON.stringify(await res.json()) : await res.text()
      } catch (e) {
        body = res.statusText
      }
      throw new Error(`HTTP ${res.status} ${res.statusText} — ${body}`)
    } catch (err) {
      // network error (CORS, connection refused, etc.)
      throw new Error(`Network error: ${err.message}`)
    }
  }

  function notifyPromotionsUpdated() {
    try {
      // notify same-window listeners
      window.dispatchEvent(new CustomEvent('promotions-updated'))
      // also write to localStorage so other tabs/windows receive the storage event
      localStorage.setItem('promotions_updated_at', String(Date.now()))
    } catch (e) {
      // ignore
    }
  }

  async function toggleAvailable(item) {
    try {
      await fetchAdmin(`/api/admin/menu_items/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ available: !item.available }) })
      setMenuItems((prev) => prev.map((m) => (m.id === item.id ? { ...m, available: !m.available } : m)))
    } catch (e) {
      setError(String(e))
    }
  }

  async function deleteItem(item) {
    if (!window.confirm(`Delete "${item.name}"?`)) return
    try {
      await fetchAdmin(`/api/admin/menu_items/${item.id}`, { method: 'DELETE' })
      setMenuItems((prev) => prev.filter((m) => m.id !== item.id))
    } catch (e) {
      setError(String(e))
    }
  }

  async function updateItem(item, updates) {
    try {
      if (updates && updates.imageFile) {
        const formData = new FormData()
        if ('name' in updates) formData.append('name', updates.name)
        if ('price_cents' in updates) formData.append('price_cents', updates.price_cents)
        if ('available' in updates) formData.append('available', updates.available)
        formData.append('category_id', updates.category_id || item.category_id || '')
        formData.append('description', updates.description || item.description || '')
        formData.append('image', updates.imageFile)
        await fetchAdmin(`/api/admin/menu_items/${item.id}`, { method: 'PUT', body: formData })
      } else {
        await fetchAdmin(`/api/admin/menu_items/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) })
      }
      // refresh list from server to pick up any image_filename changes
      const items = await useAdminFetch('/api/admin/menu_items', adminSecret)
      setMenuItems(items)
      setEditingItem(null)
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
      const formData = new FormData()
      formData.append('name', name)
      formData.append('price_cents', price)
      formData.append('description', description)
      if (category_id) formData.append('category_id', category_id)
      // include image file if present
      if (form.image && form.image.files && form.image.files[0]) {
        formData.append('image', form.image.files[0])
      }

      await fetchAdmin('/api/admin/menu_items', { method: 'POST', body: formData })
      // refresh list
      const items = await useAdminFetch('/api/admin/menu_items', adminSecret)
      setMenuItems(items)
      setEditingItem(null)
      form.reset()
    } catch (e) {
      setError(String(e))
    }
  }

  async function createCategory(e) {
    e.preventDefault()
    const form = e.target
    const name = form.cat_name.value
    const position = form.cat_position ? parseInt(form.cat_position.value, 10) : 0
    if (!name) return setError('category name required')
    try {
      await fetchAdmin('/api/admin/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, position }) })
      const cats = await useAdminFetch('/api/admin/categories', adminSecret)
      setCategories(cats)
      setEditingCategory(null)
      form.reset()
    } catch (e) {
      setError(String(e))
    }
  }

  async function updateCategory(cat, updates) {
    try {
      await fetchAdmin(`/api/admin/categories/${cat.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) })
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, ...updates } : c)))
      setEditingCategory(null)
    } catch (e) {
      setError(String(e))
    }
  }

  async function deleteCategory(cat) {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return
    try {
      await fetchAdmin(`/api/admin/categories/${cat.id}`, { method: 'DELETE' })
      setCategories((prev) => prev.filter((c) => c.id !== cat.id))
    } catch (e) {
      setError(String(e))
    }
  }

  function notifyPromotionsUpdated() {
    try {
      window.dispatchEvent(new CustomEvent('promotions-updated'))
      localStorage.setItem('promotions_updated_at', String(Date.now()))
    } catch (e) {
      // ignore
    }
  }

  async function togglePromoActive(promo) {
    try {
      await fetchAdmin(`/api/admin/promotions/${promo.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !promo.active }) })
      setPromotions((prev) => prev.map((p) => (p.id === promo.id ? { ...p, active: !p.active } : p)))
      notifyPromotionsUpdated()
    } catch (e) {
      setError(String(e))
    }
  }

  async function updatePromoPercent(promo) {
    const newPct = window.prompt('Discount percent (0-100)', String(promo.percent))
    if (newPct === null) return
    try {
      await fetchAdmin(`/api/admin/promotions/${promo.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ percent: parseInt(newPct, 10) }) })
      setPromotions((prev) => prev.map((p) => (p.id === promo.id ? { ...p, percent: parseInt(newPct, 10) } : p)))
      notifyPromotionsUpdated()
    } catch (e) {
      setError(String(e))
    }
  }

  async function deletePromo(promo) {
    const item = menuItems.find((m) => m.id === promo.menu_item_id)
    const itemName = item ? item.name : `item ${promo.menu_item_id}`
    if (!window.confirm(`Delete promotion for "${itemName}"?`)) return
    try {
      await fetchAdmin(`/api/admin/promotions/${promo.id}`, { method: 'DELETE' })
      setPromotions((prev) => prev.filter((p) => p.id !== promo.id))
      notifyPromotionsUpdated()
    } catch (e) {
      setError(String(e))
    }
  }

  async function createPromo(e) {
    e.preventDefault()
    const form = e.target
    const menu_item_id = parseInt(form.menu_item_id.value, 10)
    const percent = parseInt(form.percent.value, 10)
    const active = form.active.checked
    if (!menu_item_id || isNaN(percent)) return setError('invalid inputs')
    try {
      await fetchAdmin('/api/admin/promotions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ menu_item_id, percent, active }) })
      const promos = await useAdminFetch('/api/admin/promotions', adminSecret)
      setPromotions(promos)
      form.reset()
      notifyPromotionsUpdated()
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
            <button onClick={() => setTab('categories')} disabled={tab === 'categories'} style={{ marginLeft: 8 }}>Categories</button>
            <button onClick={() => setTab('menu')} disabled={tab === 'menu'} style={{ marginLeft: 8 }}>Menu Items</button>
            <button onClick={() => setTab('promotions')} disabled={tab === 'promotions'} style={{ marginLeft: 8 }}>Promotions</button>
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

          {tab === 'categories' && (
            <div>
              <h3>Categories</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Position</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id}>
                      <td>
                        {editingCategory?.id === c.id ? (
                          <input
                            type="text"
                            defaultValue={c.name}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') updateCategory(c, { name: e.target.value })
                            }}
                          />
                        ) : (
                          c.name
                        )}
                      </td>
                      <td>{c.position}</td>
                      <td style={{ display: 'flex', gap: 8 }}>
                        {editingCategory?.id === c.id ? (
                          <>
                            <button onClick={() => updateCategory(c, { name: editingCategory.name })}>Save</button>
                            <button onClick={() => setEditingCategory(null)}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => setEditingCategory(c)}>Edit</button>
                            <button onClick={() => deleteCategory(c)} style={{ background: '#d9534f', color: 'white' }}>Delete</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h4 style={{ marginTop: 12 }}>Create new category</h4>
              <form onSubmit={createCategory}>
                <div>
                  <input name="cat_name" placeholder="Category name" required />
                </div>
                <div>
                  <input name="cat_position" type="number" placeholder="Position (default 0)" defaultValue={0} />
                </div>
                <div style={{ marginTop: 8 }}>
                  <button type="submit">Create</button>
                </div>
              </form>
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
                    editingItem?.id === m.id ? (
                      <tr key={m.id}>
                        <td><input type="text" defaultValue={m.name} placeholder="Name" /></td>
                        <td><input type="number" defaultValue={(m.price_cents/100).toFixed(2)} placeholder="Price" step="0.01" /></td>
                        <td><input type="checkbox" defaultChecked={m.available} /></td>
                        <td style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input type="file" accept="image/*" />
                          <button onClick={(e) => {
                            const row = e.target.closest('tr')
                            const name = row.querySelector('input[type="text"]').value
                            const priceVal = row.querySelector('input[type="number"]').value
                            const available = row.querySelector('input[type="checkbox"]').checked
                            const fileInput = row.querySelector('input[type="file"]')
                            const file = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null
                            const updates = {
                              name,
                              price_cents: Math.round(parseFloat(priceVal) * 100),
                              available,
                            }
                            if (file) updates.imageFile = file
                            updateItem(m, updates)
                          }}>Save</button>
                          <button onClick={() => setEditingItem(null)}>Cancel</button>
                        </td>
                      </tr>
                    ) : (
                      <tr key={m.id}>
                        <td>{m.name}</td>
                        <td>{(m.price_cents/100).toFixed(2)}</td>
                        <td>{m.available ? 'yes' : 'no'}</td>
                        <td style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => toggleAvailable(m)}>{m.available ? 'Disable' : 'Enable'}</button>
                          <button onClick={() => setEditingItem(m)}>Edit</button>
                          <button onClick={() => deleteItem(m)} style={{ background: '#d9534f', color: 'white' }}>Delete</button>
                        </td>
                      </tr>
                    )
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
                <div>
                  <label>Image</label>
                  <input type="file" name="image" accept="image/*" />
                </div>
                <div style={{ marginTop: 8 }}>
                  <button type="submit">Create</button>
                </div>
              </form>
            </div>
          )}

          {tab === 'promotions' && (
            <div>
              <h3>Promotions</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Discount %</th>
                    <th>Active</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {promotions.map((p) => {
                    const item = menuItems.find((m) => m.id === p.menu_item_id)
                    const itemName = item ? item.name : `item ${p.menu_item_id}`
                    return (
                      <tr key={p.id}>
                        <td>{itemName}</td>
                        <td>{p.percent}%</td>
                        <td>{p.active ? 'yes' : 'no'}</td>
                        <td style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => togglePromoActive(p)}>{p.active ? 'Disable' : 'Enable'}</button>
                          <button onClick={() => updatePromoPercent(p)}>Edit %</button>
                          <button onClick={() => deletePromo(p)} style={{ background: '#d9534f', color: 'white' }}>Delete</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              <h4 style={{ marginTop: 12 }}>Create promotion for item</h4>
              <form onSubmit={createPromo}>
                <div>
                  <select name="menu_item_id" required>
                    <option value="">-- select item --</option>
                    {menuItems.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} — ${(m.price_cents / 100).toFixed(2)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <input name="percent" type="number" min="0" max="100" placeholder="Discount %" required />
                </div>
                <div><label><input name="active" type="checkbox" defaultChecked /> Active</label></div>
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
