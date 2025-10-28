import { useEffect, useState, useRef } from 'react'
import type { Product } from '../types'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { getApiBase } from '../utils/apiBase'
import AuthGuard from '../components/AuthGuard'
import { userSocketService } from '../services/socket'

export default function ProductPage() {
  const [product, setProduct] = useState<Product | null>(null)
  const [csvProduct, setCsvProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({})
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const hasLoaded = useRef(false)
  
  // Use cart context and auth
  const cartContext = useCart()
  const { isAuthenticated } = useAuth()
  
  // Safely access cart methods
  const addItem = cartContext?.addItem

  useEffect(() => {
    // Prevent duplicate calls
    if (hasLoaded.current) return
    hasLoaded.current = true
    
    const load = async () => {
      const hash = window.location.hash || '#/'
      const match = hash.match(/^#\/user\/product\/([^?#]+)/)
      const slug = match?.[1]
      if (!slug) return
      const apiBase = getApiBase()
      
      console.log('🔄 Loading product data for slug:', slug)
      
      // First try to fetch from database
      try {
        console.log('📡 Fetching from database...')
        const res = await fetch(`${apiBase}/api/products/slug/${slug}`, { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          console.log('✅ Database product found:', data)
          if (data) {
            const toAbs = (u?: string) => {
              if (!u || typeof u !== 'string') return ''
              if (/^https?:\/\//i.test(u)) return u
              const base = apiBase.replace(/\/$/, '')
              const path = u.startsWith('/') ? u : `/${u}`
              return `${base}${path}`
            }
            const item: Product = {
              id: data.id,
              slug: data.slug,
              title: data.title,
              category: data.category,
              price: data.price,
              listImage: toAbs(data.list_image || ''),
              pdpImages: data.pdp_images ? data.pdp_images.map((url: string) => toAbs(url)) : [toAbs(data.list_image || '')],
              description: data.description || '',
              details: data.details
            }
            setProduct(item)
            console.log('✅ Product set from database:', item)
            
            // Track product view
            if (item.id) {
              userSocketService.trackProductView(item.id, item.title, {
                category: item.category,
                price: item.price
              })
            }
            console.log('🖼️ Product images:', {
              listImage: item.listImage,
              pdpImages: item.pdpImages,
              rawData: {
                list_image: data.list_image,
                pdp_images: data.pdp_images
              }
            })
          }
        } else {
          console.log('❌ Database fetch failed:', res.status)
        }
      } catch (error) {
        console.error('❌ Failed to fetch product from database:', error)
      }
      
      // Then try to fetch CSV data for additional details
      try {
        console.log('📡 Fetching CSV data...')
        const csvRes = await fetch(`${apiBase}/api/products-csv`)
        if (csvRes.ok) {
          const csvData = await csvRes.json()
          console.log('✅ CSV Data loaded:', csvData.length, 'products')
          console.log('🔍 Looking for slug:', slug)
          
          // Find CSV product by slug (using Slug column or converting from product name)
          const csvMatch = csvData.find((csv: any) => {
            const csvSlug = csv['Slug'] || csv['Product Name']?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || ''
            console.log('🔍 CSV Product:', csv['Product Name'], 'Slug:', csvSlug, 'Match:', csvSlug === slug)
            return csvSlug === slug
          })
          
          if (csvMatch) {
            setCsvProduct(csvMatch)
            console.log('✅ CSV product found:', csvMatch['Product Name'])
            console.log('📊 CSV Product Details:', {
              title: csvMatch['Product Name'],
              subtitle: csvMatch['Subtitle / Tagline'],
              description: csvMatch['Product Description (Long)'],
              ingredients: csvMatch['Key Ingredients'],
              benefits: csvMatch['Ingredient Benefits'],
              howToUse: csvMatch['How to Use (Steps)'],
              badges: csvMatch['Special Attributes (Badges)'],
              mrp: csvMatch['MRP '],
              websitePrice: csvMatch['website price'],
              skinType: csvMatch['Skin/Hair Type']
            })
          } else {
            console.log('❌ No CSV match found for slug:', slug)
            console.log('📋 Available CSV slugs:', csvData.map((csv: any) => csv['Slug'] || csv['Product Name']?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')))
            
            // If no CSV match, try to use database details as fallback
            if (product && product.details) {
              console.log('🔄 Using database details as fallback')
              const dbDetails = typeof product.details === 'string' ? JSON.parse(product.details) : product.details
              setCsvProduct({
                'Product Name': product.title,
                'Title': product.title,
                'Brand Name': dbDetails.brand || 'NEFOL',
                'SKU': dbDetails.sku || '',
                'HSN Code': dbDetails.hsn || '',
                'Subtitle / Tagline': dbDetails.subtitle || '',
                'Product Description (Long)': dbDetails.longDescription || '',
                'Skin/Hair Type': dbDetails.skinHairType || '',
                'Net Quantity (Content)': dbDetails.netQuantity || '',
                'Unit Count (Pack of)': dbDetails.unitCount || '',
                'Package Content Details': dbDetails.packageContent || '',
                'Inner Packaging Type': dbDetails.innerPackaging || '',
                'Outer Packaging Type': dbDetails.outerPackaging || '',
                'Net Weight (Product Only)': dbDetails.netWeight || '',
                'Dead Weight (Packaging Only)': dbDetails.deadWeight || '',
                'MRP ': dbDetails.mrp || product.price,
                'website price': dbDetails.websitePrice || '',
                'GST %': dbDetails.gstPercent || '',
                'Country of Origin': dbDetails.countryOfOrigin || '',
                'Manufacturer / Packer / Importer': dbDetails.manufacturer || '',
                'Key Ingredients': dbDetails.keyIngredients || '',
                'Ingredient Benefits': dbDetails.ingredientBenefits || '',
                'How to Use (Steps)': dbDetails.howToUse || '',
                'Video Links': dbDetails.videoLinks || '',
                'Hazardous / Fragile (Y/N)': dbDetails.hazardous || '',
                'Special Attributes (Badges)': dbDetails.badges || ''
              })
            }
          }
        } else {
          console.log('❌ CSV fetch failed:', csvRes.status)
        }
      } catch (error) {
        console.error('❌ Failed to fetch CSV data:', error)
      }
      
      setLoading(false)
      setLastUpdated(new Date())
      console.log('✅ Product loading completed')
    }
    load()
  }, []) // Empty dependency array to prevent duplicate calls

  // Refresh data function
  const refreshData = async () => {
    setIsRefreshing(true)
    const hash = window.location.hash || '#/'
    const match = hash.match(/^#\/user\/product\/([^?#]+)/)
    const slug = match?.[1]
    if (!slug) return
    const apiBase = getApiBase()
    
    try {
      // Refresh CSV data
      const csvRes = await fetch(`${apiBase}/api/products-csv`)
      if (csvRes.ok) {
        const csvData = await csvRes.json()
        const csvMatch = csvData.find((csv: any) => {
          const csvSlug = csv['Slug'] || csv['Product Name']?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || ''
          return csvSlug === slug
        })
        
        if (csvMatch) {
          setCsvProduct(csvMatch)
          setLastUpdated(new Date())
          console.log('🔄 Data refreshed successfully')
        }
      }
    } catch (error) {
      console.error('❌ Failed to refresh data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const derivePdpImages = (r: any, toAbs: (u?: string) => string) => {
    const images = []
    if (r.pdp_image_1) images.push(toAbs(r.pdp_image_1))
    if (r.pdp_image_2) images.push(toAbs(r.pdp_image_2))
    if (r.pdp_image_3) images.push(toAbs(r.pdp_image_3))
    if (r.pdp_image_4) images.push(toAbs(r.pdp_image_4))
    if (r.pdp_image_5) images.push(toAbs(r.pdp_image_5))
    if (r.pdp_image_6) images.push(toAbs(r.pdp_image_6))
    return images.length > 0 ? images : ['/IMAGES/BANNER (1).jpg']
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  if (loading) {
    return (
      <main className="py-10 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="animate-pulse">
            <div className="h-8 w-3/4 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 w-1/2 bg-gray-200 rounded mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!product) {
    return (
      <main className="py-10 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
        </div>
      </main>
    )
  }

  const reviews = [
    { name: 'Sarah M.', rating: 5, date: '2 days ago', comment: 'Amazing product! My skin feels so much better after just one week of use.' },
    { name: 'Priya K.', rating: 5, date: '1 week ago', comment: 'Love the natural ingredients. No side effects and great results.' },
    { name: 'Anita R.', rating: 4, date: '2 weeks ago', comment: 'Good quality product. Would recommend to others.' },
    { name: 'Deepa S.', rating: 5, date: '3 weeks ago', comment: 'Perfect for my sensitive skin. Gentle and effective.' },
    { name: 'Riya P.', rating: 4, date: '1 month ago', comment: 'Nice texture and easy to apply. Results are visible.' }
  ]

  return (
    <AuthGuard>
    <div className="overflow-x-hidden bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <a href="#/user/" className="text-2xl font-bold text-gray-900">NEFOL</a>
              <nav className="hidden md:flex space-x-6">
                <a href="#/user/" className="text-gray-600 hover:text-gray-900">Home</a>
                <a href="#/user/shop" className="text-gray-600 hover:text-gray-900">Shop</a>
                <a href="#/user/face" className="text-gray-600 hover:text-gray-900">Face</a>
                <a href="#/user/hair" className="text-gray-600 hover:text-gray-900">Hair</a>
                <a href="#/user/body" className="text-gray-600 hover:text-gray-900">Body</a>
                <a href="#/user/combos" className="text-gray-600 hover:text-gray-900">Combos</a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <img 
                  src="/IMAGES/search icon.svg" 
                  alt="Search" 
                  className="w-6 h-6"
                  onError={(e) => {
                    // Fallback to SVG if image fails to load
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent) {
                      parent.innerHTML = '<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>'
                    }
                  }}
                />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="py-4 sm:py-6 md:py-8 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          {/* Breadcrumb */}
          <nav className="mb-4 sm:mb-6 text-xs sm:text-sm">
            <ol className="flex items-center space-x-1 sm:space-x-2 text-gray-600 flex-wrap">
              <li><a href="#/user/" className="hover:text-gray-900">Home</a></li>
              <li>/</li>
              <li><a href="#/user/shop" className="hover:text-gray-900">Shop</a></li>
              <li>/</li>
              <li><a href={`#/user/shop?category=${product.category}`} className="hover:text-gray-900 truncate max-w-[100px] sm:max-w-none">{product.category}</a></li>
              <li>/</li>
              <li className="text-gray-900 truncate max-w-[150px] sm:max-w-none">{product.title}</li>
            </ol>
          </nav>

          {/* Product Details */}
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:gap-12 lg:grid-cols-2 mb-8 sm:mb-12 md:mb-16">
            {/* Product Media */}
            <div className="space-y-2 sm:space-y-4">
              <div className="aspect-square overflow-hidden rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50">
                {(() => {
                  const mainImage = product.pdpImages[selectedImage] || product.listImage
                  console.log('🖼️ Displaying main image:', mainImage)
                  return mainImage ? (
                    <img 
                      src={mainImage} 
                      alt={product.title} 
                      className="h-full w-full object-cover" 
                      onError={(e) => {
                        console.log('❌ Image failed to load:', mainImage)
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm">No image available</span>
                    </div>
                  )
                })()}
              </div>
              {product.pdpImages.length > 1 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {product.pdpImages.slice(0, 5).map((src, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative aspect-square overflow-hidden rounded-lg border-2 ${
                        selectedImage === index 
                          ? 'border-gray-900' 
                          : 'border-gray-200'
                      }`}
                    >
                        <img 
                          src={src} 
                          alt={`${product.title} ${index + 1}`} 
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            console.log('❌ Thumbnail image failed to load:', src)
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {csvProduct?.['Product Name'] || product.title}
                </h1>
                <p className="text-base sm:text-lg text-gray-600 mb-4">
                  {csvProduct?.['Subtitle / Tagline'] || 'Premium natural skincare for radiant skin'}
                </p>
                
                {/* nefol-style Rating */}
                <div className="flex items-center mb-4">
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-gray-900 mr-2">4.97</span>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <span className="ml-2 text-sm text-gray-600">nefol rating</span>
                  <span className="ml-2 text-sm text-gray-500">77 reviews</span>
                </div>
              </div>

              {/* nefol-style Pricing */}
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Sale price</div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-900">
                    {(() => {
                      // Priority: Admin panel data > CSV data > fallback
                      const adminMrp = product?.details?.mrp
                      const adminWebsitePrice = product?.details?.websitePrice
                      const csvMrp = csvProduct?.['MRP (₹)'] || csvProduct?.['MRP']
                      const csvWebsitePrice = csvProduct?.['website price'] || csvProduct?.['Website Price']
                      
                      const mrp = adminMrp || csvMrp || product.price || '₹599'
                      const websitePrice = adminWebsitePrice || csvWebsitePrice || ''
                      
                      return websitePrice && websitePrice !== mrp ? websitePrice : mrp
                    })()}
                  </span>
                  {(() => {
                    // Priority: Admin panel data > CSV data > fallback
                    const adminMrp = product?.details?.mrp
                    const adminWebsitePrice = product?.details?.websitePrice
                    const csvMrp = csvProduct?.['MRP (₹)'] || csvProduct?.['MRP']
                    const csvWebsitePrice = csvProduct?.['website price'] || csvProduct?.['Website Price']
                    
                    const mrp = adminMrp || csvMrp || product.price || '₹599'
                    const websitePrice = adminWebsitePrice || csvWebsitePrice || ''
                    
                    return websitePrice && websitePrice !== mrp ? (
                      <>
                        <div className="text-sm text-gray-600">Regular price</div>
                        <span className="text-lg font-medium line-through opacity-60 text-gray-500">
                          ₹{mrp}
                        </span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded">
                          Save {Math.round(((parseFloat(mrp.toString().replace(/[₹,]/g, '')) - parseFloat(websitePrice.toString().replace(/[₹,]/g, ''))) / parseFloat(mrp.toString().replace(/[₹,]/g, '')) * 100))}%
                        </span>
                      </>
                    ) : null
                  })()}
                </div>
                <div className="text-sm text-gray-600">Inclusive of all taxes</div>
                
                {/* Net Volume */}
                {csvProduct?.['Net Quantity (Content)'] && (
                  <div className="text-sm text-gray-600">
                    Net Vol: {csvProduct['Net Quantity (Content)']}
                  </div>
                )}
              </div>

              {/* Check Delivery Availability */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-900">Check Delivery Availability</div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="text" 
                    placeholder="Enter Pincode" 
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm flex-1"
                  />
                  <button className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800">
                    CHECK
                  </button>
                </div>
              </div>

              {/* Real-time Data Status */}
              <div className="flex items-center text-xs text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span>Live data • Last updated: {lastUpdated.toLocaleTimeString()}</span>
                <button 
                  onClick={refreshData}
                  disabled={isRefreshing}
                  className="ml-2 p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-900">Quantity:</span>
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-gray-600 hover:text-gray-900"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-gray-900 min-w-[3rem] text-center">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 text-gray-600 hover:text-gray-900"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => {
                      if (product && addItem) {
                        try {
                          addItem(product, quantity)
                          // Show success message
                          const button = document.querySelector('[data-add-to-cart]') as HTMLButtonElement
                          if (button) {
                            const originalText = button.textContent
                            button.textContent = 'Added to Cart!'
                            button.classList.add('bg-green-600', 'hover:bg-green-700')
                        button.classList.remove('bg-gray-900', 'hover:bg-gray-800')
                            setTimeout(() => {
                              button.textContent = originalText
                              button.classList.remove('bg-green-600', 'hover:bg-green-700')
                          button.classList.add('bg-gray-900', 'hover:bg-gray-800')
                            }, 2000)
                          }
                        } catch (error) {
                          // AuthGuard will handle the authentication requirement
                          console.log('Authentication required for cart operation')
                        }
                      }
                    }}
                    data-add-to-cart
                    className="flex-1 rounded-md bg-gray-900 px-4 sm:px-6 py-3 font-semibold text-white hover:bg-gray-800 transition-colors min-h-[48px]"
                  >
                ADD TO CART
                  </button>

                  <button 
                    onClick={() => {
                      if (product && addItem) {
                        try {
                          addItem(product, quantity)
                          // Navigate to checkout immediately using hash-based routing
                          window.location.hash = '#/user/checkout'
                        } catch (error) {
                          // AuthGuard will handle the authentication requirement
                          console.log('Authentication required for purchase')
                        }
                      }
                    }}
                    className="flex-1 rounded-md bg-blue-600 px-4 sm:px-6 py-3 font-semibold text-white hover:bg-blue-700 transition-colors min-h-[48px]"
                  >
                    BUY NOW
                  </button>
              </div>

              {/* Loyalty Points */}
              <div className="flex items-center text-sm text-gray-600">
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Earn upto 249 points on this purchase
                </div>

              {/* Shipping Info */}
              <div className="text-sm text-yellow-600 bg-yellow-50 px-3 py-2 rounded-md">
                Your order will be shipped out in 2-4 business days.
              </div>

              {/* Reasons to Love */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">REASONS TO LOVE:</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    <span>100% Natural Ingredients</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    <span>Cruelty Free</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    <span>Paraben Free</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    <span>Suitable for All Skin Types</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    <span>Dermatologically Tested</span>
                  </li>
                </ul>
              </div>

              {/* Product Claims/Badges */}
              {csvProduct?.['Special Attributes (Badges)'] && (
                <div className="flex flex-wrap gap-3 mb-6">
                  {csvProduct['Special Attributes (Badges)'].split('|').map((badge: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-full">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-xs font-medium text-gray-700">{badge.trim()}</span>
            </div>
                  ))}
          </div>
              )}

              {/* Collapsible Sections */}
              <div className="space-y-2">
                {/* Description */}
                <div className="border-b border-gray-200">
              <button
                    onClick={() => toggleSection('description')}
                    className="flex items-center justify-between w-full py-3 text-left font-semibold text-gray-900"
                  >
                    <span>DESCRIPTION</span>
                    <svg className={`h-5 w-5 transition-transform ${expandedSections.description ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
              </button>
                  {expandedSections.description && (
                    <div className="pb-4 text-sm text-gray-600">
                      <p className="mb-4">
                        {csvProduct?.['Product Description (Long)'] || csvProduct?.['Long Description'] || product.description || 'Premium natural skincare product designed for optimal skin health and radiance.'}
                      </p>
                      {csvProduct?.['Subtitle / Tagline'] && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-900 mb-2">Key Features</h4>
                          <p>{csvProduct['Subtitle / Tagline']}</p>
                        </div>
                      )}
                    </div>
                  )}
            </div>

                {/* Ingredients */}
                <div className="border-b border-gray-200">
                  <button
                    onClick={() => toggleSection('ingredients')}
                    className="flex items-center justify-between w-full py-3 text-left font-semibold text-gray-900"
                  >
                    <span>INGREDIENTS</span>
                    <svg className={`h-5 w-5 transition-transform ${expandedSections.ingredients ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  {expandedSections.ingredients && (
                    <div className="pb-4 text-sm text-gray-600">
                      <p className="mb-4">
                        {csvProduct?.['Key Ingredients'] || 'Premium natural ingredients carefully selected for optimal skin health.'}
                      </p>
                      {csvProduct?.['Ingredient Benefits'] && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Benefits</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {csvProduct['Ingredient Benefits'].split(',').map((benefit: string, index: number) => (
                              <li key={index}>{benefit.trim()}</li>
                        ))}
                      </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Suitable For */}
                <div className="border-b border-gray-200">
                  <button
                    onClick={() => toggleSection('suitablefor')}
                    className="flex items-center justify-between w-full py-3 text-left font-semibold text-gray-900"
                  >
                    <span>SUITABLE FOR</span>
                    <svg className={`h-5 w-5 transition-transform ${expandedSections.suitablefor ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  {expandedSections.suitablefor && (
                    <div className="pb-4 text-sm text-gray-600">
                      <p className="mb-4">
                        {csvProduct?.['Skin/Hair Type'] || 'All Skin Types'}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>All Skin Types</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Sensitive Skin</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Dry Skin</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Oily Skin</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* How to Use */}
                <div className="border-b border-gray-200">
                  <button
                    onClick={() => toggleSection('howtouse')}
                    className="flex items-center justify-between w-full py-3 text-left font-semibold text-gray-900"
                  >
                    <span>HOW TO USE</span>
                    <svg className={`h-5 w-5 transition-transform ${expandedSections.howtouse ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  {expandedSections.howtouse && (
                    <div className="pb-4 text-sm text-gray-600">
                      <ol className="list-decimal list-inside space-y-1">
                        {csvProduct?.['How to Use (Steps)'] ? 
                          csvProduct['How to Use (Steps)'].split(',').map((step: string, index: number) => (
                            <li key={index}>{step.trim()}</li>
                          )) :
                          [
                            'Cleanse your face with a gentle cleanser',
                            'Apply a small amount to face and neck',
                            'Gently massage in circular motions',
                            'Use twice daily for best results'
                          ].map((step, index) => (
                            <li key={index}>{step}</li>
                          ))
                        }
                      </ol>
                    </div>
                  )}
                </div>

                {/* Product Specifications */}
                <div className="border-b border-gray-200">
                  <button
                    onClick={() => toggleSection('specifications')}
                    className="flex items-center justify-between w-full py-3 text-left font-semibold text-gray-900"
                  >
                    <span>PRODUCT SPECIFICATIONS</span>
                    <svg className={`h-5 w-5 transition-transform ${expandedSections.specifications ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  {expandedSections.specifications && (
                    <div className="pb-4 text-sm text-gray-600">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          {csvProduct?.['SKU'] && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">SKU:</span>
                              <span className="font-medium">{csvProduct['SKU']}</span>
                            </div>
                          )}
                          {csvProduct?.['HSN Code'] && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">HSN Code:</span>
                              <span className="font-medium">{csvProduct['HSN Code']}</span>
                            </div>
                          )}
                          {csvProduct?.['Brand Name'] && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Brand:</span>
                              <span className="font-medium">{csvProduct['Brand Name']}</span>
                            </div>
                          )}
                          {csvProduct?.['Net Quantity (Content)'] && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Net Quantity:</span>
                              <span className="font-medium">{csvProduct['Net Quantity (Content)']}</span>
                            </div>
                          )}
                          {csvProduct?.['Unit Count (Pack of)'] && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Unit Count:</span>
                              <span className="font-medium">{csvProduct['Unit Count (Pack of)']}</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          {csvProduct?.['Net Weight (Product Only)'] && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Net Weight:</span>
                              <span className="font-medium">{csvProduct['Net Weight (Product Only)']}</span>
                            </div>
                          )}
                          {csvProduct?.['Dead Weight (Packaging Only)'] && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Packaging Weight:</span>
                              <span className="font-medium">{csvProduct['Dead Weight (Packaging Only)']}</span>
                            </div>
                          )}
                          {csvProduct?.['GST %'] && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">GST:</span>
                              <span className="font-medium">{csvProduct['GST %']}%</span>
                            </div>
                          )}
                          {csvProduct?.['Country of Origin'] && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Country of Origin:</span>
                              <span className="font-medium">{csvProduct['Country of Origin']}</span>
                            </div>
                          )}
                          {csvProduct?.['Manufacturer / Packer / Importer'] && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Manufacturer:</span>
                              <span className="font-medium">{csvProduct['Manufacturer / Packer / Importer']}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Packaging Details */}
                <div className="border-b border-gray-200">
                  <button
                    onClick={() => toggleSection('packaging')}
                    className="flex items-center justify-between w-full py-3 text-left font-semibold text-gray-900"
                  >
                    <span>PACKAGING DETAILS</span>
                    <svg className={`h-5 w-5 transition-transform ${expandedSections.packaging ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  {expandedSections.packaging && (
                    <div className="pb-4 text-sm text-gray-600">
                      <div className="space-y-2">
                        {csvProduct?.['Package Content Details'] && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Package Content:</span>
                            <span className="font-medium">{csvProduct['Package Content Details']}</span>
                          </div>
                        )}
                        {csvProduct?.['Inner Packaging Type'] && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Inner Packaging:</span>
                            <span className="font-medium">{csvProduct['Inner Packaging Type']}</span>
                          </div>
                        )}
                        {csvProduct?.['Outer Packaging Type'] && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Outer Packaging:</span>
                            <span className="font-medium">{csvProduct['Outer Packaging Type']}</span>
                          </div>
                        )}
                        {csvProduct?.['Hazardous / Fragile (Y/N)'] && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Hazardous/Fragile:</span>
                            <span className="font-medium">{csvProduct['Hazardous / Fragile (Y/N)']}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Video Links */}
                {csvProduct?.['Video Links'] && (
                  <div className="border-b border-gray-200">
                    <button
                      onClick={() => toggleSection('videos')}
                      className="flex items-center justify-between w-full py-3 text-left font-semibold text-gray-900"
                    >
                      <span>VIDEO LINKS</span>
                      <svg className={`h-5 w-5 transition-transform ${expandedSections.videos ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                    {expandedSections.videos && (
                      <div className="pb-4 text-sm text-gray-600">
                        <div className="space-y-2">
                          {csvProduct['Video Links'].split(',').map((link: string, index: number) => (
                            <div key={index} className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                              </svg>
                              <a 
                                href={link.trim()} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                Watch Video {index + 1}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
                      
              {/* Key Specifications */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">KEY SPECIFICATIONS</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {csvProduct?.['Net Weight (Product Only)'] && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Net Weight:</span>
                      <span className="font-medium">{csvProduct['Net Weight (Product Only)']}</span>
                    </div>
                  )}
                  {csvProduct?.['Net Quantity (Content)'] && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-medium">{csvProduct['Net Quantity (Content)']}</span>
                    </div>
                  )}
                  {csvProduct?.['SKU'] && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">SKU:</span>
                      <span className="font-medium">{csvProduct['SKU']}</span>
                    </div>
                  )}
                  {csvProduct?.['Brand Name'] && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Brand:</span>
                      <span className="font-medium">{csvProduct['Brand Name']}</span>
                    </div>
                  )}
                  {csvProduct?.['Country of Origin'] && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Origin:</span>
                      <span className="font-medium">{csvProduct['Country of Origin']}</span>
                    </div>
                  )}
                  {csvProduct?.['GST %'] && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">GST:</span>
                      <span className="font-medium">{csvProduct['GST %']}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Plant Powered Science Badge */}
              <div className="flex items-center justify-center mt-6">
                <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 rounded-full">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-green-800">96.52% Plant Powered Science</span>
                </div>
              </div>

              {/* Country of Origin */}
              <div className="flex items-center text-sm text-gray-600">
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Country Of Origin: {csvProduct?.['Country of Origin'] || 'India'}
              </div>

              {/* Welcome Offer */}
              <div className="bg-gray-100 px-4 py-3 rounded-md">
                <div className="text-sm font-semibold text-gray-900 mb-1">WELCOME OFFER</div>
                <div className="text-sm text-gray-600">Use Code HELLO10 and enjoy flat 10% off on your first purchase.</div>
              </div>
            </div>
          </div>

          {/* Mid-Page Ingredients Section */}
          {csvProduct?.['Key Ingredients'] && (
            <section className="py-16 bg-gray-50">
              <div className="mx-auto max-w-7xl px-4">
                <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">INGREDIENTS</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {csvProduct['Key Ingredients'].split(',').slice(0, 4).map((ingredient: string, index: number) => (
                    <div key={index} className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-md">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{ingredient.trim()}</h3>
                      <p className="text-sm text-gray-600">
                        {csvProduct?.['Ingredient Benefits']?.split(',')[index]?.trim() || 'Natural ingredient for healthy skin'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Plant-Based Skincare Banner */}
          <section className="py-16 bg-white">
            <div className="mx-auto max-w-7xl px-4">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">PLANT-BASED SKINCARE THAT WORKS FOR EVERY SKIN TYPE</h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  Our carefully curated ingredients work together to provide effective, natural skincare solutions that deliver real results for all skin types.
                </p>
              </div>
            </div>
          </section>

          {/* Customer Reviews Section */}
          <section className="border-t border-gray-200 pt-12 mb-16">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Customer Reviews</h2>
            
            <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                <span className="text-lg font-semibold text-gray-900">4.48 out of 5</span>
                <span className="text-sm text-gray-600">Based on 52 reviews</span>
              </div>
              <div className="flex space-x-2">
                <button className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800">
                  Write a review
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-900 text-sm font-medium rounded-md hover:bg-gray-50">
                  Ask a question
                </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {reviews.map((review, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-semibold text-gray-600">
                                {review.name.charAt(0)}
                              </span>
          </div>
          <div>
                        <h4 className="font-semibold text-gray-900">{review.name}</h4>
                              <div className="flex text-yellow-400">
                                {[...Array(review.rating)].map((_, i) => (
                                  <svg key={i} className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                            </div>
                          </div>
                    <span className="text-sm text-gray-600">{review.date}</span>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <button className="px-6 py-2 bg-gray-900 text-white font-medium rounded-md hover:bg-gray-800">
                Load More
              </button>
          </div>
          </section>

          {/* You May Also Like Section */}
          <section className="border-t border-gray-200 pt-12 mb-16">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">YOU MAY ALSO LIKE</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {getRelatedProducts(product).map((item, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <a href={`#/user/product/${item.slug}`}>
                    <div className="relative">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-48 object-cover"
                  />
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                          NEW LAUNCH
                        </span>
                      </div>
                      <button className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md">
                        <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>
                  <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{item.title}</h3>
                    <div className="flex items-center mb-2">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < item.rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                        ))}
                      </div>
                        <span className="text-sm text-gray-600 ml-2">({item.reviewCount})</span>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm line-through text-gray-500">{item.originalPrice}</span>
                          <span className="font-bold text-gray-900">{item.price}</span>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                          {item.discount}% OFF
                        </span>
                      </div>
                      <button className="w-full py-2 bg-gray-900 text-white font-medium rounded-md hover:bg-gray-800">
                        ADD TO CART
                      </button>
                  </div>
                </a>
              </div>
            ))}
        </div>
      </section>

          {/* FAQ Section */}
          <section className="border-t border-gray-200 pt-12 mb-16">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">NEED HELP? FREQUENTLY ASKED QUESTIONS</h2>
            <div className="max-w-3xl mx-auto space-y-2">
              {getFAQItems().map((faq, index) => (
                <div key={index} className="border-b border-gray-200">
                  <button
                    onClick={() => toggleSection(`faq-${index}`)}
                    className="flex items-center justify-between w-full py-4 text-left font-semibold text-gray-900"
                  >
                    <span>{faq.question}</span>
                    <svg className={`h-5 w-5 transition-transform ${expandedSections[`faq-${index}`] ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  {expandedSections[`faq-${index}`] && (
                    <div className="pb-4 text-sm text-gray-600">
                      {faq.answer}
                    </div>
                  )}
              </div>
            ))}
          </div>
          </section>
        </div>
      </main>
    </div>
    </AuthGuard>
  )
}

function getRelatedProducts(currentProduct: Product | null): Array<{
  slug: string
  image: string
  title: string
  rating: number
  reviewCount: number
  originalPrice: string
  price: string
  discount: number
}> {
  if (!currentProduct) return []
  
  // Return empty array - related products should be loaded via API in the component
  return []
}

function getFAQItems(): Array<{
  question: string
  answer: string
}> {
  // Return empty array - FAQ items should be loaded via API in the component
  return []
}