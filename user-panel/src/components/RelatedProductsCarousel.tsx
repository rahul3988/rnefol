import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getApiBase } from '../utils/apiBase'
import { getHeaders } from '../utils/session'
import PricingDisplay from './PricingDisplay'

interface RelatedProductsCarouselProps {
  productId: string | number
  type?: 'related' | 'recommended' | 'trending'
  title?: string
  className?: string
}

export default function RelatedProductsCarousel({
  productId,
  type = 'related',
  title,
  className = ''
}: RelatedProductsCarouselProps) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [scrollPosition, setScrollPosition] = useState(0)

  useEffect(() => {
    fetchRelatedProducts()
  }, [productId, type])

  const fetchRelatedProducts = async () => {
    try {
      setLoading(true)
      const apiBase = getApiBase()
      let url = ''

      if (type === 'related') {
        url = `${apiBase}/api/recommendations/related/${productId}`
      } else {
        url = `${apiBase}/api/recommendations?type=${type}&limit=8`
      }

      const response = await fetch(url, {
        credentials: 'include',
        headers: getHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        setProducts(Array.isArray(data) ? data : (data.products || []))
      }
    } catch (error) {
      console.error('Failed to fetch related products:', error)
    } finally {
      setLoading(false)
    }
  }

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById(`carousel-${type}`)
    if (!container) return

    const scrollAmount = 320 // Card width + gap
    const newPosition = direction === 'left' 
      ? scrollPosition - scrollAmount 
      : scrollPosition + scrollAmount

    container.scrollTo({
      left: Math.max(0, newPosition),
      behavior: 'smooth'
    })
    setScrollPosition(Math.max(0, newPosition))
  }

  const getDisplayTitle = () => {
    if (title) return title
    switch (type) {
      case 'related':
        return 'Complete the Routine'
      case 'recommended':
        return 'You May Also Like'
      case 'trending':
        return 'Trending Products'
      default:
        return 'Related Products'
    }
  }

  if (loading || products.length === 0) return null

  return (
    <section className={`py-8 md:py-12 ${className}`}>
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="text-2xl md:text-3xl font-serif mb-6" style={{color: '#1B4965'}}>
          {getDisplayTitle()}
        </h2>
        
        <div className="relative">
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all hover:scale-110"
            style={{backgroundColor: '#fff'}}
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" style={{color: '#1B4965'}} />
          </button>

          <div
            id={`carousel-${type}`}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onScroll={(e) => setScrollPosition(e.currentTarget.scrollLeft)}
          >
            {products.map((product) => (
              <a
                key={product.id || product.slug}
                href={`#/user/product/${product.slug}`}
                className="flex-shrink-0 w-80 bg-white rounded-lg shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {product.listImage && (
                  <div className="relative overflow-hidden aspect-square">
                    <img
                      src={product.listImage}
                      alt={product.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-medium mb-2 line-clamp-2" style={{color: '#1B4965'}}>
                    {product.title}
                  </h3>
                  <div className="mb-3">
                    <PricingDisplay product={product} />
                  </div>
                  <button
                    className="w-full px-4 py-2 text-white text-sm font-medium rounded-lg transition-all hover:scale-105"
                    style={{backgroundColor: '#4B97C9'}}
                    onClick={(e) => {
                      e.preventDefault()
                      window.location.hash = `#/user/product/${product.slug}`
                    }}
                  >
                    View Product
                  </button>
                </div>
              </a>
            ))}
          </div>

          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all hover:scale-110"
            style={{backgroundColor: '#fff'}}
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" style={{color: '#1B4965'}} />
          </button>
        </div>
      </div>
    </section>
  )
}

