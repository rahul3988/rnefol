import React, { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface ImageZoomProps {
  images: string[]
  currentIndex: number
  onClose: () => void
  onIndexChange?: (index: number) => void
}

export default function ImageZoom({ 
  images, 
  currentIndex, 
  onClose,
  onIndexChange 
}: ImageZoomProps) {
  const [activeIndex, setActiveIndex] = useState(currentIndex)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    setActiveIndex(currentIndex)
  }, [currentIndex])

  useEffect(() => {
    if (onIndexChange) {
      onIndexChange(activeIndex)
    }
  }, [activeIndex, onIndexChange])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevious()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [])

  const handlePrevious = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
    setZoomLevel(1)
    setPosition({ x: 0, y: 0 })
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
    setZoomLevel(1)
    setPosition({ x: 0, y: 0 })
  }

  const handleImageZoom = (e: React.MouseEvent<HTMLImageElement>) => {
    if (zoomLevel === 1) {
      setZoomLevel(2)
    } else {
      setZoomLevel(1)
      setPosition({ x: 0, y: 0 })
    }
  }

  const handleImageMove = (e: React.MouseEvent<HTMLImageElement>) => {
    if (zoomLevel > 1) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 100
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 100
      setPosition({ x, y })
    }
  }

  if (!images || images.length === 0) return null

  return (
    <div 
      className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="relative max-w-7xl w-full h-full flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Previous Button */}
        {images.length > 1 && (
          <button
            onClick={handlePrevious}
            className="absolute left-4 z-50 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}

        {/* Image */}
        <div className="relative max-w-full max-h-full flex items-center justify-center">
          <img
            src={images[activeIndex]}
            alt={`Product image ${activeIndex + 1}`}
            className="max-w-full max-h-[90vh] object-contain cursor-zoom-in"
            style={{
              transform: `scale(${zoomLevel}) translate(${position.x}%, ${position.y}%)`,
              transition: zoomLevel === 1 ? 'transform 0.3s' : 'none'
            }}
            onClick={handleImageZoom}
            onMouseMove={handleImageMove}
          />
        </div>

        {/* Next Button */}
        {images.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 z-50 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2"
            aria-label="Next image"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        )}

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => {
                  setActiveIndex(index)
                  setZoomLevel(1)
                  setPosition({ x: 0, y: 0 })
                }}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  activeIndex === index 
                    ? 'border-white scale-110' 
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white bg-black/50 rounded-full px-4 py-2 text-sm">
            {activeIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  )
}

