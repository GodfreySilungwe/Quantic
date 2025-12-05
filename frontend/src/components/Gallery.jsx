import React, { useEffect, useState } from 'react'

export default function Gallery() {
  const [images, setImages] = useState([])
  const [error, setError] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(null)

  useEffect(() => {
    fetch('/api/gallery')
      .then((r) => r.json())
      .then(setImages)
      .catch((e) => setError(String(e)))
  }, [])

  // Handle keyboard navigation
  useEffect(() => {
    if (selectedIndex === null) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedIndex(null)
      if (e.key === 'ArrowLeft') setSelectedIndex((prev) => (prev - 1 + images.length) % images.length)
      if (e.key === 'ArrowRight') setSelectedIndex((prev) => (prev + 1) % images.length)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedIndex, images.length])

  const openLightbox = (index) => setSelectedIndex(index)
  const closeLightbox = () => setSelectedIndex(null)
  const prevImage = () => setSelectedIndex((prev) => (prev - 1 + images.length) % images.length)
  const nextImage = () => setSelectedIndex((prev) => (prev + 1) % images.length)

  if (error) return <div>Error loading gallery: {error}</div>

  const currentImg = selectedIndex !== null ? images[selectedIndex] : null
  const currentUrl = currentImg ? `/api/images/${encodeURIComponent(currentImg)}` : ''

  return (
    <div>
      <h2>Gallery</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {images.map((img, idx) => (
          <div
            key={img}
            style={{
              width: 240,
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
              position: 'relative'
            }}
            onClick={() => openLightbox(idx)}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <img
              src={`/api/images/${encodeURIComponent(img)}`}
              alt={img}
              style={{ width: '100%', borderRadius: 6, display: 'block' }}
            />
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{img}</div>
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0)',
              borderRadius: 6,
              transition: 'backgroundColor 0.2s ease',
              pointerEvents: 'none'
            }} className="gallery-hover">
              <span style={{ color: 'white', fontSize: 14, fontWeight: 'bold', opacity: 0 }} className="zoom-icon">🔍 View</span>
            </div>
          </div>
        ))}
        {images.length === 0 && <div>No images found.</div>}
      </div>

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease'
          }}
          onClick={closeLightbox}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closeLightbox}
              style={{
                position: 'absolute',
                top: -40,
                right: 0,
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: 28,
                cursor: 'pointer',
                padding: 0,
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'opacity 0.2s ease'
              }}
              onMouseEnter={(e) => (e.target.style.opacity = '0.7')}
              onMouseLeave={(e) => (e.target.style.opacity = '1')}
              title="Close (ESC)"
            >
              ✕
            </button>

            {/* Main image */}
            <img
              src={currentUrl}
              alt={currentImg}
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: 8,
                animation: 'slideIn 0.3s ease'
              }}
            />

            {/* Previous button */}
            <button
              onClick={prevImage}
              style={{
                position: 'absolute',
                left: -60,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                fontSize: 32,
                cursor: 'pointer',
                padding: '10px 15px',
                borderRadius: 4,
                transition: 'background 0.2s ease',
                display: images.length > 1 ? 'block' : 'none'
              }}
              onMouseEnter={(e) => (e.target.style.background = 'rgba(255, 255, 255, 0.4)')}
              onMouseLeave={(e) => (e.target.style.background = 'rgba(255, 255, 255, 0.2)')}
              title="Previous (←)"
            >
              ‹
            </button>

            {/* Next button */}
            <button
              onClick={nextImage}
              style={{
                position: 'absolute',
                right: -60,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                fontSize: 32,
                cursor: 'pointer',
                padding: '10px 15px',
                borderRadius: 4,
                transition: 'background 0.2s ease',
                display: images.length > 1 ? 'block' : 'none'
              }}
              onMouseEnter={(e) => (e.target.style.background = 'rgba(255, 255, 255, 0.4)')}
              onMouseLeave={(e) => (e.target.style.background = 'rgba(255, 255, 255, 0.2)')}
              title="Next (→)"
            >
              ›
            </button>

            {/* Image counter */}
            {images.length > 1 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: -40,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  color: 'white',
                  fontSize: 14,
                  whiteSpace: 'nowrap'
                }}
              >
                {selectedIndex + 1} / {images.length}
              </div>
            )}

            {/* Image filename */}
            <div
              style={{
                position: 'absolute',
                bottom: -40,
                right: 0,
                color: '#aaa',
                fontSize: 12,
                maxWidth: 300,
                textAlign: 'right',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {currentImg}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
