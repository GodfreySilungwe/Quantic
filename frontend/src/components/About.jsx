import React from 'react'

export default function About() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h2>About Café Fausse</h2>
      <p>
        Owner: <strong>Café Fausse</strong>
      </p>
      <p>
        Email: <a href="mailto:silungwegod@gmail.com">silungwegod@gmail.com</a>
      </p>
      <p>
        Phone: <a href="tel:+265995718815">+265 99 571 8815</a>
      </p>
      <p>
        Welcome to Café Fausse — we serve carefully prepared coffee and freshly baked goods. Visit us to enjoy a relaxed atmosphere and delicious menu.
      </p>

      <section style={{ marginTop: 24 }}>
        <h3>Awards</h3>
        <ul>
          <li><strong>Local Coffee Awards 2024</strong> — Best Independent Café (Community Choice)</li>
          <li><strong>City Food Guide 2023</strong> — Recommended for Breakfast & Brunch</li>
          <li><strong>Artisan Baking Festival 2022</strong> — Best Croissant (Runner-up)</li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h3>What customers say</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          <blockquote style={{ borderLeft: '4px solid #ddd', paddingLeft: 12 }}>
            “The coffee is consistently excellent and the staff are so welcoming — my go-to spot every weekend.”
            <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>— A. Mwale</div>
          </blockquote>

          <blockquote style={{ borderLeft: '4px solid #ddd', paddingLeft: 12 }}>
            “Loved the almond croissant — perfectly flaky. Cozy space and great music.”
            <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>— J. Banda</div>
          </blockquote>

          <blockquote style={{ borderLeft: '4px solid #ddd', paddingLeft: 12 }}>
            “Quick service, friendly staff, and excellent value. Highly recommend!”
            <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>— M. Phiri</div>
          </blockquote>
        </div>
      </section>
    </div>
  )
}
