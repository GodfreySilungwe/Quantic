import React from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'


export default function ItemCard({ item }) {
  const { addToCart } = useCart()
  const img = item && item.image_filename ? item.image_filename : null

  return (
    <div className="item-card">
      {img ? (
        <div
          className="thumb"
          style={{ backgroundImage: `url(/api/images/${img})` }}
          aria-hidden
        />
      ) : null}

      <div className="card-content">
        <h3 className="card-title">
          <Link to={`/item/${item.id}`}>{item.name}</Link>
        </h3>
        <p className="muted card-desc">{item.description}</p>

        <div className="item-row" style={{ marginTop: 12 }}>
          <strong>{(item.price_cents / 100).toFixed(2)}</strong>
          <div>
            <button onClick={() => addToCart(item, 1)} className="btn">Add</button>
          </div>
        </div>
      </div>
    </div>
  )
}
