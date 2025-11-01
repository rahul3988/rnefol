import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Star, Sparkles, Crown, Gift, ChevronDown } from 'lucide-react'
import { api } from '../services/api'
import SubscriptionModal from '../components/SubscriptionModal'
import ScrollReveal from '../components/ScrollReveal'
import CountUp from '../components/CountUp'
import { smoothScrollTo } from '../components/SmoothScroll'

export default function Home() {
  const { user, isAuthenticated } = useAuth()
  const [products, setProducts] = useState<any[]>([])
  const [videos, setVideos] = useState<any[]>([])
  const [loyaltyPoints, setLoyaltyPoints] = useState(0)
  const [cashbackBalance, setCashbackBalance] = useState(0)
  const [activeDiscounts, setActiveDiscounts] = useState<any[]>([])
  const [personalizedContent, setPersonalizedContent] = useState<any>(null)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  
  // Hero Banner from CMS
  const [heroImages, setHeroImages] = useState<string[]>([
    '/IMAGES/BANNER (1).jpg',
    '/IMAGES/BANNER (2).jpg',
    '/IMAGES/BANNER (3).jpg'
  ])
  const [heroSettings, setHeroSettings] = useState<any>({
    animationType: 'fade',
    transitionDuration: 1000,
    autoPlay: true,
    autoPlayDelay: 7000,
    designStyle: 'modern',
    showDots: true,
    showArrows: true,
    loop: true
  })
  const [heroIndex, setHeroIndex] = useState(0)

  const highlightSections: {
    title: string
    description: string
    cta: string
    hash: string
    icon: React.ElementType
    gradient: string
  }[] = [
    {
      title: 'Exclusive Offers',
      description: 'Limited-time bundles and reward drops curated just for your skincare ritual.',
      cta: 'View Offers',
      hash: '#/user/offers',
      icon: Gift,
      gradient: 'from-rose-100 via-amber-50 to-white'
    },
    {
      title: 'Fresh New Arrivals',
      description: 'Discover the latest launches crafted with botanicals your skin will love.',
      cta: 'Explore New Arrivals',
      hash: '#/user/new-arrivals',
      icon: Sparkles,
      gradient: 'from-blue-100 via-indigo-50 to-white'
    },
    {
      title: 'Bestselling Heroes',
      description: 'Shop customer favourites and our most celebrated complexion heroes.',
      cta: 'Shop Best Sellers',
      hash: '#/user/best-sellers',
      icon: Crown,
      gradient: 'from-emerald-100 via-teal-50 to-white'
    }
  ]

  // Fetch Hero Banner from CMS
  const fetchHeroBanner = async () => {
    try {
      const apiBase = import.meta.env.DEV 
        ? 'http://192.168.1.66:4000'
        : `${window.location.protocol}//${window.location.hostname}:4000`
      const response = await fetch(`${apiBase}/api/cms/sections/home`)
      if (response.ok) {
        const sections = await response.json()
        const heroSection = sections.find((s: any) => s.section_type === 'hero_banner')
        
        if (heroSection && heroSection.content) {
          const content = heroSection.content
          
          // Get images/videos array
          if (content.images && Array.isArray(content.images) && content.images.length > 0) {
            // Convert relative URLs to absolute if needed
            const normalizeUrl = (url: string) => {
              if (!url) return ''
              if (/^https?:\/\//i.test(url)) return url
              if (url.startsWith('/')) {
                return `${apiBase}${url}`
              }
              return `${apiBase}/${url}`
            }
            
            const normalizedImages = content.images.map(normalizeUrl)
            setHeroImages(normalizedImages)
          }
          
          // Get settings
          if (content.settings) {
            setHeroSettings(content.settings)
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch hero banner from CMS:', error)
      // Keep default images on error
    }
  }

  // Auto-rotate hero images/videos
  useEffect(() => {
    if (heroImages.length === 0) return
    
    if (!heroSettings.autoPlay) return
    
    const id = window.setInterval(() => {
      setHeroIndex((prev) => {
        if (heroSettings.loop) {
          return (prev + 1) % heroImages.length
        } else {
          return prev < heroImages.length - 1 ? prev + 1 : prev
        }
      })
    }, heroSettings.autoPlayDelay || 7000)
    
    return () => window.clearInterval(id)
  }, [heroImages.length, heroSettings.autoPlay, heroSettings.autoPlayDelay, heroSettings.loop])

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

  const [cmsSections, setCmsSections] = useState<any[]>([])

  // Fetch all CMS sections for homepage
  const fetchCMSSections = async () => {
    try {
      const apiBase = import.meta.env.DEV 
        ? 'http://192.168.1.66:4000'
        : `${window.location.protocol}//${window.location.hostname}:4000`
      const response = await fetch(`${apiBase}/api/cms/sections/home`)
      if (response.ok) {
        const sections = await response.json()
        setCmsSections(sections)
      }
    } catch (error) {
      console.error('Failed to fetch CMS sections:', error)
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchVideos()
    fetchHeroBanner()
    fetchCMSSections()
  }, []) // Only run once on mount

  // Listen for product updates and refresh
  useEffect(() => {
    const handleProductUpdate = () => {
      console.log('🔄 Product updated, refreshing home page products')
      fetchProducts()
    }

    window.addEventListener('product-updated', handleProductUpdate)
    window.addEventListener('refresh-products', handleProductUpdate)

    return () => {
      window.removeEventListener('product-updated', handleProductUpdate)
      window.removeEventListener('refresh-products', handleProductUpdate)
    }
  }, [])

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
      {/* Hero Banner Section - Enhanced Colors with Animations */}
      <section 
        id="hero" 
        className="relative py-8 sm:py-12 md:py-16 lg:py-20" 
        style={{background: 'linear-gradient(135deg, #4B97C9 0%, #D0E8F2 50%, #9DB4C0 100%)'}}
      >
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center">
            <ScrollReveal animationType="fade-right" delay={0}>
              <div className="text-left order-2 lg:order-1">
                <h1 
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-serif mb-3 sm:mb-4 md:mb-6 text-white"
                  data-aos="fade-right"
                  data-aos-duration="800"
                >
                  ELEVATE YOUR SKIN WITH
                </h1>
                <h2 
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-serif font-bold mb-3 sm:mb-4 md:mb-6 text-white"
                  data-aos="fade-right"
                  data-aos-delay="100"
                  data-aos-duration="800"
                >
                  NATURAL BEAUTY
                </h2>
                <p 
                  className="text-sm sm:text-base md:text-lg mb-4 sm:mb-6 md:mb-8 font-light text-white"
                  data-aos="fade-right"
                  data-aos-delay="200"
                  data-aos-duration="800"
                >
                  infused with premium natural ingredients
                </p>
                <div
                  data-aos="fade-right"
                  data-aos-delay="300"
                  data-aos-duration="800"
                >
                  <button
                    onClick={handleExploreCollection}
                    className="px-4 sm:px-6 md:px-8 py-3 sm:py-3.5 md:py-4 text-white font-medium transition-all duration-300 text-xs sm:text-sm tracking-wide uppercase shadow-lg hover:scale-105 hover:shadow-xl"
                    style={{backgroundColor: '#1B4965'}}
                  >
                    SHOP NOW
                  </button>
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal animationType="fade-left" delay={100}>
              <div className="relative order-1 lg:order-2">
                <div className="relative z-10">
                  {heroImages.length > 0 && heroImages[heroIndex] && (
                    <>
                      {/\.(mp4|webm|ogg|mov|avi)(\?|$)/i.test(heroImages[heroIndex]) ? (
                        <video
                          src={heroImages[heroIndex]}
                          className="w-full h-48 sm:h-64 md:h-80 lg:h-96 object-cover rounded-lg shadow-2xl"
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                      ) : (
                        <img 
                          src={heroImages[heroIndex]} 
                          alt="Nefol Hero"
                          className="w-full h-48 sm:h-64 md:h-80 lg:h-96 object-cover rounded-lg shadow-2xl transition-opacity duration-1000 ease-in-out"
                          key={heroIndex}
                          style={{
                            opacity: 1,
                            transition: `opacity ${heroSettings.transitionDuration || 1000}ms ease-in-out`,
                          }}
                        />
                      )}
                      
                      {/* Navigation Dots */}
                      {heroSettings.showDots && heroImages.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
                          {heroImages.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setHeroIndex(idx)}
                              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                idx === heroIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/75'
                              }`}
                              aria-label={`Go to slide ${idx + 1}`}
                            />
                          ))}
                        </div>
                      )}
                      
                      {/* Arrow Buttons */}
                      {heroSettings.showArrows && heroImages.length > 1 && (
                        <>
                          <button
                            onClick={() => {
                              if (heroSettings.loop) {
                                setHeroIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length)
                              } else {
                                setHeroIndex((prev) => Math.max(0, prev - 1))
                              }
                            }}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-all duration-300 hover:scale-110 z-20"
                            aria-label="Previous slide"
                          >
                            ←
                          </button>
                          <button
                            onClick={() => {
                              if (heroSettings.loop) {
                                setHeroIndex((prev) => (prev + 1) % heroImages.length)
                              } else {
                                setHeroIndex((prev) => Math.min(heroImages.length - 1, prev + 1))
                              }
                            }}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-all duration-300 hover:scale-110 z-20"
                            aria-label="Next slide"
                          >
                            →
                          </button>
                        </>
                      )}
                    </>
                  )}
                  <div 
                    className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center shadow-lg animate-pulse"
                    style={{backgroundColor: '#1B4965'}}
                    data-aos="zoom-in"
                    data-aos-delay="400"
                  >
                    <span className="text-white text-xs sm:text-sm font-bold">NEW</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
          
          {/* Smooth Scroll Arrow */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <button
              onClick={() => smoothScrollTo('highlights', 80)}
              className="text-white hover:text-gray-200 transition-colors duration-300"
              aria-label="Scroll down"
            >
              <ChevronDown className="w-8 h-8" />
            </button>
          </div>
        </div>
      </section>

      {/* Featured Highlights - Offers, New Arrivals, Best Sellers */}
      <section id="highlights" className="py-8 sm:py-12 md:py-16" style={{backgroundColor: '#F8FAFC'}}>
        <div className="mx-auto max-w-7xl px-4">
          <ScrollReveal animationType="fade-up" delay={0}>
            <div className="text-center mb-6 sm:mb-8 md:mb-12">
              <h2 
                className="text-xl sm:text-2xl md:text-3xl font-serif mb-3" 
                style={{color: '#1B4965'}}
                data-aos="fade-up"
                data-aos-duration="800"
              >
                EXPLORE NEFOL HIGHLIGHTS
              </h2>
              <p 
                className="mx-auto max-w-2xl text-sm sm:text-base text-slate-600"
                data-aos="fade-up"
                data-aos-delay="100"
                data-aos-duration="800"
              >
                Jump straight into exclusive offers, the freshest arrivals, and crowd-favourite essentials curated for you.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:gap-8 md:grid-cols-3">
            {highlightSections.map((section, index) => {
              const Icon = section.icon
              return (
                <ScrollReveal 
                  key={section.title} 
                  animationType="fade-up" 
                  delay={index * 100}
                >
                  <button
                    type="button"
                    onClick={() => (window.location.hash = section.hash)}
                    className={`group relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br ${section.gradient} p-6 sm:p-8 text-left shadow-lg transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400`}
                    data-aos="fade-up"
                    data-aos-delay={index * 100}
                    data-aos-duration="800"
                  >
                    <div className="mb-6 inline-flex items-center justify-center rounded-full bg-white/80 p-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Icon className="h-6 w-6 text-slate-800" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold tracking-wide" style={{color: '#1B4965'}}>
                      {section.title}
                    </h3>
                    <p className="mt-3 text-sm sm:text-base text-slate-600">
                      {section.description}
                    </p>
                    <span className="mt-6 inline-flex items-center text-sm font-semibold uppercase tracking-wide text-slate-900">
                      {section.cta}
                      <span className="ml-2 transition-transform duration-200 group-hover:translate-x-2">→</span>
                    </span>
                  </button>
                </ScrollReveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* Statistics Section - Natura Bissé Style */}
      <section className="py-16" style={{backgroundColor: '#F4F9F9'}}>
        <div className="mx-auto max-w-7xl px-4">
          <ScrollReveal animationType="fade-up" delay={0}>
            <div className="text-center mb-12">
              <h2 
                className="text-2xl sm:text-3xl md:text-4xl font-serif mb-4" 
                style={{color: '#1B4965'}}
                data-aos="fade-up"
              >
                THE MOST INTELLIGENT ANTI-AGING SKINCARE
              </h2>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              { label: 'More Hydrated & Supple', value: 49, description: 'Users report significantly improved skin hydration' },
              { label: 'More Firmness & Luminosity', value: 48, description: 'Enhanced skin firmness and natural glow' },
              { label: 'Fewer Wrinkles & Lines', value: 49, description: 'Visible reduction in fine lines and wrinkles' }
            ].map((stat, index) => (
              <ScrollReveal key={index} animationType="zoom" delay={index * 150}>
                <div 
                  className="text-center p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
                  data-aos="zoom-in"
                  data-aos-delay={index * 150}
                >
                  <div className="text-5xl sm:text-6xl md:text-7xl font-bold mb-4" style={{color: '#4B97C9'}}>
                    <CountUp end={stat.value} suffix="%" duration={2000} startOnView={true} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2" style={{color: '#1B4965'}}>
                    {stat.label}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {stat.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Category - Enhanced Colors */}
      <section className="py-8 sm:py-12 md:py-16" style={{backgroundColor: '#D0E8F2'}}>
        <div className="mx-auto max-w-7xl px-4">
          <ScrollReveal animationType="fade-up" delay={0}>
            <div className="text-center mb-6 sm:mb-8 md:mb-12">
              <h2 
                className="text-xl sm:text-2xl md:text-3xl font-serif mb-2 sm:mb-3 md:mb-4" 
                style={{color: '#1B4965'}}
                data-aos="fade-up"
              >
                SHOP BY CATEGORY
              </h2>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-8">
            {/* Body */}
            <ScrollReveal animationType="zoom" delay={0}>
              <div 
                className="text-center group cursor-pointer transform transition-all duration-500 hover:scale-110" 
                onClick={() => window.location.hash = '#/user/body'}
                data-aos="zoom-in"
                data-aos-delay="0"
              >
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
            </ScrollReveal>

            {/* Face */}
            <ScrollReveal animationType="zoom" delay={100}>
              <div 
                className="text-center group cursor-pointer transform transition-all duration-500 hover:scale-110" 
                onClick={() => window.location.hash = '#/user/face'}
                data-aos="zoom-in"
                data-aos-delay="100"
              >
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
            </ScrollReveal>

            {/* Hair */}
            <ScrollReveal animationType="zoom" delay={200}>
              <div 
                className="text-center group cursor-pointer transform transition-all duration-500 hover:scale-110" 
                onClick={() => window.location.hash = '#/user/hair'}
                data-aos="zoom-in"
                data-aos-delay="200"
              >
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
            </ScrollReveal>

            {/* Combos */}
            <ScrollReveal animationType="zoom" delay={300}>
              <div 
                className="text-center group cursor-pointer transform transition-all duration-500 hover:scale-110" 
                onClick={() => window.location.hash = '#/user/combos'}
                data-aos="zoom-in"
                data-aos-delay="300"
              >
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
            </ScrollReveal>
          </div>
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
          <style>{`
            .commitment-scroll::-webkit-scrollbar { display: none; }
          `}</style>
          <div className="commitment-scroll -mx-4 overflow-x-auto pb-2 sm:mx-0" style={{ scrollbarWidth: 'none' }}>
            <div className="flex flex-nowrap items-center justify-start md:justify-center gap-6 md:gap-8 px-4 sm:px-0" style={{ msOverflowStyle: 'none' }}>
              <div className="text-center flex-shrink-0">
                <div className="w-40 sm:w-48 h-32 sm:h-36 mx-auto mb-4 flex items-center justify-center">
                  <img 
                    src="/IMAGES/cruielty.jpg" 
                    alt="Cruelty-Free"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <div className="text-center flex-shrink-0">
                <div className="w-40 sm:w-48 h-32 sm:h-36 mx-auto mb-4 flex items-center justify-center">
                  <img 
                    src="/IMAGES/paraben.jpg" 
                    alt="Paraben-Free"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <div className="text-center flex-shrink-0">
                <div className="w-40 sm:w-48 h-32 sm:h-36 mx-auto mb-4 flex items-center justify-center">
                  <img 
                    src="/IMAGES/india.jpg" 
                    alt="Made in India"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <div className="text-center flex-shrink-0">
                <div className="w-40 sm:w-48 h-32 sm:h-36 mx-auto mb-4 flex items-center justify-center">
                  <img 
                    src="/IMAGES/chemical.jpg" 
                    alt="Chemical-Free"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <div className="text-center flex-shrink-0">
                <div className="w-40 sm:w-48 h-32 sm:h-36 mx-auto mb-4 flex items-center justify-center">
                  <img 
                    src="/IMAGES/vegan.jpg" 
                    alt="Vegan"
                    className="w-full h-full object-contain"
                  />
                </div>
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
              const card = scroller.querySelector('.video-item') as HTMLElement | null
              const cardWidth = card ? card.getBoundingClientRect().width : scroller.clientWidth
              const styles = card ? window.getComputedStyle(card) : null
              const marginX = styles ? parseFloat(styles.marginLeft || '0') + parseFloat(styles.marginRight || '0') : 32
              const delta = (cardWidth + marginX) * dir
              scroller.scrollBy({ left: delta, behavior: 'smooth' })
              window.setTimeout(() => scroller.dispatchEvent(new Event('scroll')), 160)
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
                  className="flex overflow-x-auto snap-x snap-mandatory px-6 sm:px-8 lg:px-4 py-4"
                  style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
                >
                  {doubled.map((src, idx) => (
                    <div
                      key={idx}
                      className="video-item snap-start shrink-0 bg-white overflow-hidden mx-2 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                      style={{ width: 'clamp(260px, 70vw, 360px)', transformOrigin: 'center center', transition: 'transform 200ms ease' }}
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

      {/* Dynamic CMS Sections (Custom Sections) */}
      {cmsSections
        .filter((s: any) => s.section_type.startsWith('custom_') && s.is_active)
        .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
        .map((section: any) => {
          const content = section.content || {}
          const images = content.images || []
          const normalizeUrl = (url: string) => {
            if (!url) return ''
            if (/^https?:\/\//i.test(url)) return url
            const apiBase = import.meta.env.DEV 
              ? 'http://192.168.1.66:4000'
              : `${window.location.protocol}//${window.location.hostname}:4000`
            if (url.startsWith('/')) {
              return `${apiBase}${url}`
            }
            return `${apiBase}/${url}`
          }

          return (
            <section key={section.id} className="py-16" style={{backgroundColor: '#F4F9F9'}}>
              <div className="mx-auto max-w-7xl px-4">
                {content.title && (
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-serif mb-4" style={{color: '#1B4965'}}>
                      {content.title}
                    </h2>
                    {content.description && (
                      <p className="text-lg font-light max-w-2xl mx-auto text-gray-600">
                        {content.description}
                      </p>
                    )}
                  </div>
                )}
                
                {images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((imageUrl: string, index: number) => {
                      const normalizedUrl = normalizeUrl(imageUrl)
                      const isVideo = /\.(mp4|webm|ogg|mov|avi)(\?|$)/i.test(normalizedUrl)
                      
                      return (
                        <div key={index} className="relative group">
                          {isVideo ? (
                            <video
                              src={normalizedUrl}
                              className="w-full h-64 object-cover rounded-lg shadow-lg"
                              controls
                              muted
                              playsInline
                            />
                          ) : (
                            <img
                              src={normalizedUrl}
                              alt={`${content.title} ${index + 1}`}
                              className="w-full h-64 object-cover rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </section>
          )
        })}

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