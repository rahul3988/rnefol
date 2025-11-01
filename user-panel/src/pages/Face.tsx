import React, { useState, useEffect } from 'react'
import { getApiBase } from '../utils/apiBase'
import { Heart, Star, ShoppingCart } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import PricingDisplay from '../components/PricingDisplay'

interface Product {
  id?: number
  slug: string
  title: string
  category: string
  price: string
  list_image: string
  description: string
  created_at?: string
  details?: {
    mrp?: string
    websitePrice?: string
    discountPercent?: string
    [key: string]: any
  }
}

export default function Face() {
  const { addItem } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const [csvProducts, setCsvProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const apiBase = getApiBase()
      const response = await fetch(`${apiBase}/api/products`)
      if (response.ok) {
        const data = await response.json()
        // Filter products for face category - ONLY show products tagged as Face Care
        const faceProducts = data.filter((product: any) => {
          const category = (product.category || '').toLowerCase()
          return category === 'face care' || category === 'facecare'
        })
        setProducts(faceProducts)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  // Helper function to create simplified product data from CSV for listings
  const getSimplifiedProductData = (csvProduct: any) => {
    return {
      slug: csvProduct['Product Name']?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || '',
      title: csvProduct['Product Name'] || '',
      brand: csvProduct['Brand Name'] || 'NEFOL',
      mrp: csvProduct['MRP '] || csvProduct['MRP'] || '',
      websitePrice: csvProduct['website price'] || '',
      category: 'Face Care'
    }
  }

  return (
    <main className="py-10 min-h-screen overflow-x-hidden" style={{ backgroundColor: '#F4F9F9' }}>
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6" style={{ color: '#1B4965' }}>
            Face Care Products
          </h1>
          <p className="text-xl max-w-3xl mx-auto" style={{ color: '#9DB4C0' }}>
            Discover our range of natural face care products designed to enhance your natural beauty.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {loading ? (
            <div className="col-span-full text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p style={{ color: '#9DB4C0' }}>Loading face care products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <div className="rounded-2xl p-12" style={{ backgroundColor: '#D0E8F2' }}>
                <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#4B97C9' }}>
                  <Heart className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4" style={{ color: '#1B4965' }}>
                  Coming Soon!
                </h3>
                <p className="text-xl mb-6" style={{ color: '#9DB4C0' }}>
                  We're working on amazing face care products for you.
                </p>
                <div className="bg-white rounded-lg p-6 inline-block">
                  <p className="text-lg font-semibold" style={{ color: '#1B4965' }}>
                    🚀 Upcoming Very Soon
                  </p>
                </div>
              </div>
            </div>
          ) : (
            products.map((product, index) => {
              return (
                <div key={product.slug} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow group cursor-pointer flex flex-col" onClick={() => window.location.hash = `#/user/product/${product.slug}`}>
                  <div className="relative">
                    <img 
                      src={product.list_image}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }} 
                      alt={product.title}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4">
                      <button className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg" onClick={(e) => e.stopPropagation()}>
                        <Heart className="w-4 h-4" style={{ color: '#1B4965' }} />
                      </button>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col h-full">
                    <h3 className="text-lg font-bold mb-2 line-clamp-2" style={{ color: '#1B4965' }}>
                      {product.title}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: '#9DB4C0' }}>
                      {product.category || 'Premium face care product'}
                    </p>
                    <div className="mt-auto pt-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-col">
                          <PricingDisplay 
                            product={product} 
                            csvProduct={undefined}
                            className="text-2xl"
                          />
                        </div>
                        <button 
                          className="text-white px-4 py-2 rounded-lg transition-colors flex items-center whitespace-nowrap" 
                          style={{ backgroundColor: '#4B97C9' }} 
                          onClick={(e) => {
                            e.stopPropagation()
                            addItem({
                              slug: product.slug,
                              title: product.title,
                              price: product.price,
                              listImage: product.list_image,
                              pdpImages: [],
                              category: product.category,
                              description: product.description
                            })
                            // Show success feedback
                            const button = e.currentTarget
                            const originalText = button.textContent
                            button.textContent = 'Added!'
                            button.style.backgroundColor = '#10B981'
                            setTimeout(() => {
                              button.textContent = originalText
                              button.style.backgroundColor = '#4B97C9'
                            }, 1500)
                          }}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Benefits Section */}
        <div className="rounded-2xl p-8 mb-16" style={{ backgroundColor: '#D0E8F2' }}>
          <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: '#1B4965' }}>
            Why Choose Nefol Face Care?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#4B97C9' }}>
                <span className="text-2xl">🌸</span>
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#1B4965' }}>
                Brightening Formula
              </h3>
              <p className="text-sm" style={{ color: '#9DB4C0' }}>
                Vitamin C and natural extracts help brighten dull skin and boost collagen production.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#4B97C9' }}>
                <span className="text-2xl">💧</span>
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#1B4965' }}>
                Deep Hydration
              </h3>
              <p className="text-sm" style={{ color: '#9DB4C0' }}>
                Green tea and White tea provide deep hydration to prevent wrinkles and fine lines.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#4B97C9' }}>
                <span className="text-2xl">🛡️</span>
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#1B4965' }}>
                Gentle & Safe
              </h3>
              <p className="text-sm" style={{ color: '#9DB4C0' }}>
                Suitable for all skin types including sensitive and acne-prone skin.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center rounded-2xl p-12 text-white" style={{ backgroundColor: '#4B97C9' }}>
          <h2 className="text-3xl font-bold mb-4">Ready to Glow?</h2>
          <p className="text-xl mb-8 opacity-90">
            Transform your skincare routine with Nefol's natural face care products.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#/user/shop" 
              className="inline-block bg-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors" style={{ color: '#4B97C9' }}
            >
              Shop Face Care
            </a>
            <a 
              href="#/user/contact" 
              className="inline-block border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white transition-colors" style={{ color: 'white' }}
            >
              Get Skincare Advice
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
