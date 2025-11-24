import React, { useState } from 'react'

export default function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus(null)
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'signup failed')
      if (data.status === 'already_subscribed') {
        setStatus('You are already subscribed.')
      } else {
        setStatus('Thanks for subscribing!')
      }
      setEmail('')
    } catch (err) {
      setStatus(String(err))
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
      <input type="email" placeholder="your email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '4px 8px' }} />
      <button type="submit">Subscribe</button>
      {status && <span style={{ marginLeft: 8 }}>{status}</span>}
    </form>
  )
}
