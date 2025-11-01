import React, { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import SplashScreen from './components/SplashScreen'
import Logo from './components/Logo'
import ThemeToggle from './components/ThemeToggle'
import CartIcon from './components/CartIcon'
import ProfileAvatar from './components/ProfileAvatar'
import { useCart } from './contexts/CartContext'
import { useTheme, ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { WishlistProvider, useWishlist } from './contexts/WishlistContext'
import { CartProvider } from './contexts/CartContext'
import { userSocketService } from './services/socket'
import LoginPage from './pages/Login'
import Profile from './pages/Profile'
import NefolCoins from './pages/NefolCoins'
import CoinWithdrawal from './pages/CoinWithdrawal'
import UserOrders from './pages/UserOrders'
import SavedCards from './pages/SavedCards'
import ManageAddress from './pages/ManageAddress'
import OrderDetails from './pages/OrderDetails'
import Wishlist from './pages/Wishlist'
import AboutUs from './pages/AboutUs'
import FAQ from './pages/FAQ'
import BlueTeaBenefits from './pages/BlueTeaBenefits'
import ChairpersonMessage from './pages/ChairpersonMessage'
import USP from './pages/USP'
import PrivacyPolicy from './pages/PrivacyPolicy'
import RefundPolicy from './pages/RefundPolicy'
import ShippingPolicy from './pages/ShippingPolicy'
import TermsOfService from './pages/TermsOfService'
import Face from './pages/Face'
import Body from './pages/Body'
import Hair from './pages/Hair'
import Orders from './pages/Orders'
import Account from './pages/Account'
import Community from './pages/Community'
import Notifications from './pages/Notifications'
import LiveChatWidget from './components/LiveChatWidget'
import SmoothScroll from './components/SmoothScroll'
import NewsletterPopup from './components/NewsletterPopup'
import SearchButton from './components/SearchButton'
import PrivacySecurity from './pages/PrivacySecurity'
import PaymentMethods from './pages/PaymentMethods'
import LoyaltyRewards from './pages/LoyaltyRewards'
import Combos from './pages/Combos'
import Cart from './pages/Cart'
import SearchPage from './pages/SearchPage'

function AppContent() {
  const { theme } = useTheme()
  const { items: cartItems } = useCart()
  const { items: wishlistItems } = useWishlist()
  const { user, isAuthenticated, logout } = useAuth()
  const [showSplash, setShowSplash] = useState(true)
  const [showSearch, setShowSearch] = useState(false)
  const [showWishlist, setShowWishlist] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [affiliateId, setAffiliateId] = useState<string | null>(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // Capture referral parameter from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const refParam = urlParams.get('ref')
    if (refParam) {
      console.log('🎯 Referral link detected:', refParam)
      setAffiliateId(refParam)
      // Store in localStorage for persistence across page navigation
      localStorage.setItem('affiliate_ref', refParam)
    } else {
      // Check if we have a stored affiliate ref
      const storedRef = localStorage.getItem('affiliate_ref')
      if (storedRef) {
        setAffiliateId(storedRef)
        console.log('🎯 Using stored affiliate ref:', storedRef)
      }
    }
  }, [])

  // Initialize socket connection for real-time updates
  useEffect(() => {
    console.log('🔌 Initializing user socket connection...')
    userSocketService.connect(user?.id?.toString())

    // Listen for real-time notifications
    const unsubscribeNotification = userSocketService.subscribe('notification', (data: any) => {
      console.log('📬 Notification received:', data)
      // You can add toast notification here
      if (data.message) {
        alert(`Notification: ${data.message}`)
      }
    })

    // Listen for cart sync
    const unsubscribeCartSync = userSocketService.subscribe('cart-sync', (data: any) => {
      console.log('🛒 Cart sync received:', data)
    })

    // Listen for order updates
    const unsubscribeOrderUpdate = userSocketService.subscribe('order-update', (data: any) => {
      console.log('📦 Order update received:', data)
      if (data.message) {
        alert(`Order Update: ${data.message}`)
      }
    })

    // Listen for product updates (when admin changes products)
    const unsubscribeProductUpdate = userSocketService.subscribe('products-updated', (data: any) => {
      console.log('🛍️ Product updated:', data)
      // Refresh product data if on product page
      window.dispatchEvent(new CustomEvent('product-updated', { detail: data }))
      // Also dispatch to refresh all pages
      window.dispatchEvent(new CustomEvent('refresh-products', { detail: data }))
    })

    // Also listen for the new event name
    const unsubscribeProductUpdateAlt = userSocketService.subscribe('product-updated', (data: any) => {
      console.log('🛍️ Product updated (alt):', data)
      window.dispatchEvent(new CustomEvent('product-updated', { detail: data }))
      window.dispatchEvent(new CustomEvent('refresh-products', { detail: data }))
    })

    // Listen for product creation
    const unsubscribeProductCreated = userSocketService.subscribe('products-created', (data: any) => {
      console.log('✨ New product created:', data)
      // Refresh product list
      window.dispatchEvent(new CustomEvent('product-created', { detail: data }))
    })

    // Listen for product deletion
    const unsubscribeProductDeleted = userSocketService.subscribe('products-deleted', (data: any) => {
      console.log('🗑️ Product deleted:', data)
      // Refresh product list
      window.dispatchEvent(new CustomEvent('product-deleted', { detail: data }))
    })

    // Listen for discount updates
    const unsubscribeDiscountUpdate = userSocketService.subscribe('discounts-updated', (data: any) => {
      console.log('💰 Discount updated:', data)
      window.dispatchEvent(new CustomEvent('discount-updated', { detail: data }))
    })

    // Cleanup on unmount
    return () => {
      unsubscribeNotification()
      unsubscribeCartSync()
      unsubscribeOrderUpdate()
      unsubscribeProductUpdate()
      unsubscribeProductUpdateAlt()
      unsubscribeProductCreated()
      unsubscribeProductDeleted()
      unsubscribeDiscountUpdate()
    }
  }, [user])

  // Update user ID when authentication changes
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      userSocketService.setUserId(user.id.toString())
    }
  }, [isAuthenticated, user])

  const handleSplashComplete = () => {
    setShowSplash(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Redirect to search page with query
      window.location.hash = `#/user/search?q=${encodeURIComponent(searchQuery)}`
      setSearchQuery('')
      setShowSearch(false)
    }
  }


  return (
    <div className={`min-h-screen bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 ${showSplash ? 'overflow-hidden h-screen' : ''}`}>
      {showSplash ? (
        <SplashScreen onComplete={handleSplashComplete} />
      ) : (
        <>
          <header className="bg-white shadow-sm">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
              <Logo className="font-display text-2xl font-bold text-gradient-primary hover:text-gradient-secondary transition-all duration-300" />
              
              <nav className="hidden items-center gap-8 md:flex text-slate-600 dark:text-slate-400">
                <a href="#/user/" className="font-body text-lg font-medium hover:text-gradient-primary transition-all duration-300 relative group">
                  Home
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-primary transition-all duration-300 group-hover:w-full"></span>
                </a>
                
                <div className="group relative">
                  <button className="font-body text-lg font-medium hover:text-gradient-primary transition-all duration-300 flex items-center relative">
                    Categories
                    <span className="ml-2 transform transition-transform duration-300 group-hover:rotate-180">▼</span>
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-primary transition-all duration-300 group-hover:w-full"></span>
                  </button>
                  <div className="absolute top-full left-0 mt-2 w-56 glass-card opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 transform translate-y-2 group-hover:translate-y-0">
                    <div className="py-3">
                      <a href="#/user/face" className="block px-6 py-3 text-sm font-medium hover:text-gradient-primary transition-all duration-300 hover:bg-gradient-primary/10">Face Care</a>
                      <a href="#/user/hair" className="block px-6 py-3 text-sm font-medium hover:text-gradient-primary transition-all duration-300 hover:bg-gradient-primary/10">Hair Care</a>
                      <a href="#/user/body" className="block px-6 py-3 text-sm font-medium hover:text-gradient-primary transition-all duration-300 hover:bg-gradient-primary/10">Body Care</a>
                      <a href="#/user/combos" className="block px-6 py-3 text-sm font-medium hover:text-gradient-primary transition-all duration-300 hover:bg-gradient-primary/10">Combo Packs</a>
                    </div>
                  </div>
                </div>
                
                <a href="#/user/shop" className="font-body text-lg font-medium hover:text-gradient-primary transition-all duration-300 relative group">
                  Shop All
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-primary transition-all duration-300 group-hover:w-full"></span>
                </a>
                <a href="#/user/ingredients" className="font-body text-lg font-medium hover:text-gradient-primary transition-all duration-300 relative group">
                  Ingredients
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-primary transition-all duration-300 group-hover:w-full"></span>
                </a>
                <a href="#/user/blog" className="font-body text-lg font-medium hover:text-gradient-primary transition-all duration-300 relative group">
                  Blog
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-primary transition-all duration-300 group-hover:w-full"></span>
                </a>
                <a href="#/user/contact" className="font-body text-lg font-medium hover:text-gradient-primary transition-all duration-300 relative group">
                  Contact
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-primary transition-all duration-300 group-hover:w-full"></span>
                </a>
              </nav>
              
              <div className="flex items-center gap-2 sm:gap-4">
                <button 
                  onClick={() => {
                    const event = new CustomEvent('open-search')
                    window.dispatchEvent(event)
                  }}
                  className="neu w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center hover:scale-110 transition-all duration-300" 
                  aria-label="Search"
                >
                  <span className="text-base sm:text-lg">🔍</span>
                </button>
                
                <button 
                  onClick={() => window.location.hash = '#/user/wishlist'}
                  className="neu w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center hover:scale-110 transition-all duration-300 relative" 
                  aria-label="Wishlist"
                >
                  <span className="text-base sm:text-lg">❤️</span>
                  {wishlistItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {wishlistItems.length}
                    </span>
                  )}
                </button>
                
                <CartIcon 
                  onClick={() => window.location.hash = '#/user/cart'}
                  className="neu w-10 h-10 sm:w-12 sm:h-12 hover:scale-110 transition-all duration-300"
                />
                
                <button 
                  onClick={() => window.location.hash = '#/user/profile'}
                  className="neu w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center hover:scale-110 transition-all duration-300" 
                  aria-label="Account"
                >
                  {isAuthenticated && user ? (
                    <ProfileAvatar 
                      profilePhoto={user.profile_photo}
                      name={user.name}
                      size="sm"
                      className="w-6 h-6 sm:w-8 sm:h-8"
                    />
                  ) : (
                    <span className="text-base sm:text-lg">👤</span>
                  )}
                </button>
                
                <button 
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="neu w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center hover:scale-110 transition-all duration-300 md:hidden" 
                  aria-label="Menu"
                >
                  {showMobileMenu ? (
                    <X className="h-5 w-5 sm:h-6 sm:w-6 text-slate-700" aria-hidden="true" />
                  ) : (
                    <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-slate-700" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          </header>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setShowMobileMenu(false)}>
              <div className="fixed top-16 left-0 right-0 bottom-0 bg-white dark:bg-slate-900 shadow-xl overflow-y-auto">
                <nav className="flex flex-col px-4 py-8">
                  <a 
                    href="#/user/" 
                    className="py-3 px-4 text-lg font-medium text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Home
                  </a>
                  <button className="py-3 px-4 text-left text-lg font-medium text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    Categories
                  </button>
                  <a 
                    href="#/user/face" 
                    className="py-2 px-8 text-base text-slate-600 dark:text-slate-400"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Face Care
                  </a>
                  <a 
                    href="#/user/hair" 
                    className="py-2 px-8 text-base text-slate-600 dark:text-slate-400"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Hair Care
                  </a>
                  <a 
                    href="#/user/body" 
                    className="py-2 px-8 text-base text-slate-600 dark:text-slate-400"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Body Care
                  </a>
                  <a 
                    href="#/user/combos" 
                    className="py-2 px-8 text-base text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Combo Packs
                  </a>
                  <a 
                    href="#/user/shop" 
                    className="py-3 px-4 text-lg font-medium text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Shop All
                  </a>
                  <a 
                    href="#/user/ingredients" 
                    className="py-3 px-4 text-lg font-medium text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Ingredients
                  </a>
                  <a 
                    href="#/user/blog" 
                    className="py-3 px-4 text-lg font-medium text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Blog
                  </a>
                  <a 
                    href="#/user/contact" 
                    className="py-3 px-4 text-lg font-medium text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Contact
                  </a>
                </nav>
              </div>
            </div>
          )}

        <SmoothScroll>
          <RouterView affiliateId={affiliateId} />
        </SmoothScroll>

      <footer className="border-t border-gray-800 bg-gray-900 py-8 sm:py-12 md:py-16 text-sm text-gray-400">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:gap-8 px-4 sm:grid-cols-2 md:grid-cols-6">
          <div className="md:col-span-2">
            <h3 className="mb-3 sm:mb-4 text-lg sm:text-xl font-light tracking-wide text-white">Nefol</h3>
            <p className="text-xs sm:text-sm text-gray-400 font-light leading-relaxed">Natural and safe skincare for every skin type. Made with love and care.</p>
            <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-400 font-light">Call us: +91-8887-847213</p>
          </div>
          <div>
            <h4 className="mb-3 sm:mb-4 text-xs sm:text-sm font-medium tracking-wide uppercase text-white">Categories</h4>
            <ul className="space-y-2">
              <li><a href="#/user/" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors font-light">Home</a></li>
              <li><a href="#/user/body" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors font-light">Body</a></li>
              <li><a href="#/user/face" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors font-light">Face</a></li>
              <li><a href="#/user/hair" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors font-light">Hair</a></li>
              <li><a href="#/user/combos" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors font-light">Combos</a></li>
              <li><a href="#/user/blog" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors font-light">Blogs</a></li>
              <li><a href="#/user/offers" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors font-light">Offers</a></li>
              <li><a href="#/user/new-arrivals" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors font-light">New Arrivals</a></li>
              <li><a href="#/user/best-sellers" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors font-light">Best Sellers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-medium tracking-wide uppercase text-white">Further Info.</h4>
            <ul className="space-y-2">
              <li><a href="#/user/shop" className="text-gray-400 hover:text-white transition-colors font-light">Shop</a></li>
              <li><a href="#/user/cart" className="text-gray-400 hover:text-white transition-colors font-light">Cart</a></li>
              <li><a href="#/user/orders" className="text-gray-400 hover:text-white transition-colors font-light">Orders</a></li>
              <li><a href="#/user/account" className="text-gray-400 hover:text-white transition-colors font-light">Account</a></li>
              <li><a href="#/user/community" className="text-gray-400 hover:text-white transition-colors font-light">Community</a></li>
              <li><a href="#/user/shade-finder" className="text-gray-400 hover:text-white transition-colors font-light">Shade Finder</a></li>
              <li><a href="#/user/skin-quiz" className="text-gray-400 hover:text-white transition-colors font-light">Skin Quiz</a></li>
              <li><a href="#/user/gifting" className="text-gray-400 hover:text-white transition-colors font-light">Gifting Studio</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-medium tracking-wide uppercase text-white">Company Info</h4>
            <ul className="space-y-2">
              <li><a href="#/user/about" className="text-gray-400 hover:text-white transition-colors font-light">About Us</a></li>
              <li><a href="#/user/faq" className="text-gray-400 hover:text-white transition-colors font-light">FAQ</a></li>
              <li><a href="#/user/chairperson-message" className="text-gray-400 hover:text-white transition-colors font-light">Chairperson Message</a></li>
              <li><a href="#/user/usp" className="text-gray-400 hover:text-white transition-colors font-light">Why Choose Nefol</a></li>
              <li><a href="#/user/blue-tea-benefits" className="text-gray-400 hover:text-white transition-colors font-light">Blue Tea Benefits</a></li>
              <li><a href="#/user/sustainability" className="text-gray-400 hover:text-white transition-colors font-light">Sustainability</a></li>
              <li><a href="#/user/press" className="text-gray-400 hover:text-white transition-colors font-light">Press & Media</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-medium tracking-wide uppercase text-white">Customer Service</h4>
            <ul className="space-y-2">
              <li><a href="#/user/privacy-policy" className="text-gray-400 hover:text-white transition-colors font-light">Privacy Policy</a></li>
              <li><a href="#/user/refund-policy" className="text-gray-400 hover:text-white transition-colors font-light">Refund Policy</a></li>
              <li><a href="#/user/shipping-policy" className="text-gray-400 hover:text-white transition-colors font-light">Shipping Policy</a></li>
              <li><a href="#/user/terms-of-service" className="text-gray-400 hover:text-white transition-colors font-light">Terms of Service</a></li>
              <li><a href="#/user/track-order" className="text-gray-400 hover:text-white transition-colors font-light">Track Order</a></li>
              <li><a href="#/user/store-locator" className="text-gray-400 hover:text-white transition-colors font-light">Store Locator</a></li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <h4 className="mb-4 text-sm font-medium tracking-wide uppercase text-white">Newsletter</h4>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <input type="email" required placeholder="Your email" className="h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 text-gray-100 placeholder-gray-400 focus:border-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-600" />
              <button className="h-10 rounded-md bg-gray-800 px-4 font-medium text-white hover:bg-gray-700 transition-colors border border-gray-700">Submit</button>
            </form>
            <small className="mt-4 block text-gray-400 font-light">©2024-{new Date().getFullYear()} NEFOL™ • Website powered by URBANMOVE SERVICE PRIVATE LIMITED</small>
          </div>
        </div>
      </footer>

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-20">
          <div className="w-full max-w-2xl rounded-xl bg-white dark:bg-slate-800 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold dark:text-slate-100">Search Products</h2>
              <button
                onClick={() => setShowSearch(false)}
                className="text-2xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSearch} className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products, ingredients, or categories..."
                  className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-slate-700 dark:text-slate-100"
                  autoFocus
                />
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  Search
                </button>
              </div>
            </form>
            <div className="text-center text-slate-500 dark:text-slate-400">
              <p>Search functionality will be implemented with backend integration</p>
            </div>
          </div>
        </div>
      )}

          <LiveChatWidget />
          <NewsletterPopup />
          <SearchButton />
        </>
      )}
    </div>
  )
}

// Lightweight hash-based router to avoid external deps
import Home from './pages/Home'
import Shop from './pages/Shop'
import Skincare from './pages/Skincare'
import Ingredients from './pages/Ingredients'
import Blog from './pages/Blog'
import Contact from './pages/Contact'
import ProductPage from './pages/Product'
import CategoryPage from './pages/Category'
import Affiliate from './pages/Affiliate'
import AffiliatePartner from './pages/AffiliatePartner'
import ReferralHistory from './pages/ReferralHistory'
import Reports from './pages/Reports'
import Checkout from './pages/Checkout'
import Confirmation from './pages/Confirmation'
import OffersPage from './pages/Offers'
import NewArrivalsPage from './pages/NewArrivals'
import BestSellersPage from './pages/BestSellers'
import GiftingPage from './pages/Gifting'
import StoreLocatorPage from './pages/StoreLocator'
import ShadeFinderPage from './pages/ShadeFinder'
import SkinQuizPage from './pages/SkinQuiz'
import TrackOrderPage from './pages/TrackOrder'
import SustainabilityPage from './pages/Sustainability'
import PressMediaPage from './pages/PressMedia'

interface RouterViewProps {
  affiliateId?: string | null
}

function RouterView({ affiliateId }: RouterViewProps) {
  const [hash, setHash] = useState(window.location.hash || '#/user/')
  
  React.useEffect(() => {
    const onHashChange = () => setHash(window.location.hash || '#/user/')
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  
  // Track page views whenever the route changes
  React.useEffect(() => {
    const path = hash.replace('#', '') || '/user/'
    console.log('📊 Tracking page view:', path)
    userSocketService.trackPageView(path)
  }, [hash])
  
  const path = hash.replace('#', '')
  const lower = path.toLowerCase()
  
  // Extract path without query parameters
  const pathWithoutQuery = lower.split('?')[0]
  
  if (lower.startsWith('/user/product/')) return <ProductPage />
  if (lower.startsWith('/user/category/')) return <CategoryPage />
  if (lower.startsWith('/user/confirmation')) return <Confirmation />
  if (lower.startsWith('/user/order/')) return <OrderDetails />
  
  switch (pathWithoutQuery) {
    case '/user/product':
    case '/user/':
    case '/user':
      return <Home />
    case '/user/shop': return <Shop />
    case '/user/skincare': return <Skincare />
    case '/user/ingredients': return <Ingredients />
    case '/user/blog': return <Blog />
    case '/user/contact': return <Contact />
    case '/user/checkout': return <Checkout affiliateId={affiliateId} />
    case '/user/affiliate': return <Affiliate />
    case '/user/affiliate-partner': return <AffiliatePartner />
    case '/user/referral-history': return <ReferralHistory />
    case '/user/reports': return <Reports />
    case '/user/profile': return <Profile />
    case '/user/nefol-coins': return <NefolCoins />
    case '/user/coin-withdrawal': return <CoinWithdrawal />
    case '/user/user-orders': return <UserOrders />
    case '/user/saved-cards': return <SavedCards />
    case '/user/manage-address': return <ManageAddress />
    case '/user/wishlist': return <Wishlist />
    case '/user/login': return <LoginPage />
    case '/user/about': return <AboutUs />
    case '/user/faq': return <FAQ />
    case '/user/blue-tea-benefits': return <BlueTeaBenefits />
    case '/user/chairperson-message': return <ChairpersonMessage />
    case '/user/usp': return <USP />
    case '/user/privacy-policy': return <PrivacyPolicy />
    case '/user/refund-policy': return <RefundPolicy />
    case '/user/shipping-policy': return <ShippingPolicy />
    case '/user/terms-of-service': return <TermsOfService />
    case '/user/face': return <Face />
    case '/user/body': return <Body />
    case '/user/hair': return <Hair />
    case '/user/orders': return <Orders />
    case '/user/account': return <Account />
    case '/user/community': return <Community />
    case '/user/notifications': return <Notifications />
    case '/user/privacy-security': return <PrivacySecurity />
    case '/user/payment-methods': return <PaymentMethods />
    case '/user/loyalty-rewards': return <LoyaltyRewards />
    case '/user/combos': return <Combos />
    case '/user/gifting': return <GiftingPage />
    case '/user/cart': return <Cart />
    case '/user/search': return <SearchPage />
    case '/user/offers': return <OffersPage />
    case '/user/new-arrivals': return <NewArrivalsPage />
    case '/user/best-sellers': return <BestSellersPage />
    case '/user/store-locator': return <StoreLocatorPage />
    case '/user/shade-finder': return <ShadeFinderPage />
    case '/user/skin-quiz': return <SkinQuizPage />
    case '/user/track-order': return <TrackOrderPage />
    case '/user/sustainability': return <SustainabilityPage />
    case '/user/press': return <PressMediaPage />
    default:
      return <Home />
  }
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <AppContent />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

