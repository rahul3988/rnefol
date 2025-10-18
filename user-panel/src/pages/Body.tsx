import React, { useState, useEffect } from 'react'
import { getApiBase } from '../utils/apiBase'
import { Heart, Star, ShoppingCart } from 'lucide-react'
import { useCart, parsePrice } from '../contexts/CartContext'
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
  const [csvProducts, setCsvProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
    fetchCsvProducts()
  }, [])

  const fetchCsvProducts = async () => {
    try {
      const apiBase = getApiBase()
      const response = await fetch(`${apiBase}/api/products-csv`)
      if (response.ok) {
        const data = await response.json()
        // Filter products for body category
        const bodyProducts = data.filter((csvProduct: any) => {
          const productName = (csvProduct['Product Name'] || '').toLowerCase()
          return productName.includes('body') || 
                 productName.includes('lotion') ||
                 productName.includes('scrub') ||
                 productName.includes('oil') ||
                 productName.includes('wash') ||
                 productName.includes('gel') ||
                 productName.includes('cream') ||
                 productName.includes('butter')
        })
        setCsvProducts(bodyProducts)
      }
    } catch (error) {
      console.error('Failed to fetch CSV products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const apiBase = getApiBase()
      const response = await fetch(`${apiBase}/api/products`)
      if (response.ok) {
        const data = await response.json()
        // Filter products for body category
        const bodyProducts = data.filter((product: Product) => {
          const category = (product.category || '').toLowerCase()
          const title = (product.title || '').toLowerCase()
          return category === 'body' || 
                 category === 'body care' ||
                 title.includes('body') || 
                 title.includes('lotion') ||
                 title.includes('scrub') ||
                 title.includes('oil') ||
                 title.includes('wash') ||
                 title.includes('gel') ||
                 title.includes('cream') ||
                 title.includes('butter')
        })
        setProducts(bodyProducts)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
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
      category: 'Body Care'
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
          ) : products.length === 0 && csvProducts.length === 0 ? (
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
              {/* Admin Products */}
              {products.map((product) => (
                <div key={product.slug} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow group">
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
                  <div className="p-6">
                    <h3 className="text-lg font-bold mb-2" style={{ color: '#1B4965' }}>
                      {product.title}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: '#9DB4C0' }}>
                      {product.description || 'Premium body care product'}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <PricingDisplay 
                          product={product} 
                          csvProduct={product.csvProduct}
                          className="text-xl"
                        />
                      </div>
                      <button 
                        onClick={() => addItem({
                          ...product,
                          listImage: product.list_image,
                          pdpImages: []
                        })}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* CSV Products as fallback */}
              {csvProducts.map((csvProduct, index) => {
              const simplifiedProduct = getSimplifiedProductData(csvProduct)
              return (
                <div key={simplifiedProduct.slug} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow group">
                  <div className="relative">
                    <img 
                      src={`/IMAGES/BANNER (${(index % 3) + 1}).jpg`} 
                      alt={simplifiedProduct.title}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4">
                      <button className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg">
                        <Heart className="w-4 h-4" style={{ color: '#1B4965' }} />
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold mb-2" style={{ color: '#1B4965' }}>
                      {simplifiedProduct.title}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: '#9DB4C0' }}>
                      Premium body care product
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        {simplifiedProduct.websitePrice && simplifiedProduct.websitePrice !== simplifiedProduct.mrp ? (
                          <>
                            <span className="text-lg font-medium line-through opacity-60" style={{ color: '#9DB4C0' }}>
                              ₹{simplifiedProduct.mrp}
                            </span>
                            <span className="text-xl font-bold" style={{ color: '#1B4965' }}>
                              ₹{simplifiedProduct.websitePrice}
                            </span>
                          </>
                        ) : (
                          <span className="text-2xl font-bold" style={{ color: '#1B4965' }}>
                            ₹{simplifiedProduct.mrp}
                          </span>
                        )}
                      </div>
                      <button 
                        className="text-white px-4 py-2 rounded-lg transition-colors flex items-center" 
                        style={{ backgroundColor: '#4B97C9' }}
                        onClick={() => {
                          addItem({
                            slug: simplifiedProduct.slug,
                            title: simplifiedProduct.title,
                            price: simplifiedProduct.websitePrice || simplifiedProduct.mrp,
                            listImage: `/IMAGES/BANNER (${(index % 3) + 1}).jpg`,
                            pdpImages: [],
                            category: simplifiedProduct.category,
                            description: 'Premium body care product'
                          })
                          // Show success feedback
                          const button = document.querySelector(`[data-add-to-cart="${index}"]`) as HTMLButtonElement
                          if (button) {
                            const originalText = button.textContent
                            button.textContent = 'Added!'
                            button.style.backgroundColor = '#10B981'
                            setTimeout(() => {
                              button.textContent = originalText
                              button.style.backgroundColor = '#4B97C9'
                            }, 1500)
                          }
                        }}
                        data-add-to-cart={index}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
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
              href="#/shop" 
              className="inline-block bg-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors" style={{ color: '#4B97C9' }}
            >
              Shop All Products
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
