import React from 'react'
import ItemCard from './ItemCard'

export default function Menu({ categories = [] }) {
  return (
    <div className="menu">
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
    </div>
  )
}
