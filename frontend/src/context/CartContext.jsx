import React, { createContext, useContext, useEffect, useState } from 'react'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem('cart')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  function addToCart(item, qty = 1) {
    setItems((prev) => {
      const found = prev.find((p) => p.id === item.id)
      if (found) {
        return prev.map((p) => (p.id === item.id ? { ...p, qty: p.qty + qty } : p))
      }
      return [...prev, { id: item.id, name: item.name, price_cents: item.price_cents, qty }]
    })
  }

  function clearCart() {
    setItems([])
  }

  return (
    <CartContext.Provider value={{ items, addToCart, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
