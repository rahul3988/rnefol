import React, { useState, useEffect } from 'react'

type Discount = {
  id: number
  code: string
  name: string
  type: 'percentage' | 'fixed' | 'free_shipping'
  value: number
  minAmount?: number
  maxUses?: number
  usedCount: number
  status: 'active' | 'inactive' | 'expired'
  validFrom: string
  validUntil: string
  applicableTo: 'all' | 'products' | 'categories'
  createdAt: string
}

type DiscountUsage = {
  id: number
  discountId: number
  customerEmail: string
  orderId: number
  amount: number
  usedAt: string
}

export default function Discounts() {
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [usage, setUsage] = useState<DiscountUsage[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'discounts' | 'usage' | 'create'>('discounts')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const apiBase = (import.meta as any).env.VITE_API_URL || `http://${window.location.hostname}:4000`

  useEffect(() => {
    loadDiscounts()
    loadUsage()
  }, [])

  const loadDiscounts = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${apiBase}/api/discounts`)
      const data = await res.json()
      setDiscounts(data)
    } catch (error) {
      console.error('Failed to load discounts:', error)
      setDiscounts([])
    } finally {
      setLoading(false)
    }
  }

  const loadUsage = async () => {
    try {
      const res = await fetch(`${apiBase}/api/discounts/usage`)
      const data = await res.json()
      setUsage(data)
    } catch (error) {
      console.error('Failed to load usage:', error)
      setUsage([])
    }
  }

  const getStatusColor = (status: Discount['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'expired': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: Discount['type']) => {
    switch (type) {
      case 'percentage': return '📊'
      case 'fixed': return '💰'
      case 'free_shipping': return '🚚'
      default: return '💰'
    }
  }

  const formatDiscountValue = (discount: Discount) => {
    switch (discount.type) {
      case 'percentage': return `${discount.value}%`
      case 'fixed': return `₹${discount.value}`
      case 'free_shipping': return 'Free Shipping'
      default: return `${discount.value}`
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Discounts</h1>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          Create Discount
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'discounts', name: 'Discount Codes', count: discounts.length },
            { id: 'usage', name: 'Usage History', count: usage.length },
            { id: 'create', name: 'Create New', count: 0 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Discounts Tab */}
      {activeTab === 'discounts' && (
        <div className="space-y-6">
          {/* Discount Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { title: 'Total Discounts', value: discounts.length, icon: '🎫' },
              { title: 'Active', value: discounts.filter(d => d.status === 'active').length, icon: '✅' },
              { title: 'Total Uses', value: discounts.reduce((sum, d) => sum + d.usedCount, 0), icon: '📈' },
              { title: 'Total Saved', value: '₹12,450', icon: '💰' }
            ].map((stat, index) => (
              <div key={index} className="metric-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className="text-2xl">{stat.icon}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Discounts Table */}
          <div className="metric-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="py-3 pr-4">Code</th>
                    <th className="py-3 pr-4">Name</th>
                    <th className="py-3 pr-4">Type</th>
                    <th className="py-3 pr-4">Value</th>
                    <th className="py-3 pr-4">Min Amount</th>
                    <th className="py-3 pr-4">Usage</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Valid Until</th>
                    <th className="py-3 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {discounts.map((discount) => (
                    <tr key={discount.id} className="border-b border-gray-100">
                      <td className="py-3 pr-4">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">{discount.code}</code>
                      </td>
                      <td className="py-3 pr-4 font-medium text-gray-900">{discount.name}</td>
                      <td className="py-3 pr-4">
                        <span className="flex items-center space-x-1">
                          <span>{getTypeIcon(discount.type)}</span>
                          <span className="capitalize">{discount.type.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-semibold">{formatDiscountValue(discount)}</td>
                      <td className="py-3 pr-4 text-gray-600">
                        {discount.minAmount ? `₹${discount.minAmount}` : '—'}
                      </td>
                      <td className="py-3 pr-4">
                        <div>
                          <span className="font-medium">{discount.usedCount}</span>
                          {discount.maxUses && (
                            <span className="text-gray-500"> / {discount.maxUses}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(discount.status)}`}>
                          {discount.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {new Date(discount.validUntil).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex space-x-2">
                          <button className="btn-secondary text-xs px-2 py-1">Edit</button>
                          <button className="btn-secondary text-xs px-2 py-1">Copy</button>
                          <button className="bg-red-600 text-white px-2 py-1 text-xs rounded hover:bg-red-700">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Usage Tab */}
      {activeTab === 'usage' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Discount Usage History</h2>
            <button className="btn-secondary">Export</button>
          </div>

          <div className="metric-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="py-3 pr-4">Customer</th>
                    <th className="py-3 pr-4">Order ID</th>
                    <th className="py-3 pr-4">Discount Code</th>
                    <th className="py-3 pr-4">Amount Saved</th>
                    <th className="py-3 pr-4">Used At</th>
                  </tr>
                </thead>
                <tbody>
                  {usage.map((use) => {
                    const discount = discounts.find(d => d.id === use.discountId)
                    return (
                      <tr key={use.id} className="border-b border-gray-100">
                        <td className="py-3 pr-4 text-gray-600">{use.customerEmail}</td>
                        <td className="py-3 pr-4 font-medium">#{use.orderId}</td>
                        <td className="py-3 pr-4">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                            {discount?.code || 'Unknown'}
                          </code>
                        </td>
                        <td className="py-3 pr-4 font-semibold text-green-600">₹{use.amount}</td>
                        <td className="py-3 pr-4 text-gray-600">
                          {new Date(use.usedAt).toLocaleString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create Tab */}
      {activeTab === 'create' && (
        <div className="space-y-6">
          <div className="metric-card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Discount</h2>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Code</label>
                  <input 
                    type="text" 
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-primary focus:outline-none"
                    placeholder="WELCOME10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Name</label>
                  <input 
                    type="text" 
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-primary focus:outline-none"
                    placeholder="Welcome Discount"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-primary focus:outline-none">
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                  <input 
                    type="number" 
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-primary focus:outline-none"
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
                  <input 
                    type="number" 
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-primary focus:outline-none"
                    placeholder="500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
                  <input 
                    type="date" 
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                  <input 
                    type="date" 
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button type="button" className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create Discount</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}








