import React, { useEffect, useState } from 'react'

export default function Gallery() {
  const [images, setImages] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/gallery')
      .then((r) => r.json())
      .then(setImages)
      .catch((e) => setError(String(e)))
  }, [])

  if (error) return <div>Error loading gallery: {error}</div>

  return (
    <div>
      <h2>Gallery</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {images.map((img) => (
          <div key={img} style={{ width: 240 }}>
            <img src={`/api/images/${encodeURIComponent(img)}`} alt={img} style={{ width: '100%', borderRadius: 6 }} />
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{img}</div>
          </div>
        ))}
        {images.length === 0 && <div>No images found.</div>}
      </div>
    </div>
  )
}
