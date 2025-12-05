import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function ItemDetail() {
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const { addToCart } = useCart()

  useEffect(() => {
    setLoading(true)
    fetch('/api/menu')
      .then((r) => r.json())
      .then((data) => {
        // /api/menu may return an array or an object { categories: [...], promotions: [...] }
        const cats = Array.isArray(data) ? data : (data.categories || [])
        let found = null
        for (const c of cats) {
          const f = (c.items || []).find((it) => String(it.id) === String(id))
          if (f) {
            found = f
            break
          }
        }
        setItem(found)
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div>Loading...</div>
  if (!item) return <div>Item not found</div>

  return (
    <div className="item-detail">
      <h2>{item.name}</h2>
      <p className="muted">{item.description}</p>
      <p>
        <strong>Price: </strong>
        {(item.price_cents / 100).toFixed(2)}
      </p>
      <div>
        <button onClick={() => addToCart(item, 1)}>Add to cart</button>
      </div>
    </div>
  )
}
