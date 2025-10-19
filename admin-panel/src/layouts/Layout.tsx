import React, { useState, useEffect } from 'react'
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom'
import { Search, X, ArrowRight } from 'lucide-react'

const Layout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])

  // Define all admin options with their details for search
  const allOptions = [
    // Main Navigation
    { name: 'Dashboard', href: '/', icon: '🏠', category: 'Main', description: 'Overview and analytics', current: location.pathname === '/' },
    { name: 'Orders', href: '/orders', icon: '📦', category: 'Sales', description: 'Order management', badge: '4', current: location.pathname === '/orders' },
    { name: 'Invoices', href: '/invoices', icon: '🧾', category: 'Finance', description: 'Invoice management', current: location.pathname === '/invoices' },
    { name: 'Shipments', href: '/shipments', icon: '🚚', category: 'Logistics', description: 'Shipping management', current: location.pathname === '/shipments' },
    { name: 'Products', href: '/products', icon: '🛍️', category: 'Catalog', description: 'Product management', current: location.pathname === '/products' },
    { name: 'Customers', href: '/customers', icon: '👥', category: 'CRM', description: 'Customer management', current: location.pathname === '/customers' },
    { name: 'Users', href: '/users', icon: '👤', category: 'System', description: 'User management', current: location.pathname === '/users' },
    { name: 'CMS', href: '/cms', icon: '📝', category: 'Content', description: 'Content management system', current: location.pathname === '/cms' },
    { name: 'Blog Requests', href: '/blog-requests', icon: '💬', category: 'Content', description: 'Blog submission management', current: location.pathname === '/blog-requests' },
    { name: 'Loyalty Program', href: '/loyalty-program', icon: '⭐', category: 'Customer Engagement', description: 'Customer loyalty program', current: location.pathname === '/loyalty-program' },
    { name: 'Affiliate Program', href: '/affiliate-program', icon: '🤝', category: 'Customer Engagement', description: 'Affiliate marketing', current: location.pathname === '/affiliate-program' },
    { name: 'Affiliate Requests', href: '/affiliate-requests', icon: '📋', category: 'Customer Engagement', description: 'Manage affiliate applications', badge: '3', current: location.pathname === '/affiliate-requests' },
    { name: 'Cashback System', href: '/cashback', icon: '💰', category: 'Customer Engagement', description: 'Cashback rewards', current: location.pathname === '/cashback' },
    { name: 'Email Marketing', href: '/email-marketing', icon: '📧', category: 'Marketing', description: 'Email campaigns', current: location.pathname === '/email-marketing' },
    { name: 'SMS Marketing', href: '/sms-marketing', icon: '📱', category: 'Marketing', description: 'SMS campaigns', current: location.pathname === '/sms-marketing' },
    { name: 'Push Notifications', href: '/push-notifications', icon: '🔔', category: 'Marketing', description: 'Push notifications', current: location.pathname === '/push-notifications' },
    { name: 'WhatsApp Chat', href: '/whatsapp-chat', icon: '💬', category: 'Customer Engagement', description: 'WhatsApp integration', current: location.pathname === '/whatsapp-chat' },
    { name: 'Live Chat', href: '/live-chat', icon: '💬', category: 'Customer Engagement', description: 'Live chat support', current: location.pathname === '/live-chat' },
    { name: 'Analytics', href: '/analytics', icon: '📊', category: 'Analytics', description: 'Business analytics', current: location.pathname === '/analytics' },
    { name: 'Form Builder', href: '/form-builder', icon: '📝', category: 'Automation', description: 'Custom forms', current: location.pathname === '/form-builder' },
    { name: 'Workflow Automation', href: '/workflow-automation', icon: '⚙️', category: 'Automation', description: 'Automated workflows', current: location.pathname === '/workflow-automation' },
    { name: 'Customer Segmentation', href: '/customer-segmentation', icon: '🎯', category: 'CRM', description: 'Customer segments', current: location.pathname === '/customer-segmentation' },
    { name: 'Journey Tracking', href: '/journey-tracking', icon: '🗺️', category: 'CRM', description: 'Customer journey', current: location.pathname === '/journey-tracking' },
    { name: 'Actionable Analytics', href: '/actionable-analytics', icon: '📈', category: 'Analytics', description: 'Actionable insights', current: location.pathname === '/actionable-analytics' },
    { name: 'AI Box', href: '/ai-box', icon: '🤖', category: 'AI Features', description: 'AI-powered features', current: location.pathname === '/ai-box' },
    { name: 'Journey Funnel', href: '/journey-funnel', icon: '🔄', category: 'CRM', description: 'Conversion funnels', current: location.pathname === '/journey-funnel' },
    { name: 'AI Personalization', href: '/ai-personalization', icon: '🎨', category: 'AI Features', description: 'AI personalization', current: location.pathname === '/ai-personalization' },
    { name: 'Custom Audience', href: '/custom-audience', icon: '👥', category: 'Marketing', description: 'Custom audiences', current: location.pathname === '/custom-audience' },
    { name: 'Omni Channel', href: '/omni-channel', icon: '🌐', category: 'Marketing', description: 'Multi-channel marketing', current: location.pathname === '/omni-channel' },
    { name: 'API Manager', href: '/api-manager', icon: '🔧', category: 'System', description: 'API management', current: location.pathname === '/api-manager' },
    { name: 'Payment Options', href: '/payment-options', icon: '💳', category: 'Finance', description: 'Payment methods', current: location.pathname === '/payment-options' },
    { name: 'Video Manager', href: '/video-manager', icon: '🎬', category: 'Content', description: 'Video management', current: location.pathname === '/video-manager' },
    { name: 'Invoice', href: '/invoice', icon: '🧾', category: 'Finance', description: 'Invoice processing', current: location.pathname === '/invoice' },
    { name: 'Tax', href: '/tax', icon: '💰', category: 'Finance', description: 'Tax configuration', current: location.pathname === '/tax' },
    { name: 'Returns', href: '/returns', icon: '↩️', category: 'Customer Service', description: 'Return processing', current: location.pathname === '/returns' },
    { name: 'Payment', href: '/payment', icon: '💳', category: 'Finance', description: 'Payment processing', current: location.pathname === '/payment' },
    { name: 'Categories', href: '/categories', icon: '📂', category: 'Catalog', description: 'Product categories', current: location.pathname === '/categories' },
    { name: 'Marketing', href: '/marketing', icon: '📢', category: 'Marketing', description: 'Marketing campaigns', current: location.pathname === '/marketing' },
    { name: 'Discounts', href: '/discounts', icon: '🏷️', category: 'Marketing', description: 'Discount management', current: location.pathname === '/discounts' },
  ]

  const navigation = allOptions

  const salesChannels = [
    { name: 'Facebook & Instagram', href: '/facebook', icon: '📘' },
    { name: 'Online Store', href: '/store', icon: '🏪' },
  ]

  const apps = [
    { name: 'Google & YouTube', href: '/google', icon: '🔍' },
    { name: 'Forms', href: '/forms', icon: '📝' },
  ]

  // Search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    
    if (query.length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    const filtered = allOptions.filter(option => 
      option.name.toLowerCase().includes(query.toLowerCase()) ||
      option.description.toLowerCase().includes(query.toLowerCase()) ||
      option.category.toLowerCase().includes(query.toLowerCase())
    )

    setSearchResults(filtered)
    setShowSearchResults(true)
  }

  const handleSearchSelect = (option: any) => {
    navigate(option.href)
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

  return (
    <div className="flex h-screen bg-brand-light">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`w-72 bg-brand-primary text-brand-accent h-screen fixed left-0 top-0 z-50 overflow-y-auto ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-brand-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <span className="text-xl font-bold text-white">Nefol Admin</span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-white/70 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {/* Main Navigation */}
            <div className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`nav-item ${item.current ? 'active' : ''}`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                  {item.badge && (
                    <span className="badge ml-auto">{item.badge}</span>
                  )}
                </Link>
              ))}
            </div>

            {/* Sales Channels */}
            <div className="pt-6">
              <h3 className="px-4 text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">
                Sales channels
              </h3>
              <div className="space-y-1">
                {salesChannels.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="nav-item"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Apps */}
            <div className="pt-6">
              <h3 className="px-4 text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">
                Apps
              </h3>
              <div className="space-y-1">
                {apps.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="nav-item"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          {/* Settings */}
          <div className="p-4 border-t border-white/10">
            <Link to="/settings" className="nav-item">
              <span className="text-lg">⚙️</span>
              <span className="font-medium">Settings</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden ml-72 lg:ml-72 md:ml-0">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              {/* Search Bar */}
              <div className="search-container relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search admin options... (e.g., CMS, Blog, Products)"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="search-input w-96 pl-10 pr-20 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                  />
                  {searchQuery && (
                    <button
                      onClick={handleSearchClear}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                  {!searchQuery && (
                    <div className="absolute right-3 top-2.5 text-xs text-gray-400">
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+K</kbd>
                    </div>
                  )}
                </div>
                
                {/* Search Results Dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                    {searchResults.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearchSelect(option)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left border-b border-gray-100 last:border-b-0"
                      >
                        <span className="text-lg">{option.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-gray-900 font-medium">{option.name}</div>
                          <div className="text-sm text-gray-500 truncate">{option.description}</div>
                          <div className="text-xs text-blue-600">{option.category}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
                
                {/* No Results */}
                {showSearchResults && searchResults.length === 0 && searchQuery.length >= 2 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4">
                    <div className="text-gray-500 text-center">
                      <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No options found for "{searchQuery}"</p>
                      <p className="text-sm mt-1">Try searching for:</p>
                      <div className="flex flex-wrap gap-2 mt-2 justify-center">
                        {['products', 'orders', 'analytics', 'marketing', 'customers', 'cms', 'blog'].map((term) => (
                          <button
                            key={term}
                            onClick={() => handleSearch(term)}
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">2 live visitors</span>
              </div>
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.5 19.5L9 15l4.5 4.5" />
                </svg>
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.5 19.5L9 15l4.5 4.5" />
                </svg>
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-brand-secondary rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">N</span>
                </div>
                <span className="text-sm font-medium text-gray-900">Nefol Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-brand-light">
          <div className="page-container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
