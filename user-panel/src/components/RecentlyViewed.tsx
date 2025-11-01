import React, { useState, useEffect } from 'react'
import { getApiBase } from '../utils/apiBase'
import { getHeaders, getSessionId } from '../utils/session'
import { useAuth } from '../contexts/AuthContext'
import PricingDisplay from './PricingDisplay'

interface RecentlyViewedProps {
  limit?: number
  className?: string
}

export default function RecentlyViewed({ 
  limit = 8,
  className = '' 
}: RecentlyViewedProps) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    fetchRecentlyViewed()
    
    // Sync localStorage with backend
    syncLocalStorageToBackend()
  }, [isAuthenticated])

  const syncLocalStorageToBackend = async () => {
    try {
      const localViewed = JSON.parse(localStorage.getItem('recently_viewed') || '[]')
      if (localViewed.length === 0) return

      const apiBase = getApiBase()
      for (const productId of localViewed.slice(0, 10)) {
        try {
          await fetch(`${apiBase}/api/products/${productId}/view`, {
            method: 'POST',
            credentials: 'include',
            headers: getHeaders(),
            body: JSON.stringify({ source: 'localStorage_sync' })
          })
        } catch (err) {
          console.error('Failed to sync product view:', err)
        }
      }
    } catch (error) {
      console.error('Failed to sync localStorage:', error)
    }
  }

  const fetchRecentlyViewed = async () => {
    try {
      setLoading(true)
      const apiBase = getApiBase()
      
      // First try from localStorage
      const localViewed = JSON.parse(localStorage.getItem('recently_viewed') || '[]')
      
      // Then fetch from backend if authenticated
      if (isAuthenticated) {
        const response = await fetch(`${apiBase}/api/recommendations/recently-viewed?limit=${limit}`, {
          credentials: 'include',
          headers: getHeaders()
        })

        if (response.ok) {
          const data = await response.json()
          if (Array.isArray(data) && data.length > 0) {
            setProducts(data)
            return
          }
        }
      }

      // Fallback to localStorage data
      if (localViewed.length > 0) {
        const apiBase = getApiBase()
        const productPromises = localViewed.slice(0, limit).map(async (productId: string) => {
          try {
            const res = await fetch(`${apiBase}/api/products/${productId}`, {
              credentials: 'include',
              headers: getHeaders()
            })
            if (res.ok) {
              return await res.json()
            }
          } catch (err) {
            console.error('Failed to fetch product:', err)
          }
          return null
        })

        const fetchedProducts = (await Promise.all(productPromises)).filter(Boolean)
        setProducts(fetchedProducts)
      }
    } catch (error) {
      console.error('Failed to fetch recently viewed:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateLocalStorage = (productId: string | number) => {
    try {
      const current = JSON.parse(localStorage.getItem('recently_viewed') || '[]')
      const updated = [String(productId), ...current.filter((id: string) => id !== String(productId))].slice(0, 20)
      localStorage.setItem('recently_viewed', JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to update localStorage:', error)
    }
  }

  useEffect(() => {
    // Listen for product views
    const handleProductView = (e: CustomEvent) => {
      const productId = e.detail?.productId
      if (productId) {
        updateLocalStorage(productId)
        fetchRecentlyViewed()
      }
    }

    window.addEventListener('product-viewed' as any, handleProductView as EventListener)
    return () => {
      window.removeEventListener('product-viewed' as any, handleProductView as EventListener)
    }
  }, [])

  if (loading || products.length === 0) return null

  return (
    <section className={`py-8 md:py-12 ${className}`}>
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="text-2xl md:text-3xl font-serif mb-6" style={{color: '#1B4965'}}>
          Recently Viewed
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {products.slice(0, limit).map((product) => (
            <a
              key={product.id || product.slug}
              href={`#/user/product/${product.slug}`}
              className="bg-white rounded-lg shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
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
              <div className="p-3">
                <h3 className="text-sm font-medium mb-2 line-clamp-2" style={{color: '#1B4965'}}>
                  {product.title}
                </h3>
                <PricingDisplay product={product} />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

