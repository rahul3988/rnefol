import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Heart, Star, ShoppingCart, Play, Volume2, VolumeX, Sparkles, Zap, Crown, Gift } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'
import { api } from '../services/api'
import SubscriptionModal from '../components/SubscriptionModal'
import PricingDisplay from '../components/PricingDisplay'

export default function Home() {
  const { user, isAuthenticated } = useAuth()
  const { addItem } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const [products, setProducts] = useState<any[]>([])
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loyaltyPoints, setLoyaltyPoints] = useState(0)
  const [cashbackBalance, setCashbackBalance] = useState(0)
  const [activeDiscounts, setActiveDiscounts] = useState<any[]>([])
  const [personalizedContent, setPersonalizedContent] = useState<any>(null)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const [currentComboIndex, setCurrentComboIndex] = useState(0)
  const [activeShopTab, setActiveShopTab] = useState('NEW ARRIVALS')
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)

  // Hero slideshow images (rotate every 3 seconds)
  const heroImages = [
    '/IMAGES/BANNER (1).jpg',
    '/IMAGES/BANNER (2).jpg',
    '/IMAGES/BANNER (3).jpg'
  ]
  const [heroIndex, setHeroIndex] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroImages.length)
    }, 7000)
    return () => window.clearInterval(id)
  }, [])

  // Subscription modal (appears 5s after landing, only if not dismissed before)
  useEffect(() => {
    const hasDismissedSubscription = localStorage.getItem('nefol-subscription-dismissed')
    if (!hasDismissedSubscription) {
      const id = window.setTimeout(() => setShowSubscriptionModal(true), 5000)
      return () => window.clearTimeout(id)
    }
  }, [])

  const handleCloseSubscriptionModal = () => {
    setShowSubscriptionModal(false)
    localStorage.setItem('nefol-subscription-dismissed', 'true')
  }

  useEffect(() => {
    fetchProducts()
    fetchVideos()
  }, []) // Only run once on mount

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserData()
      fetchPersonalizedContent()
    }
  }, [isAuthenticated, user]) // Only run when auth state changes

  const fetchProducts = async () => {
    try {
      console.log('Home page - Fetching products from API')
      const data = await api.products.getAll()
      console.log('Home page - All products:', data)
      setProducts(data)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVideos = async () => {
    try {
      const data = await api.videos.getAll()
      setVideos(data)
    } catch (error) {
      console.error('Failed to fetch videos:', error)
    }
  }

  const fetchUserData = async () => {
    try {
      const profileData = await api.user.getProfile()
      setLoyaltyPoints(profileData.loyalty_points || 0)

      const cashbackData = await api.analytics.getCashbackBalance()
      setCashbackBalance(cashbackData.balance || 0)
    } catch (error) {
      console.error('Failed to fetch user data:', error)
    }
  }

  const fetchPersonalizedContent = async () => {
    try {
      const data = await api.analytics.getPersonalizedContent()
      setPersonalizedContent(data)
    } catch (error) {
      console.error('Failed to fetch personalized content:', error)
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const getVideoSize = (index: number): 'small' | 'medium' | 'large' => {
    const sizePattern: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large', 'medium', 'small']
    return sizePattern[index % sizePattern.length]
  }

  // Functional handlers for buttons and CTAs
  const handleExploreCollection = () => {
    window.location.hash = '#/user/shop'
  }

  const handleJoinVIP = () => {
    if (isAuthenticated) {
      window.location.hash = '#/user/loyalty-rewards'
    } else {
      window.location.hash = '#/user/login'
    }
  }

  const handleShopNow = () => {
    window.location.hash = '#/user/shop'
  }

  const handleViewKit = () => {
    window.location.hash = '#/user/combos'
  }

  const handleAddToCart = (product: any) => {
    addItem(product, 1)
  }

  const handleBuyNow = (product: any) => {
    addItem(product, 1)
    window.location.hash = '#/user/cart'
  }

  const handleAddToWishlist = async (product: any) => {
    try {
      if (isAuthenticated) {
        await addToWishlist(product.id)
        console.log('Added to wishlist:', product.title)
      } else {
        // Redirect to login if not authenticated
        window.location.hash = '#/user/login'
      }
    } catch (error: any) {
      console.error('Failed to add to wishlist:', error)
      if (error.message.includes('already in wishlist')) {
        // Item is already in wishlist, remove it
        try {
          await removeFromWishlist(product.id)
          console.log('Removed from wishlist:', product.title)
        } catch (removeError) {
          console.error('Failed to remove from wishlist:', removeError)
        }
      }
    }
  }

  const handleVideoClick = (video: any) => {
    if (video.redirect_url) {
      window.open(video.redirect_url, '_blank')
    }
  }

  // Helper functions for SHOP WHAT'S NEW section
  const getNewArrivals = () => {
    return products
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 3)
  }

  const getBestSellers = () => {
    // For now, we'll use products with highest IDs as best sellers
    // In a real app, this would be based on actual sales data
    return products
      .sort((a, b) => (b.id || 0) - (a.id || 0))
      .slice(0, 3)
  }

  const getTopRated = () => {
    // For now, we'll use products with highest IDs as top rated
    // In a real app, this would be based on actual ratings data
    return products
      .sort((a, b) => (b.id || 0) - (a.id || 0))
      .slice(0, 3)
  }

  const getCurrentShopProducts = () => {
    switch (activeShopTab) {
      case 'NEW ARRIVALS':
        return getNewArrivals()
      case 'BEST SELLERS':
        return getBestSellers()
      case 'TOP RATED':
        return getTopRated()
      default:
        return getNewArrivals()
    }
  }

  // Dynamically scale videos in the social carousel: center = large, sides = medium/small
  useEffect(() => {
    const scroller = document.getElementById('video-scroller') as HTMLElement | null
    if (!scroller) return

    const updateVideoScales = () => {
      const items = Array.from(scroller.querySelectorAll('.video-item')) as HTMLElement[]
      const scRect = scroller.getBoundingClientRect()
      const scCenter = scRect.width / 2
      items.forEach((el) => {
        const rect = el.getBoundingClientRect()
        const itemCenter = rect.left - scRect.left + rect.width / 2
        const distance = Math.abs(itemCenter - scCenter)
        const max = scRect.width / 2
        const t = Math.min(distance / max, 1) // 0 (center) .. 1 (far)
        // Map: center 1.25 (large), mid ~1.05 (medium), far 0.9 (small)
        const scale = 1.25 - t * 0.35
        el.style.transform = `scale(${scale})`
        el.style.zIndex = String(100 - Math.round(t * 50))
      })
    }

    const onScroll = () => updateVideoScales()
    scroller.addEventListener('scroll', onScroll, { passive: true } as any)
    // Initial pass (delay to ensure layout ready)
    const id = window.setTimeout(updateVideoScales, 50)

    return () => {
      scroller.removeEventListener('scroll', onScroll)
      window.clearTimeout(id)
    }
  }, [videos])

  return (
    <main className="min-h-screen overflow-x-hidden" style={{backgroundColor: '#F4F9F9'}}>
      {/* Hero Banner Section - Enhanced Colors */}
      <section className="relative py-8 sm:py-12 md:py-16 lg:py-20" style={{background: 'linear-gradient(135deg, #4B97C9 0%, #D0E8F2 50%, #9DB4C0 100%)'}}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center">
            <div className="text-left order-2 lg:order-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-serif mb-3 sm:mb-4 md:mb-6 text-white">
                ELEVATE YOUR SKIN WITH
              </h1>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-serif font-bold mb-3 sm:mb-4 md:mb-6 text-white">
                NATURAL BEAUTY
              </h2>
              <p className="text-sm sm:text-base md:text-lg mb-4 sm:mb-6 md:mb-8 font-light text-white">
                infused with premium natural ingredients
              </p>
              <button
                onClick={handleExploreCollection}
                className="px-4 sm:px-6 md:px-8 py-3 sm:py-3.5 md:py-4 text-white font-medium transition-all duration-300 text-xs sm:text-sm tracking-wide uppercase shadow-lg"
                style={{backgroundColor: '#1B4965'}}
              >
                SHOP NOW
              </button>
            </div>
            <div className="relative order-1 lg:order-2">
              <div className="relative z-10">
                <img 
                  src={heroImages[heroIndex]} 
                  alt="Nefol Hero"
                  className="w-full h-48 sm:h-64 md:h-80 lg:h-96 object-cover rounded-lg shadow-2xl"
                />
                <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center shadow-lg" style={{backgroundColor: '#1B4965'}}>
                  <span className="text-white text-xs sm:text-sm font-bold">NEW</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shop by Category - Enhanced Colors */}
      <section className="py-8 sm:py-12 md:py-16" style={{backgroundColor: '#D0E8F2'}}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-6 sm:mb-8 md:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-serif mb-2 sm:mb-3 md:mb-4" style={{color: '#1B4965'}}>
              SHOP BY CATEGORY
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-8">
            {/* Body */}
            <div className="text-center group cursor-pointer" onClick={() => window.location.hash = '#/user/body'}>
              <div
                className="mx-auto mb-2 sm:mb-3 md:mb-4 flex items-center justify-center w-full max-w-[180px] sm:max-w-[220px] md:max-w-[280px] lg:max-w-[360px] aspect-square"
                style={{
                  WebkitMaskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 100%)',
                  maskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 100%)'
                }}
              >
                <img
                  src="/IMAGES/body.jpg"
                  alt="Body"
                  className="block w-full h-full object-contain"
                  style={{ filter: 'drop-shadow(0 24px 30px rgba(0,0,0,0.28))' }}
                />
              </div>
              <h3 className="text-xs sm:text-sm font-medium tracking-wide" style={{color: '#1B4965'}}>Body</h3>
            </div>

            {/* Face */}
            <div className="text-center group cursor-pointer" onClick={() => window.location.hash = '#/user/face'}>
              <div
                className="mx-auto mb-2 sm:mb-3 md:mb-4 flex items-center justify-center w-full max-w-[180px] sm:max-w-[220px] md:max-w-[280px] lg:max-w-[360px] aspect-square"
                style={{
                  WebkitMaskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 100%)',
                  maskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 100%)'
                }}
              >
                <img
                  src="/IMAGES/face.jpg"
                  alt="Face"
                  className="block w-full h-full object-contain"
                  style={{ filter: 'drop-shadow(0 24px 30px rgba(0,0,0,0.28))' }}
                />
              </div>
              <h3 className="text-xs sm:text-sm font-medium tracking-wide" style={{color: '#1B4965'}}>Face</h3>
            </div>

            {/* Hair */}
            <div className="text-center group cursor-pointer" onClick={() => window.location.hash = '#/user/hair'}>
              <div
                className="mx-auto mb-2 sm:mb-3 md:mb-4 flex items-center justify-center w-full max-w-[180px] sm:max-w-[220px] md:max-w-[280px] lg:max-w-[360px] aspect-square"
                style={{
                  WebkitMaskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 100%)',
                  maskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 100%)'
                }}
              >
                <img
                  src="/IMAGES/hair.jpg"
                  alt="Hair"
                  className="block w-full h-full object-contain"
                  style={{ filter: 'drop-shadow(0 24px 30px rgba(0,0,0,0.28))' }}
                />
              </div>
              <h3 className="text-xs sm:text-sm font-medium tracking-wide" style={{color: '#1B4965'}}>Hair</h3>
            </div>

            {/* Combos */}
            <div className="text-center group cursor-pointer" onClick={() => window.location.hash = '#/user/combos'}>
              <div
                className="mx-auto mb-2 sm:mb-3 md:mb-4 flex items-center justify-center w-full max-w-[180px] sm:max-w-[220px] md:max-w-[280px] lg:max-w-[360px] aspect-square"
                style={{
                  WebkitMaskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 100%)',
                  maskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 100%)'
                }}
              >
                <img
                  src="/IMAGES/combo.jpg"
                  alt="Combos"
                  className="block w-full h-full object-contain"
                  style={{ filter: 'drop-shadow(0 24px 30px rgba(0,0,0,0.28))' }}
                />
              </div>
              <h3 className="text-xs sm:text-sm font-medium tracking-wide" style={{color: '#1B4965'}}>Combos</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Shop What's New - Enhanced Colors */}
      <section className="py-16" style={{backgroundColor: '#F4F9F9'}}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif mb-4" style={{color: '#1B4965'}}>
              SHOP WHAT'S NEW
            </h2>
            <div className="flex justify-center space-x-8 mb-8">
              <button 
                onClick={() => setActiveShopTab('NEW ARRIVALS')}
                className="text-sm font-medium tracking-wide uppercase pb-2 border-b-2" 
                style={{
                  color: activeShopTab === 'NEW ARRIVALS' ? '#1B4965' : '#9DB4C0',
                  borderColor: activeShopTab === 'NEW ARRIVALS' ? '#4B97C9' : 'transparent'
                }}
              >
                NEW ARRIVALS
              </button>
              <button 
                onClick={() => setActiveShopTab('BEST SELLERS')}
                className="text-sm font-medium tracking-wide uppercase pb-2 border-b-2" 
                style={{
                  color: activeShopTab === 'BEST SELLERS' ? '#1B4965' : '#9DB4C0',
                  borderColor: activeShopTab === 'BEST SELLERS' ? '#4B97C9' : 'transparent'
                }}
              >
                BEST SELLERS
              </button>
              <button 
                onClick={() => setActiveShopTab('TOP RATED')}
                className="text-sm font-medium tracking-wide uppercase pb-2 border-b-2" 
                style={{
                  color: activeShopTab === 'TOP RATED' ? '#1B4965' : '#9DB4C0',
                  borderColor: activeShopTab === 'TOP RATED' ? '#4B97C9' : 'transparent'
                }}
              >
                TOP RATED
              </button>
            </div>
        </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm">
                  <div className="h-48 sm:h-64 md:h-80 rounded-t-lg" style={{backgroundColor: '#D0E8F2'}}></div>
                  <div className="p-4 sm:p-6">
                    <div className="h-6 mb-2" style={{backgroundColor: '#9DB4C0'}}></div>
                    <div className="h-4 mb-4" style={{backgroundColor: '#9DB4C0'}}></div>
                    <div className="h-8" style={{backgroundColor: '#9DB4C0'}}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {products.slice(0, 6).map((product, index) => {
                return (
                  <div key={product.slug} className="bg-white rounded-lg shadow-sm group cursor-pointer flex flex-col" onClick={() => window.location.hash = `#/user/product/${product.slug}`}>
                    <div className="relative overflow-hidden rounded-t-lg">
                      <img 
                        src={product.listImage || product.list_image || '/IMAGES/default-product.jpg'} 
                        alt={product.title}
                        className="w-full h-48 sm:h-64 md:h-80 object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAddToWishlist(product)
                          }}
                          className="w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg"
                        >
                          <Heart className="w-5 h-5" style={{color: '#1B4965'}} />
                        </button>
                      </div>
                      <div className="absolute top-4 left-4">
                        <span className="text-white px-3 py-1 text-xs font-medium tracking-wide uppercase rounded-full" style={{backgroundColor: '#4B97C9'}}>
                          {product.category || 'NEFOL'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 sm:p-6 flex flex-col h-full">
                      <h3 className="text-base sm:text-lg font-medium tracking-wide mb-2 line-clamp-2" style={{color: '#1B4965'}}>
                        {product.title}
                      </h3>
                      <div className="flex items-center mb-2">
                        <div className="flex text-yellow-400">
                          <Star className="w-4 h-4 fill-current" />
                          <Star className="w-4 h-4 fill-current" />
                          <Star className="w-4 h-4 fill-current" />
                          <Star className="w-4 h-4 fill-current" />
                          <Star className="w-4 h-4 fill-current" />
                        </div>
                        <span className="text-sm ml-2" style={{color: '#9DB4C0'}}>4.5 (45 Reviews)</span>
                      </div>
                      <div className="mt-auto pt-2">
                        <div className="flex flex-col w-full">
                          <div className="flex items-center gap-2 mb-2">
                            <PricingDisplay 
                              product={product} 
                              csvProduct={product.csvProduct}
                            />
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddToCart(product)
                              }}
                              className="flex-1 px-2 sm:px-3 py-2 text-white text-xs sm:text-xs font-medium transition-all duration-300 tracking-wide uppercase rounded shadow-lg"
                              style={{backgroundColor: '#4B97C9', minHeight: '44px'}}
                            >
                              ADD TO CART
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                handleBuyNow(product)
                              }}
                              className="flex-1 px-2 sm:px-3 py-2 text-white text-xs sm:text-xs font-medium transition-all duration-300 tracking-wide uppercase rounded shadow-lg"
                              style={{backgroundColor: '#1B4965', minHeight: '44px'}}
                            >
                              BUY NOW
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Thoughtful Commitments - Enhanced Colors */}
      <section className="py-16" style={{backgroundColor: '#9DB4C0'}}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif mb-4 text-white">
              THOUGHTFUL COMMITMENTS
            </h2>
            <p className="text-lg font-light max-w-2xl mx-auto text-white">
              We are committed to providing you with the safest and most effective natural skincare products.
            </p>
          </div>

          {/* Static certifications grid */}
          <div className="flex flex-wrap justify-center items-center gap-8">
            <div className="text-center">
              <div className="w-48 h-36 mx-auto mb-4 flex items-center justify-center">
                <img 
                  src="/IMAGES/cruielty.jpg" 
                  alt="Cruelty-Free"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div className="text-center">
              <div className="w-48 h-36 mx-auto mb-4 flex items-center justify-center">
                <img 
                  src="/IMAGES/paraben.jpg" 
                  alt="Paraben-Free"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div className="text-center">
              <div className="w-48 h-36 mx-auto mb-4 flex items-center justify-center">
                <img 
                  src="/IMAGES/india.jpg" 
                  alt="Made in India"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div className="text-center">
              <div className="w-48 h-36 mx-auto mb-4 flex items-center justify-center">
                <img 
                  src="/IMAGES/chemical.jpg" 
                  alt="Chemical-Free"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div className="text-center">
              <div className="w-full max-w-48 h-36 mx-auto mb-4 flex items-center justify-center">
                <img 
                  src="/IMAGES/vegan.jpg" 
                  alt="Vegan"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shop by Collection - Enhanced Colors */}
      <section className="py-16" style={{backgroundColor: '#D0E8F2'}}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <img 
                src={(products[0]?.listImage || products[0]?.pdpImages?.[0] || heroImages[heroIndex])}
                alt="Nefol Collection"
                className="w-full h-96 object-cover rounded-lg shadow-2xl"
              />
            </div>
            <div className="text-left">
              <h2 className="text-3xl font-serif mb-4" style={{color: '#1B4965'}}>
                NEFOL COLLECTION
                  </h2>
              <h3 className="text-xl font-light mb-4" style={{color: '#4B97C9'}}>
                ELEVATE YOUR SKINCARE WITH
              </h3>
              <p className="text-lg font-light mb-8 leading-relaxed" style={{color: '#1B4965'}}>
                Our premium collection combines the best of nature and science to deliver exceptional results for your skin.
              </p>
              <button 
                onClick={handleShopNow}
                className="px-8 py-4 text-white font-medium transition-all duration-300 text-sm tracking-wide uppercase shadow-lg"
                style={{backgroundColor: '#4B97C9'}}
              >
                SHOP NOW
                  </button>
                </div>
          </div>
        </div>
      </section>

      {/* Complete Kit - Banner Image */}
      <section className="py-16" style={{backgroundColor: '#F4F9F9'}}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="relative overflow-hidden rounded-2xl shadow-2xl">
            <img src={heroImages[heroIndex]} alt="Complete Kit" className="w-full h-[420px] object-cover" />
            <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-serif mb-4 text-white">THE COMPLETE KIT</h2>
                <p className="text-white/90 mb-6">Get the full Nefol experience in one curated bundle</p>
                <button
                  onClick={handleViewKit}
                  className="px-8 py-3 text-white font-medium tracking-wide uppercase rounded shadow-lg"
                  style={{backgroundColor: '#1B4965'}}
                >
                  View Kit
                  </button>
                </div>
              </div>
          </div>
        </div>
      </section>

      {/* Trusted Partners - nefol Inspired */}
      <section className="py-16" style={{backgroundColor: '#F4F9F9'}}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif mb-4 text-black">
              AVAILABLE ON
            </h2>
          </div>

          <style>{`
            @keyframes brandScroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}</style>

          <div className="relative overflow-hidden py-6 rounded-lg" style={{backgroundColor: '#D0E8F2'}}>
            <div
              className="flex items-center gap-16 w-[200%]"
              style={{ animation: 'brandScroll 30s linear infinite' }}
            >
              <div className="flex items-center gap-16 w-1/2 justify-around">
                <img src="/IMAGES/Amazon.jpg" alt="Amazon" className="h-12 w-auto object-contain drop-shadow" />
                <img src="/IMAGES/Flipkart-logo.png" alt="Flipkart" className="h-12 w-auto object-contain drop-shadow" />
                <img src="/IMAGES/meesho.png" alt="Meesho" className="h-12 w-auto object-contain drop-shadow" />
                <img src="/IMAGES/Amazon.jpg" alt="Amazon" className="h-12 w-auto object-contain drop-shadow" />
                <img src="/IMAGES/Flipkart-logo.png" alt="Flipkart" className="h-12 w-auto object-contain drop-shadow" />
                <img src="/IMAGES/meesho.png" alt="Meesho" className="h-12 w-auto object-contain drop-shadow" />
              </div>
              <div className="flex items-center gap-16 w-1/2 justify-around">
                <img src="/IMAGES/Amazon.jpg" alt="Amazon" className="h-12 w-auto object-contain drop-shadow" />
                <img src="/IMAGES/Flipkart-logo.png" alt="Flipkart" className="h-12 w-auto object-contain drop-shadow" />
                <img src="/IMAGES/meesho.png" alt="Meesho" className="h-12 w-auto object-contain drop-shadow" />
                <img src="/IMAGES/Amazon.jpg" alt="Amazon" className="h-12 w-auto object-contain drop-shadow" />
                <img src="/IMAGES/Flipkart-logo.png" alt="Flipkart" className="h-12 w-auto object-contain drop-shadow" />
                <img src="/IMAGES/meesho.png" alt="Meesho" className="h-12 w-auto object-contain drop-shadow" />
              </div>
              </div>
          </div>
        </div>
      </section>

      {/* Social Media - Local Videos */}
      <section className="py-0" style={{backgroundColor: '#D0E8F2'}}>
        <div className="w-screen">
          <div className="text-center mb-6 pt-6">
            <h2 className="text-3xl font-serif mb-2" style={{color: '#1B4965'}}>SOCIAL MEDIA</h2>
            <p className="text-gray-700">Watch our latest posts and reels</p>
          </div>

          <style>{`
            #video-scroller { scrollbar-width: none; -ms-overflow-style: none; }
            #video-scroller::-webkit-scrollbar { display: none; }
          `}</style>

          {(() => {
            const localVideos = [
              '/IMAGES/aec80e47574f9e853b2d6809785f62d7.mp4',
              '/IMAGES/d81e113b2399f2e11d9d93481687e5c0.mp4',
              '/IMAGES/dc7d14a7-cb58-4ba0-8aa5-338bcb21462f.mp4',
              '/IMAGES/e8bf5173d20af563206012c88e21c781_720w.mp4',
              '/IMAGES/Open Pores, Acne Marks & Blackheads Treatment F.mp4'
            ]
            const apiVideos = (videos || []).map((v: any) =>
              v.video_type === 'local' ? `${window.location.protocol}//${window.location.hostname}:4000/uploads/${v.video_url}` : v.video_url
            )
            const allVideos = [...localVideos, ...apiVideos]
            const doubled = [...allVideos, ...allVideos]

            // Auto-scroll via requestAnimationFrame
            const startAutoScroll = () => {
              const scroller = document.getElementById('video-scroller') as HTMLElement | null
              if (!scroller) return
              let rafId = 0
              const speed = 0.6 // px per frame
              const step = () => {
                if (scroller.scrollWidth === 0) { rafId = requestAnimationFrame(step); return }
                scroller.scrollLeft += speed
                const half = scroller.scrollWidth / 2
                if (scroller.scrollLeft >= half) {
                  scroller.scrollLeft -= half
                }
                rafId = requestAnimationFrame(step)
              }
              rafId = requestAnimationFrame(step)
              return () => cancelAnimationFrame(rafId)
            }
            // Kick off after paint
            setTimeout(startAutoScroll, 100)

            const scrollByViewport = (dir: number) => {
              const scroller = document.getElementById('video-scroller') as HTMLElement | null
              if (!scroller) return
              const delta = (scroller.clientWidth * 0.2) * dir
              scroller.scrollBy({ left: delta, behavior: 'smooth' })
              window.setTimeout(() => scroller.dispatchEvent(new Event('scroll')), 120)
              }
              
              return (
              <div className="relative">
                <button
                  aria-label="Prev"
                  onClick={() => scrollByViewport(-1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg hover:shadow-xl px-4 py-3 rounded-full transition-all duration-200"
                >
                  &lt;
                </button>

                <div
                  id="video-scroller"
                  className="flex overflow-x-hidden snap-x snap-mandatory px-4 py-4"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  {doubled.map((src, idx) => (
                    <div
                      key={idx}
                      className="video-item snap-start shrink-0 bg-white overflow-hidden mx-2 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                      style={{ width: 'calc(20% - 16px)', transformOrigin: 'center center', transition: 'transform 200ms ease' }}
                    >
                      <video
                        src={src}
                        className="block w-full h-auto rounded-2xl hover:scale-105 transition-transform duration-300"
                        autoPlay
                        loop
                        muted
                        playsInline
                        controls={false}
                      />
                    </div>
                  ))}
                </div>

                <button 
                  aria-label="Next"
                  onClick={() => scrollByViewport(1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg hover:shadow-xl px-4 py-3 rounded-full transition-all duration-200"
                >
                  &gt;
                </button>
                </div>
              )
          })()}
        </div>
      </section>

      {/* Forever Favorites - nefol Inspired */}
      <section className="py-16" style={{backgroundColor: '#F4F9F9'}}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif mb-4 text-black">
              FOREVER FAVORITES
                  </h2>
            <p className="text-lg font-light max-w-2xl mx-auto text-gray-600">
              Discover our most loved products that have become staples in skincare routines worldwide.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="relative group cursor-pointer">
              <img 
                src={(products[0]?.listImage || products[0]?.pdpImages?.[0] || heroImages[0])}
                alt="Luxury Skincare"
                className="w-full h-80 object-cover rounded-lg shadow-lg transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="text-center text-white">
                  <h3 className="text-2xl font-serif mb-2">LUXURY SKINCARE</h3>
                  <button 
                    onClick={handleShopNow}
                    className="px-6 py-3 bg-white text-black font-medium transition-all duration-300 text-sm tracking-wide uppercase rounded"
                  >
                    SHOP NOW
                  </button>
                </div>
              </div>
            </div>
            <div className="relative group cursor-pointer">
              <img 
                src={(products[1]?.listImage || products[1]?.pdpImages?.[0] || heroImages[0])}
                alt="Natural Beauty"
                className="w-full h-80 object-cover rounded-lg shadow-lg transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="text-center text-white">
                  <h3 className="text-2xl font-serif mb-2">NATURAL BEAUTY</h3>
                  <button 
                    onClick={handleShopNow}
                    className="px-6 py-3 bg-white text-black font-medium transition-all duration-300 text-sm tracking-wide uppercase rounded"
                  >
                    SHOP NOW
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Testimonials - nefol Inspired */}
      <section className="py-16" style={{backgroundColor: '#F4F9F9'}}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif mb-4 text-black">
              WHAT OUR CUSTOMERS SAY
            </h2>
            <div className="flex justify-center mb-4">
              <div className="flex text-yellow-400">
                <Star className="w-6 h-6 fill-current" />
                <Star className="w-6 h-6 fill-current" />
                <Star className="w-6 h-6 fill-current" />
                <Star className="w-6 h-6 fill-current" />
                <Star className="w-6 h-6 fill-current" />
                  </div>
                </div>
            <p className="text-lg font-light max-w-3xl mx-auto italic text-gray-600">
              "Nefol has completely transformed my skincare routine. The natural ingredients work wonders and my skin has never looked better!"
            </p>
                  </div>
          <div className="flex justify-center space-x-8">
            {['Rhea Sharma', 'Ananya Singh', 'Priya Patel', 'Neha Gupta', 'Sara Khan'].map((name, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center text-white font-bold" style={{backgroundColor: '#4B97C9'}}>
                  {name.split(' ').map(n => n[0]).join('')}
                </div>
                <p className="text-sm font-medium text-black">{name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Thoughtful Self-Care - nefol Inspired */}
      <section className="py-16" style={{backgroundColor: '#F4F9F9'}}>
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="text-3xl font-serif mb-4 text-black">
            THOUGHTFUL SELF-CARE
          </h2>
          <p className="text-lg font-light max-w-2xl mx-auto mb-8 text-gray-600">
            Embrace the power of natural ingredients and transform your skincare routine with our thoughtfully crafted products.
          </p>
          <button 
            onClick={handleExploreCollection}
            className="px-8 py-4 text-white font-medium transition-all duration-300 text-sm tracking-wide uppercase"
            style={{backgroundColor: '#1B4965'}}
          >
            SHOP ALL PRODUCTS
          </button>
        </div>
      </section>

      {/* Floating Action Button - nefol Inspired */}
      <button 
        onClick={handleExploreCollection}
        className="fixed bottom-8 right-8 w-14 h-14 text-white transition-all duration-300 z-50 shadow-lg rounded-full flex items-center justify-center"
        style={{backgroundColor: '#1B4965'}}
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* Subscription Modal */}
      <SubscriptionModal 
        isOpen={showSubscriptionModal}
        onClose={handleCloseSubscriptionModal}
      />
    </main>
  )
}