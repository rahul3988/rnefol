import React, { useState, useEffect } from 'react'
import { getApiBase } from '../utils/apiBase'
import { Heart } from 'lucide-react'
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

export default function Body() {
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
        // Filter products for body category - ONLY show products tagged as Body Care
        const bodyProducts = data.filter((product: any) => {
          const category = (product.category || '').toLowerCase()
          return category === 'body care' || category === 'bodycare'
        })
        setProducts(bodyProducts)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="py-10 min-h-screen" style={{ backgroundColor: '#F4F9F9' }}>
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6" style={{ color: '#1B4965' }}>
            Body Care Products
          </h1>
          <p className="text-xl max-w-3xl mx-auto" style={{ color: '#9DB4C0' }}>
            Discover our range of natural body care products designed to nourish and protect your skin.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {loading ? (
            <div className="col-span-full text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p style={{ color: '#9DB4C0' }}>Loading body care products...</p>
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
                  We're working on amazing body care products for you.
                </p>
                <div className="bg-white rounded-lg p-6 inline-block">
                  <p className="text-lg font-semibold" style={{ color: '#1B4965' }}>
                    🚀 Upcoming Very Soon
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {products.map((product) => (
                <div key={product.slug} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow group flex flex-col">
                  <div className="relative">
                    <img 
                      src={product.list_image || '/IMAGES/BANNER (1).jpg'} 
                      alt={product.title}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/IMAGES/BANNER (1).jpg'
                      }}
                    />
                    <div className="absolute top-4 right-4">
                      <button className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg">
                        <Heart className="w-4 h-4" style={{ color: '#1B4965' }} />
                      </button>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col h-full">
                    <h3 className="text-lg font-bold mb-2 line-clamp-2" style={{ color: '#1B4965' }}>
                      {product.title}
                    </h3>
                    <p className="text-sm mb-4 line-clamp-2" style={{ color: '#9DB4C0' }}>
                      {product.description || 'Premium body care product'}
                    </p>
                    <div className="mt-auto pt-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-col">
                          <PricingDisplay 
                            product={product} 
                            csvProduct={undefined}
                            className="text-xl"
                          />
                        </div>
                        <button 
                          onClick={() => addItem({
                            id: product.id,
                            slug: product.slug,
                            title: product.title,
                            category: product.category,
                            price: product.price,
                            listImage: product.list_image,
                            pdpImages: [],
                            description: product.description
                          })}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold whitespace-nowrap"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Benefits Section */}
        <div className="rounded-2xl p-8 mb-16" style={{ backgroundColor: '#D0E8F2' }}>
          <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: '#1B4965' }}>
            Why Choose Nefol Body Care?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#4B97C9' }}>
                <span className="text-2xl">🌿</span>
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#1B4965' }}>
                Natural Ingredients
              </h3>
              <p className="text-sm" style={{ color: '#9DB4C0' }}>
                Made with Blue Tea and other natural ingredients for gentle, effective care.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#4B97C9' }}>
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#1B4965' }}>
                Hydrating Formula
              </h3>
              <p className="text-sm" style={{ color: '#9DB4C0' }}>
                Deep hydration that keeps your skin soft and supple all day long.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#4B97C9' }}>
                <span className="text-2xl">🛡️</span>
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#1B4965' }}>
                Safe & Gentle
              </h3>
              <p className="text-sm" style={{ color: '#9DB4C0' }}>
                Paraben-free, sulphate-free, and suitable for all skin types.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center rounded-2xl p-12 text-white" style={{ backgroundColor: '#4B97C9' }}>
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Body Care?</h2>
          <p className="text-xl mb-8 opacity-90">
            Experience the power of natural ingredients with Nefol body care products.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#/user/shop" 
              className="inline-block bg-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors" style={{ color: '#4B97C9' }}
            >
              Shop All Products
            </a>
            <a 
              href="#/user/contact" 
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
