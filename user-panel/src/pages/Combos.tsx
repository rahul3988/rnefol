import React, { useState, useEffect } from 'react'
import { getApiBase } from '../utils/apiBase'
import { Heart, Star, ShoppingCart, Package } from 'lucide-react'
import { useCart } from '../contexts/CartContext'

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

export default function Combos() {
  const { addItem } = useCart()
  const [products, setProducts] = useState<Product[]>([])
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
        // Filter products for combo category - ONLY show products tagged as Combo
        const comboProducts = data.filter((product: Product) => {
          const category = (product.category || '').toLowerCase()
          return category === 'combo' || category === 'combo pack' || category === 'combo pack'
        })
        setProducts(comboProducts)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="py-10 min-h-screen overflow-x-hidden" style={{ backgroundColor: '#F4F9F9' }}>
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6" style={{ color: '#1B4965' }}>
            Combo Offers
          </h1>
          <p className="text-xl max-w-3xl mx-auto" style={{ color: '#9DB4C0' }}>
            Save more with our curated combo packs. Mix and match your favorite products at discounted prices.
          </p>
        </div>

        {/* Combo Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {loading ? (
            <div className="col-span-full text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p style={{ color: '#9DB4C0' }}>Loading combo offers...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <div className="rounded-2xl p-12" style={{ backgroundColor: '#D0E8F2' }}>
                <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#4B97C9' }}>
                  <Package className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4" style={{ color: '#1B4965' }}>
                  Coming Soon!
                </h3>
                <p className="text-xl mb-6" style={{ color: '#9DB4C0' }}>
                  We're working on amazing combo offers for you.
                </p>
                <div className="bg-white rounded-lg p-6 inline-block">
                  <p className="text-lg font-semibold" style={{ color: '#1B4965' }}>
                    🚀 Upcoming Very Soon
                  </p>
                </div>
              </div>
            </div>
          ) : (
            products.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow group cursor-pointer" onClick={() => window.location.hash = `#/product/${product.slug}`}>
                <div className="relative">
                  <img 
                    src={product.list_image || '/IMAGES/placeholder.jpg'} 
                    alt={product.title}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      COMBO OFFER
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <button className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg" onClick={(e) => e.stopPropagation()}>
                      <Heart className="w-4 h-4" style={{ color: '#1B4965' }} />
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-2">
                    <Package className="w-5 h-5 mr-2" style={{ color: '#4B97C9' }} />
                    <span className="text-sm font-medium" style={{ color: '#4B97C9' }}>COMBO PACK</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: '#1B4965' }}>
                    {product.title}
                  </h3>
                  <p className="text-sm mb-4" style={{ color: '#9DB4C0' }}>
                    {product.description || 'Premium combo pack with multiple products'}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      {product.details?.mrp && product.details?.websitePrice ? (
                        <div>
                          <div className="text-gray-500 line-through text-sm">₹{product.details.mrp}</div>
                          <span className="text-2xl font-bold text-green-600">₹{product.details.websitePrice}</span>
                          <div className="text-xs text-green-500">
                            {Math.round(((parseFloat(product.details.mrp) - parseFloat(product.details.websitePrice)) / parseFloat(product.details.mrp) * 100))}% OFF
                          </div>
                        </div>
                      ) : (
                        <span className="text-2xl font-bold" style={{ color: '#1B4965' }}>
                          {product.price || '₹1,299'}
                        </span>
                      )}
                    </div>
                  </div>

                  <button 
                    className="w-full text-white py-3 rounded-lg transition-colors flex items-center justify-center" 
                    style={{ backgroundColor: '#4B97C9' }} 
                    onClick={(e) => {
                      e.stopPropagation()
                      addItem({
                        slug: product.slug,
                        title: product.title,
                        price: product.price || '₹1,299',
                        listImage: product.list_image,
                        pdpImages: [],
                        category: product.category,
                        description: product.description || 'Premium combo pack with multiple products'
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
            ))
          )}
        </div>

        {/* Benefits Section */}
        <div className="rounded-2xl p-8 mb-16" style={{ backgroundColor: '#D0E8F2' }}>
          <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: '#1B4965' }}>
            Why Choose Combo Packs?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#4B97C9' }}>
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#1B4965' }}>
                Save Money
              </h3>
              <p className="text-sm" style={{ color: '#9DB4C0' }}>
                Get up to 22% discount when you buy products together in combo packs.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#4B97C9' }}>
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#1B4965' }}>
                Curated Selection
              </h3>
              <p className="text-sm" style={{ color: '#9DB4C0' }}>
                Expert-curated combinations that work perfectly together for best results.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#4B97C9' }}>
                <span className="text-2xl">📦</span>
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#1B4965' }}>
                Convenient Shopping
              </h3>
              <p className="text-sm" style={{ color: '#9DB4C0' }}>
                Get everything you need in one order with free shipping on combo packs.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center rounded-2xl p-12 text-white" style={{ backgroundColor: '#4B97C9' }}>
          <h2 className="text-3xl font-bold mb-4">Ready to Save More?</h2>
          <p className="text-xl mb-8 opacity-90">
            Explore our combo packs and save up to 22% on your favorite Nefol products.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#/shop" 
              className="inline-block bg-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors" style={{ color: '#4B97C9' }}
            >
              Shop All Combos
            </a>
            <a 
              href="#/contact" 
              className="inline-block border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white transition-colors" style={{ color: 'white' }}
            >
              Get Expert Advice
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
