import React from 'react'
import { useCart } from '../context/CartContext'

export default function ItemCard({ item }) {
  const { addToCart } = useCart()

  return (
    <div className="item-card">
      <h3>{item.name}</h3>
      <p className="muted">{item.description}</p>
      <div className="item-row">
        <strong>{(item.price_cents / 100).toFixed(2)}</strong>
        <button onClick={() => addToCart(item, 1)}>Add</button>
      </div>
    </div>
  )
}
