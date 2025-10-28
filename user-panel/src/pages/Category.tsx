import { useEffect, useState } from 'react'
import { useProducts } from '../hooks/useProducts'
import type { Product } from '../types'
import PricingDisplay from '../components/PricingDisplay'

export default function CategoryPage() {
  const { items, loading, error } = useProducts()
  const [category, setCategory] = useState<string>('')
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])

  useEffect(() => {
    const hash = window.location.hash || '#/'
    const match = hash.match(/^#\/user\/category\/([^?#]+)/)
    const cat = match?.[1] || ''
    setCategory(cat)
    
    if (items.length > 0) {
      const filtered = items.filter(product => {
        const productCategory = (product.category || '').toLowerCase()
        const targetCategory = cat.toLowerCase()
        
        // Map categories based on CSV data
        if (targetCategory === 'face') {
          return productCategory.includes('face') || 
                 productCategory.includes('moisturizer') ||
                 productCategory.includes('serum') ||
                 productCategory.includes('mask') ||
                 productCategory.includes('scrub') ||
                 productCategory.includes('cream') ||
                 productCategory.includes('cleanser')
        }
        if (targetCategory === 'hair') {
          return productCategory.includes('hair') || 
                 productCategory.includes('shampoo') ||
                 productCategory.includes('oil')
        }
        if (targetCategory === 'body') {
          return productCategory.includes('body') || 
                 productCategory.includes('lotion')
        }
        return false
      })
      setFilteredProducts(filtered)
    }
  }, [items, category])

  const getCategoryTitle = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'face': return 'Face Care'
      case 'hair': return 'Hair Care'
      case 'body': return 'Body Care'
      default: return 'Category'
    }
  }

  const getCategoryDescription = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'face': return 'Complete face care essentials for healthy, glowing skin'
      case 'hair': return 'Nourishing hair care products for strong, shiny hair'
      case 'body': return 'Body care products for smooth, hydrated skin'
      default: return 'Browse our products'
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen py-10" style={{backgroundColor: '#F4F9F9'}}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center py-12">
            <p className="text-lg" style={{color: '#9DB4C0'}}>Loading...</p>
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen py-10" style={{backgroundColor: '#F4F9F9'}}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center py-12">
            <p className="text-lg text-red-600">{error}</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen py-10" style={{backgroundColor: '#F4F9F9'}}>
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif mb-4" style={{color: '#1B4965'}}>
            {getCategoryTitle(category).toUpperCase()}
          </h1>
          <p className="text-lg font-light max-w-2xl mx-auto" style={{color: '#9DB4C0'}}>
            {getCategoryDescription(category)}
          </p>
        </div>
        
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg" style={{color: '#9DB4C0'}}>No products found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
              <article key={product.slug} className="bg-white rounded-lg shadow-sm group overflow-hidden">
                <div className="relative overflow-hidden">
                  <a href={`#/user/product/${product.slug}`}>
                    <img 
                      src={product.listImage || (product.pdpImages && product.pdpImages[0])} 
                      alt={product.title} 
                      className="w-full h-80 object-cover transition-transform duration-500 group-hover:scale-105" 
                      loading="lazy" 
                    />
                  </a>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button className="w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-lg" style={{color: '#1B4965'}}>❤️</span>
                    </button>
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="text-white px-3 py-1 text-xs font-medium tracking-wide uppercase rounded-full" style={{backgroundColor: '#4B97C9'}}>
                      {product.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-medium tracking-wide mb-2" style={{color: '#1B4965'}}>
                    {product.title}
                  </h3>
                  <div className="flex items-center mb-4">
                    <div className="flex text-yellow-400">
                      <span className="text-sm">★★★★★</span>
                    </div>
                    <span className="text-sm ml-2" style={{color: '#9DB4C0'}}>4.5 (45 Reviews)</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <PricingDisplay 
                      product={product} 
                      csvProduct={product.csvProduct}
                    />
                    <div className="flex gap-2">
                      <button className="px-4 py-2 text-white text-xs font-medium transition-all duration-300 tracking-wide uppercase rounded shadow-lg"
                        style={{backgroundColor: '#4B97C9'}}>
                        ADD TO CART
                      </button>
                      <a 
                        href={`#/user/product/${product.slug}`}
                        className="px-4 py-2 text-white text-xs font-medium transition-all duration-300 tracking-wide uppercase rounded shadow-lg"
                        style={{backgroundColor: '#1B4965'}}
                      >
                        VIEW
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}