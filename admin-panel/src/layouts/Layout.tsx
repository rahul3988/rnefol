import React, { useState } from 'react'
import { Outlet, useLocation, Link } from 'react-router-dom'

const Layout = () => {
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const navigation = [
    { name: 'Dashboard', href: '/', icon: '🏠', current: location.pathname === '/' },
    { name: 'Orders', href: '/orders', icon: '📦', current: location.pathname === '/orders', badge: '4' },
    { name: 'Invoices', href: '/invoices', icon: '🧾', current: location.pathname === '/invoices' },
    { name: 'Shipments', href: '/shipments', icon: '🚚', current: location.pathname === '/shipments' },
    { name: 'Products', href: '/products', icon: '🛍️', current: location.pathname === '/products' },
    { name: 'Customers', href: '/customers', icon: '👥', current: location.pathname === '/customers' },
    { name: 'Users', href: '/users', icon: '👤', current: location.pathname === '/users' },
    { name: 'Loyalty Program', href: '/loyalty-program', icon: '⭐', current: location.pathname === '/loyalty-program' },
    { name: 'Affiliate Program', href: '/affiliate-program', icon: '🤝', current: location.pathname === '/affiliate-program' },
    { name: 'Cashback System', href: '/cashback', icon: '💰', current: location.pathname === '/cashback' },
    { name: 'Email Marketing', href: '/email-marketing', icon: '📧', current: location.pathname === '/email-marketing' },
    { name: 'SMS Marketing', href: '/sms-marketing', icon: '📱', current: location.pathname === '/sms-marketing' },
    { name: 'Push Notifications', href: '/push-notifications', icon: '🔔', current: location.pathname === '/push-notifications' },
    { name: 'WhatsApp Chat', href: '/whatsapp-chat', icon: '💬', current: location.pathname === '/whatsapp-chat' },
    { name: 'Live Chat', href: '/live-chat', icon: '💬', current: location.pathname === '/live-chat' },
    { name: 'Analytics', href: '/analytics', icon: '📊', current: location.pathname === '/analytics' },
    { name: 'Form Builder', href: '/form-builder', icon: '📝', current: location.pathname === '/form-builder' },
    { name: 'Workflow Automation', href: '/workflow-automation', icon: '⚙️', current: location.pathname === '/workflow-automation' },
    { name: 'Customer Segmentation', href: '/customer-segmentation', icon: '🎯', current: location.pathname === '/customer-segmentation' },
    { name: 'Journey Tracking', href: '/journey-tracking', icon: '🗺️', current: location.pathname === '/journey-tracking' },
    { name: 'Actionable Analytics', href: '/actionable-analytics', icon: '📈', current: location.pathname === '/actionable-analytics' },
    { name: 'AI Box', href: '/ai-box', icon: '🤖', current: location.pathname === '/ai-box' },
    { name: 'Journey Funnel', href: '/journey-funnel', icon: '🔄', current: location.pathname === '/journey-funnel' },
    { name: 'AI Personalization', href: '/ai-personalization', icon: '🎨', current: location.pathname === '/ai-personalization' },
    { name: 'Custom Audience', href: '/custom-audience', icon: '👥', current: location.pathname === '/custom-audience' },
    { name: 'Omni Channel', href: '/omni-channel', icon: '🌐', current: location.pathname === '/omni-channel' },
    { name: 'API Manager', href: '/api-manager', icon: '🔧', current: location.pathname === '/api-manager' },
    { name: 'Payment Options', href: '/payment-options', icon: '💳', current: location.pathname === '/payment-options' },
    { name: 'Video Manager', href: '/video-manager', icon: '🎬', current: location.pathname === '/video-manager' },
    { name: 'Invoice', href: '/invoice', icon: '🧾', current: location.pathname === '/invoice' },
    { name: 'Tax', href: '/tax', icon: '💰', current: location.pathname === '/tax' },
    { name: 'Returns', href: '/returns', icon: '↩️', current: location.pathname === '/returns' },
    { name: 'Payment', href: '/payment', icon: '💳', current: location.pathname === '/payment' },
    { name: 'Categories', href: '/categories', icon: '📂', current: location.pathname === '/categories' },
    { name: 'Marketing', href: '/marketing', icon: '📢', current: location.pathname === '/marketing' },
    { name: 'Discounts', href: '/discounts', icon: '🏷️', current: location.pathname === '/discounts' },
  ]

  const salesChannels = [
    { name: 'Facebook & Instagram', href: '/facebook', icon: '📘' },
    { name: 'Online Store', href: '/store', icon: '🏪' },
  ]

  const apps = [
    { name: 'Google & YouTube', href: '/google', icon: '🔍' },
    { name: 'Forms', href: '/forms', icon: '📝' },
  ]

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
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search"
                  className="w-96 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                />
                <span className="absolute right-3 top-2.5 text-xs text-gray-400">CTRL K</span>
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
