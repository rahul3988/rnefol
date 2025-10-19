import React, { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Search, X, ArrowRight, Settings, Users, ShoppingCart, Package, BarChart3, Mail, FileText, CreditCard, Truck, Tag, Camera, MessageSquare, Zap, Target, TrendingUp, Shield, Globe, Smartphone, Monitor, Headphones, Gift, Star, Heart, Eye, Filter, Bell } from 'lucide-react'

export default function AdminLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])

  // Define all admin options with their details
  const adminOptions = [
    // Main Navigation
    { path: '/', label: 'Dashboard', icon: BarChart3, category: 'Main', description: 'Overview and analytics' },
    { path: '/products', label: 'Products', icon: Package, category: 'Catalog', description: 'Manage product catalog' },
    { path: '/orders', label: 'Orders', icon: ShoppingCart, category: 'Sales', description: 'Order management' },
    { path: '/customers', label: 'Customers', icon: Users, category: 'CRM', description: 'Customer management' },
    { path: '/categories', label: 'Categories', icon: Tag, category: 'Catalog', description: 'Product categories' },
    { path: '/cms', label: 'CMS', icon: FileText, category: 'Content', description: 'Content management system' },
    { path: '/blog-requests', label: 'Blog Requests', icon: MessageSquare, category: 'Content', description: 'Blog submission management' },
    { path: '/settings', label: 'Settings', icon: Settings, category: 'System', description: 'System configuration' },
    
    // Sales & Orders
    { path: '/invoices', label: 'Invoices', icon: FileText, category: 'Finance', description: 'Invoice management' },
    { path: '/shipments', label: 'Shipments', icon: Truck, category: 'Logistics', description: 'Shipping management' },
    { path: '/returns', label: 'Returns', icon: ArrowRight, category: 'Customer Service', description: 'Return processing' },
    { path: '/payment', label: 'Payment', icon: CreditCard, category: 'Finance', description: 'Payment management' },
    
    // Marketing
    { path: '/marketing', label: 'Marketing', icon: Target, category: 'Marketing', description: 'Marketing campaigns' },
    { path: '/discounts', label: 'Discounts', icon: Tag, category: 'Marketing', description: 'Discount management' },
    { path: '/email-marketing', label: 'Email Marketing', icon: Mail, category: 'Marketing', description: 'Email campaigns' },
    { path: '/sms-marketing', label: 'SMS Marketing', icon: Smartphone, category: 'Marketing', description: 'SMS campaigns' },
    { path: '/push-notifications', label: 'Push Notifications', icon: Bell, category: 'Marketing', description: 'Push notifications' },
    
    // Social Media
    { path: '/facebook', label: 'Facebook & Instagram', icon: Globe, category: 'Social Media', description: 'Social media management' },
    { path: '/google', label: 'Google & YouTube', icon: Monitor, category: 'Social Media', description: 'Google services' },
    
    // Customer Engagement
    { path: '/loyalty-program', label: 'Loyalty Program', icon: Star, category: 'Customer Engagement', description: 'Customer loyalty' },
    { path: '/affiliate-program', label: 'Affiliate Program', icon: Users, category: 'Customer Engagement', description: 'Affiliate marketing' },
    { path: '/cashback', label: 'Cashback System', icon: Gift, category: 'Customer Engagement', description: 'Cashback rewards' },
    { path: '/whatsapp-chat', label: 'WhatsApp Chat', icon: MessageSquare, category: 'Customer Engagement', description: 'WhatsApp integration' },
    { path: '/live-chat', label: 'Live Chat', icon: Headphones, category: 'Customer Engagement', description: 'Live chat support' },
    
    // Analytics & AI
    { path: '/analytics', label: 'Analytics', icon: TrendingUp, category: 'Analytics', description: 'Business analytics' },
    { path: '/advanced-analytics', label: 'Advanced Analytics', icon: BarChart3, category: 'Analytics', description: 'Advanced reporting' },
    { path: '/actionable-analytics', label: 'Actionable Analytics', icon: Target, category: 'Analytics', description: 'Actionable insights' },
    { path: '/ai-box', label: 'AI Box', icon: Zap, category: 'AI Features', description: 'AI-powered features' },
    { path: '/ai-personalization', label: 'AI Personalization', icon: Heart, category: 'AI Features', description: 'AI personalization' },
    
    // Automation & Workflow
    { path: '/form-builder', label: 'Form Builder', icon: FileText, category: 'Automation', description: 'Custom forms' },
    { path: '/workflow-automation', label: 'Workflow Automation', icon: Zap, category: 'Automation', description: 'Automated workflows' },
    { path: '/customer-segmentation', label: 'Customer Segmentation', icon: Users, category: 'CRM', description: 'Customer segments' },
    { path: '/journey-tracking', label: 'Journey Tracking', icon: Eye, category: 'CRM', description: 'Customer journey' },
    { path: '/journey-funnel', label: 'Journey Funnel', icon: Filter, category: 'CRM', description: 'Conversion funnels' },
    
    // Advanced Features
    { path: '/custom-audience', label: 'Custom Audience', icon: Target, category: 'Marketing', description: 'Custom audiences' },
    { path: '/omni-channel', label: 'Omni Channel', icon: Globe, category: 'Marketing', description: 'Multi-channel marketing' },
    { path: '/api-manager', label: 'API Manager', icon: Shield, category: 'System', description: 'API management' },
    { path: '/payment-options', label: 'Payment Options', icon: CreditCard, category: 'Finance', description: 'Payment methods' },
    { path: '/video-manager', label: 'Video Manager', icon: Camera, category: 'Content', description: 'Video management' },
    { path: '/forms', label: 'Forms', icon: FileText, category: 'Content', description: 'Form management' },
    
    // Finance & Tax
    { path: '/tax', label: 'Tax Management', icon: CreditCard, category: 'Finance', description: 'Tax configuration' },
  ]

  // Search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    
    if (query.length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    const filtered = adminOptions.filter(option => 
      option.label.toLowerCase().includes(query.toLowerCase()) ||
      option.description.toLowerCase().includes(query.toLowerCase()) ||
      option.category.toLowerCase().includes(query.toLowerCase())
    )

    setSearchResults(filtered)
    setShowSearchResults(true)
  }

  const handleSearchSelect = (option: any) => {
    navigate(option.path)
    setSearchQuery('')
    setShowSearchResults(false)
  }

  const handleSearchClear = () => {
    setSearchQuery('')
    setSearchResults([])
    setShowSearchResults(false)
  }

  // Close search results when clicking outside and handle keyboard shortcuts
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.search-container')) {
        setShowSearchResults(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()
        const searchInput = document.querySelector('.search-input') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      }
      
      // Escape to close search results
      if (event.key === 'Escape') {
        setShowSearchResults(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded px-3 py-2 text-sm hover:bg-white/10 ${isActive ? 'bg-white/10' : ''}`

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="grid grid-cols-12">
        <aside className="col-span-12 border-b border-white/10 bg-slate-900/60 p-4 md:col-span-2 md:border-b-0 md:border-r md:p-6">
          <div className="mb-6">
            <h1 className="text-lg font-semibold">Nefol Admin</h1>
            <p className="text-xs text-white/60">Control Panel</p>
          </div>
          <nav className="space-y-1">
            <NavLink to="/" end className={linkClass}>
              <span className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </span>
            </NavLink>
            <NavLink to="/products" className={linkClass}>
              <span className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Products
              </span>
            </NavLink>
            <NavLink to="/orders" className={linkClass}>
              <span className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Orders
              </span>
            </NavLink>
            <NavLink to="/customers" className={linkClass}>
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Customers
              </span>
            </NavLink>
            <NavLink to="/categories" className={linkClass}>
              <span className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Categories
              </span>
            </NavLink>
            <NavLink to="/cms" className={linkClass}>
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 font-medium">CMS</span>
              </span>
            </NavLink>
            <NavLink to="/blog-requests" className={linkClass}>
              <span className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-medium">Blog Requests</span>
              </span>
            </NavLink>
            <NavLink to="/settings" className={linkClass}>
              <span className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </span>
            </NavLink>
          </nav>
        </aside>
        <section className="col-span-12 md:col-span-10">
          <header className="border-b border-white/10 px-4 py-3 md:px-8">
            {/* Global Search Bar */}
            <div className="search-container relative mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search admin options... (e.g., products, orders, analytics)"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="search-input w-full pl-10 pr-20 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={handleSearchClear}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                {!searchQuery && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">
                    <kbd className="px-2 py-1 bg-slate-700 rounded text-xs">Ctrl+K</kbd>
                  </div>
                )}
              </div>
              
              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                  {searchResults.map((option, index) => {
                    const IconComponent = option.icon
                    return (
                      <button
                        key={index}
                        onClick={() => handleSearchSelect(option)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 text-left border-b border-slate-700 last:border-b-0"
                      >
                        <IconComponent className="w-5 h-5 text-blue-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium">{option.label}</div>
                          <div className="text-sm text-gray-400 truncate">{option.description}</div>
                          <div className="text-xs text-blue-400">{option.category}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </button>
                    )
                  })}
                </div>
              )}
              
              {/* No Results */}
              {showSearchResults && searchResults.length === 0 && searchQuery.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 p-4">
                  <div className="text-gray-400 text-center">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No options found for "{searchQuery}"</p>
                    <p className="text-sm mt-1">Try searching for:</p>
                    <div className="flex flex-wrap gap-2 mt-2 justify-center">
                      {['products', 'orders', 'analytics', 'marketing', 'customers', 'cms', 'blog'].map((term) => (
                        <button
                          key={term}
                          onClick={() => handleSearch(term)}
                          className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-white/70">Welcome to Nefol Admin</div>
              <div className="space-x-2 text-sm">
                <button onClick={logout} className="rounded bg-white/10 px-3 py-1 hover:bg-white/15">Logout</button>
              </div>
            </div>
          </header>
          <main className="p-4 md:p-8">
            <Outlet />
          </main>
        </section>
      </div>
    </div>
  )
}


