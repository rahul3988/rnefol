import React, { useState, useEffect } from 'react'
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom'
import { Search, X, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'
import NotificationBell from '../components/NotificationBell'

type LayoutView = 'categorized' | 'all-expanded' | 'compact'

interface NavigationSection {
  title: string
  icon: string
  items: NavigationItem[]
  defaultOpen?: boolean
}

interface NavigationItem {
  name: string
  href: string
  icon: string
  description?: string
  badge?: string
  current?: boolean
}

const Layout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [layoutView, setLayoutView] = useState<LayoutView>('categorized')
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})

  // Define all admin options grouped by category
  const navigationSections: NavigationSection[] = [
    {
      title: 'Overview',
      icon: '📊',
      defaultOpen: true,
      items: [
        { name: 'Dashboard', href: '/admin/', icon: '🏠', current: location.pathname === '/admin/' },
      ]
    },
    {
      title: 'Sales & Orders',
      icon: '📦',
      defaultOpen: true,
      items: [
        { name: 'Orders', href: '/admin/orders', icon: '📦', badge: '4', current: location.pathname === '/admin/orders' },
        { name: 'Shipments', href: '/admin/shipments', icon: '🚚', current: location.pathname === '/admin/shipments' },
        { name: 'Returns', href: '/admin/returns', icon: '↩️', current: location.pathname === '/admin/returns' },
      ]
    },
    {
      title: 'Catalog Management',
      icon: '🛍️',
      items: [
        { name: 'Products', href: '/admin/products', icon: '🛍️', current: location.pathname === '/admin/products' },
        { name: 'Product Variants', href: '/admin/product-variants', icon: '🎨', badge: 'NEW', current: location.pathname === '/admin/product-variants' },
        { name: 'Categories', href: '/admin/categories', icon: '📂', current: location.pathname === '/admin/categories' },
        { name: 'Inventory', href: '/admin/inventory', icon: '📊', badge: 'NEW', current: location.pathname === '/admin/inventory' },
      ]
    },
    {
      title: 'Customers & CRM',
      icon: '👥',
      items: [
        { name: 'Customers', href: '/admin/customers', icon: '👥', current: location.pathname === '/admin/customers' },
        { name: 'Customer Segmentation', href: '/admin/customer-segmentation', icon: '🎯', current: location.pathname === '/admin/customer-segmentation' },
        { name: 'Journey Tracking', href: '/admin/journey-tracking', icon: '🗺️', current: location.pathname === '/admin/journey-tracking' },
        { name: 'Journey Funnel', href: '/admin/journey-funnel', icon: '🔄', current: location.pathname === '/admin/journey-funnel' },
      ]
    },
    {
      title: 'Customer Engagement',
      icon: '💬',
      items: [
        { name: 'Live Chat', href: '/admin/live-chat', icon: '🎧', current: location.pathname === '/admin/live-chat' },
        { name: 'WhatsApp Chat', href: '/admin/whatsapp-chat', icon: '💬', current: location.pathname === '/admin/whatsapp-chat' },
        { name: 'Contact Messages', href: '/admin/contact-messages', icon: '📧', current: location.pathname === '/admin/contact-messages' },
        { name: 'Loyalty Program', href: '/admin/loyalty-program', icon: '⭐', current: location.pathname === '/admin/loyalty-program' },
        { name: 'Affiliate Program', href: '/admin/affiliate-program', icon: '🤝', current: location.pathname === '/admin/affiliate-program' },
        { name: 'Affiliate Requests', href: '/admin/affiliate-requests', icon: '📋', badge: '3', current: location.pathname === '/admin/affiliate-requests' },
        { name: 'Cashback System', href: '/admin/cashback', icon: '💰', current: location.pathname === '/admin/cashback' },
      ]
    },
    {
      title: 'Marketing',
      icon: '📢',
      items: [
        { name: 'Marketing', href: '/admin/marketing', icon: '📢', current: location.pathname === '/admin/marketing' },
        { name: 'Discounts', href: '/admin/discounts', icon: '🏷️', current: location.pathname === '/admin/discounts' },
        { name: 'Custom Audience', href: '/admin/custom-audience', icon: '👥', current: location.pathname === '/admin/custom-audience' },
        { name: 'Omni Channel', href: '/admin/omni-channel', icon: '🌐', current: location.pathname === '/admin/omni-channel' },
      ]
    },
    {
      title: 'AI Features',
      icon: '🤖',
      items: [
        { name: 'AI Box', href: '/admin/ai-box', icon: '🤖', current: location.pathname === '/admin/ai-box' },
        { name: 'AI Personalization', href: '/admin/ai-personalization', icon: '🎨', current: location.pathname === '/admin/ai-personalization' },
      ]
    },
    {
      title: 'Analytics',
      icon: '📈',
      items: [
        { name: 'Analytics', href: '/admin/analytics', icon: '📊', current: location.pathname === '/admin/analytics' },
        { name: 'Actionable Analytics', href: '/admin/actionable-analytics', icon: '📈', current: location.pathname === '/admin/actionable-analytics' },
      ]
    },
    {
      title: 'Finance',
      icon: '💰',
      items: [
        { name: 'Invoices', href: '/admin/invoices', icon: '🧾', current: location.pathname === '/admin/invoices' },
        { name: 'Tax', href: '/admin/tax', icon: '💰', current: location.pathname === '/admin/tax' },
        { name: 'Payment Options', href: '/admin/payment-options', icon: '💳', current: location.pathname === '/admin/payment-options' },
        { name: 'Coin Withdrawals', href: '/admin/coin-withdrawals', icon: '💸', current: location.pathname === '/admin/coin-withdrawals' },
      ]
    },
    {
      title: 'Content',
      icon: '📄',
      items: [
        { name: 'CMS', href: '/admin/cms', icon: '📄', current: location.pathname === '/admin/cms' },
        { name: 'Video Manager', href: '/admin/video-manager', icon: '🎬', current: location.pathname === '/admin/video-manager' },
        { name: 'Blog Requests', href: '/admin/blog-requests', icon: '📝', current: location.pathname === '/admin/blog-requests' },
      ]
    },
    {
      title: 'Notifications',
      icon: '🔔',
      items: [
        { name: 'WhatsApp Management', href: '/admin/whatsapp-management', icon: '💬', current: location.pathname === '/admin/whatsapp-management' },
        { name: 'WhatsApp Notifications', href: '/admin/whatsapp-notifications', icon: '📱', current: location.pathname === '/admin/whatsapp-notifications' },
      ]
    },
    {
      title: 'Automation',
      icon: '⚙️',
      items: [
        { name: 'Workflow Automation', href: '/admin/workflow-automation', icon: '⚙️', current: location.pathname === '/admin/workflow-automation' },
        { name: 'Form Builder', href: '/admin/form-builder', icon: '📋', current: location.pathname === '/admin/form-builder' },
      ]
    },
    {
      title: 'System',
      icon: '🔧',
      items: [
        { name: 'Users', href: '/admin/users', icon: '👤', current: location.pathname === '/admin/users' },
        { name: 'API Manager', href: '/admin/api-manager', icon: '🔧', current: location.pathname === '/admin/api-manager' },
      ]
    },
    {
      title: 'Sales Channels',
      icon: '🏪',
      items: [
        { name: 'Facebook & Instagram', href: '/admin/facebook', icon: '📘', current: location.pathname === '/admin/facebook' },
        { name: 'FB Shop Integration', href: '/admin/fb-shop', icon: '🛒', badge: 'NEW', current: location.pathname === '/admin/fb-shop' },
        { name: 'Online Store', href: '/admin/store', icon: '🏪', current: location.pathname === '/admin/store' },
        { name: 'Google & YouTube', href: '/admin/google', icon: '🔍', current: location.pathname === '/admin/google' },
        { name: 'Marketplaces', href: '/admin/marketplaces', icon: '🌐', badge: 'NEW', current: location.pathname === '/admin/marketplaces' },
      ]
    },
    {
      title: 'Operations',
      icon: '🏭',
      items: [
        { name: 'Warehouses', href: '/admin/warehouses', icon: '🏭', badge: 'NEW', current: location.pathname === '/admin/warehouses' },
        { name: 'POS System', href: '/admin/pos', icon: '💻', badge: 'NEW', current: location.pathname === '/admin/pos' },
      ]
    },
  ]

  // Flatten all options for search
  const allOptions = navigationSections.flatMap(section => 
    section.items.map(item => ({
      ...item,
      category: section.title,
      description: `${section.title} - ${item.name}`
    }))
  )

  const navigation = layoutView === 'all-expanded' 
    ? navigationSections.flatMap(s => s.items)
    : navigationSections.flatMap(s => s.items)

  // Toggle section collapse
  const toggleSection = (sectionTitle: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }))
  }

  // Check if section is collapsed
  const isSectionCollapsed = (sectionTitle: string) => {
    return collapsedSections[sectionTitle] || false
  }

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

          {/* Layout View Toggle */}
          <div className="px-4 py-3 border-b border-white/10">
            <div className="relative">
              <select
                value={layoutView}
                onChange={(e) => setLayoutView(e.target.value as LayoutView)}
                className="w-full bg-white/10 text-white border border-white/20 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer hover:bg-white/15"
              >
                <option value="categorized" className="bg-gray-800 text-white">📁 Categorized View</option>
                <option value="all-expanded" className="bg-gray-800 text-white">📋 All Expanded</option>
                <option value="compact" className="bg-gray-800 text-white">📊 Compact View</option>
              </select>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">
            {layoutView === 'categorized' ? (
              // Categorized View with Collapsible Sections
              <>
                {navigationSections.map((section, idx) => {
                  const isCollapsed = isSectionCollapsed(section.title)
                  const hasActiveItem = section.items.some(item => item.current)
                  
                  return (
                    <div key={section.title} className="mb-4">
                      {/* Section Header */}
                      <button
                        onClick={() => toggleSection(section.title)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg mb-2 transition-colors ${
                          hasActiveItem 
                            ? 'bg-white/20 text-white' 
                            : 'text-white/70 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{section.icon}</span>
                          <span className="text-sm font-semibold">{section.title}</span>
                          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                            {section.items.length}
                          </span>
                        </div>
                        {isCollapsed ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronUp className="w-4 h-4" />
                        )}
                      </button>
                      
                      {/* Section Items */}
                      {!isCollapsed && (
                        <div className="space-y-1 ml-3 pl-3 border-l border-white/20">
                          {section.items.map((item) => (
                            <Link
                              key={item.name}
                              to={item.href}
                              className={`nav-item ${item.current ? 'active' : ''}`}
                            >
                              <span className="text-base">{item.icon}</span>
                              <span className="text-sm">{item.name}</span>
                              {item.badge && (
                                <span className="badge ml-auto">{item.badge}</span>
                              )}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </>
            ) : layoutView === 'all-expanded' ? (
              // All Expanded View (Flat List)
              <div className="space-y-1">
                {navigationSections.flatMap(section => 
                  section.items.map((item) => (
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
                  ))
                )}
              </div>
            ) : (
              // Compact View
              <div className="grid grid-cols-2 gap-2">
                {navigationSections.flatMap(section => 
                  section.items.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`relative flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                        item.current 
                          ? 'bg-brand-secondary text-white' 
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                      title={item.name}
                    >
                      <span className="text-xl mb-1">{item.icon}</span>
                      <span className="text-xs text-center px-1 truncate w-full leading-tight">{item.name}</span>
                      {item.badge && (
                        <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))
                )}
              </div>
            )}
          </nav>

          {/* Settings */}
          <div className="p-4 border-t border-white/10">
            <Link to="/admin/settings" className="nav-item">
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
              <NotificationBell />
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
