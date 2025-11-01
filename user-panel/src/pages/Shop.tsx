import { useProducts } from '../hooks/useProducts'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'
import { useState, useEffect } from 'react'
import { getApiBase } from '../utils/apiBase'
import PricingDisplay from '../components/PricingDisplay'
import AuthGuard from '../components/AuthGuard'
import ScrollReveal from '../components/ScrollReveal'

export default function Shop() {
  const { items, loading, error } = useProducts()
  const cartContext = useCart()
  const { addToWishlist } = useWishlist()
  
  // Safely access cart methods
  const addItem = cartContext?.addItem
  const [csvProducts, setCsvProducts] = useState<any[]>([])

  useEffect(() => {
    fetchCsvProducts()
  }, [])

  const fetchCsvProducts = async () => {
    try {
      const apiBase = getApiBase()
      const response = await fetch(`${apiBase}/api/products-csv`)
      if (response.ok) {
        const data = await response.json()
        setCsvProducts(data)
      }
    } catch (error) {
      console.error('Failed to fetch CSV products:', error)
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
      category: csvProduct['Product Name']?.includes('Hair') ? 'Hair Care' : 
                csvProduct['Product Name']?.includes('Face') ? 'Face Care' : 
                csvProduct['Product Name']?.includes('Body') ? 'Body Care' : 'Skincare'
    }
  }
  return (
    <AuthGuard>
    <main className="min-h-screen py-6 sm:py-8 md:py-10 overflow-x-hidden" style={{backgroundColor: '#F4F9F9'}}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal animationType="fade-up" delay={0}>
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h1 
              className="text-2xl sm:text-3xl md:text-4xl font-serif mb-3 sm:mb-4" 
              style={{color: '#1B4965'}}
              data-aos="fade-up"
            >
              SHOP ALL
            </h1>
            <p 
              className="text-sm sm:text-base md:text-lg font-light max-w-2xl mx-auto px-4" 
              style={{color: '#9DB4C0'}}
              data-aos="fade-up"
              data-aos-delay="100"
            >
              Browse our full collection of premium skincare and haircare essentials crafted with natural ingredients.
            </p>
          </div>
        </ScrollReveal>
        
        {loading && (
          <div className="text-center py-12">
            <p className="text-lg" style={{color: '#9DB4C0'}}>Loading products...</p>
          </div>
        )}
        
        {error && (
          <div className="text-center py-12">
            <p className="text-lg text-red-600">{error}</p>
          </div>
        )}
        
        {items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-6 md:gap-8 auto-rows-fr">
            {items.map((product, index) => {
              return (
                <ScrollReveal 
                  key={product.slug} 
                  animationType="fade-up" 
                  delay={index % 4 * 100}
                >
                  <article 
                    className="bg-white rounded-lg shadow-sm group overflow-hidden flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                    data-aos="fade-up"
                    data-aos-delay={index % 4 * 100}
                  >
                    <div className="relative overflow-hidden aspect-square">
                      <a href={`#/user/product/${product.slug}`}>
                        {product.listImage && (
                          <img 
                            src={product.listImage} 
                            alt={product.title} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                            loading="lazy"
                            style={{ aspectRatio: '1 / 1' }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        )}
                      </a>
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                        <button 
                          onClick={() => product.id && addToWishlist?.(product.id)}
                          className="w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-110"
                        >
                          <span className="text-lg" style={{color: '#1B4965'}}>❤️</span>
                        </button>
                      </div>
                      <div className="absolute top-4 left-4 z-10">
                        <span className="text-white px-3 py-1 text-xs font-medium tracking-wide uppercase rounded-full shadow-md" style={{backgroundColor: '#4B97C9'}}>
                          {product.category || 'NEFOL'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 sm:p-5 md:p-6 flex flex-col flex-grow">
                      <h3 className="text-base sm:text-lg font-medium tracking-wide mb-2 line-clamp-2 min-h-[3rem] flex items-start" style={{color: '#1B4965'}}>
                        {product.title}
                      </h3>
                      <div className="flex items-center mb-4">
                        <div className="flex text-yellow-400">
                          <span className="text-sm">★★★★★</span>
                        </div>
                        <span className="text-xs sm:text-sm ml-2" style={{color: '#9DB4C0'}}>4.5 (45)</span>
                      </div>
                      <div className="mt-auto pt-2">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex flex-col">
                            <PricingDisplay 
                              product={product} 
                              csvProduct={product.csvProduct}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              if (addItem) {
                                try {
                                  addItem(product)
                                } catch (error) {
                                  console.log('Authentication required for cart operation')
                                }
                              }
                            }}
                            className="flex-1 px-3 sm:px-4 py-2.5 text-white text-xs font-medium transition-all duration-300 tracking-wide uppercase rounded shadow-md hover:shadow-lg hover:scale-105"
                            style={{backgroundColor: '#4B97C9', minHeight: '44px'}}
                          >
                            ADD TO CART
                          </button>
                          <a 
                            href={`#/user/product/${product.slug}`}
                            className="flex-1 px-3 sm:px-4 py-2.5 text-white text-xs font-medium transition-all duration-300 tracking-wide uppercase rounded shadow-md hover:shadow-lg hover:scale-105 text-center flex items-center justify-center"
                            style={{backgroundColor: '#1B4965', minHeight: '44px'}}
                          >
                            VIEW
                          </a>
                        </div>
                      </div>
                    </div>
                  </article>
                </ScrollReveal>
              )
            })}
          </div>
        )}
      </div>
    </main>
    </AuthGuard>
  )
}
