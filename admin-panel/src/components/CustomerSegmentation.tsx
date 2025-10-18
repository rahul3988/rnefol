import React, { useState } from 'react'
import { Users, Target, Filter, Plus, Edit, Trash2, Eye, BarChart3, TrendingUp, Calendar, MapPin, ShoppingCart, Heart, Star, Clock } from 'lucide-react'

interface CustomerSegment {
  id: string
  name: string
  description: string
  criteria: SegmentCriteria[]
  customerCount: number
  lastUpdated: string
  isActive: boolean
  tags: string[]
  stats: {
    totalOrders: number
    totalRevenue: number
    averageOrderValue: number
    lastPurchaseDate: string
  }
}

interface SegmentCriteria {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in'
  value: any
  value2?: any // For 'between' operator
}

interface Customer {
  id: string
  name: string
  email: string
  segment: string
  totalOrders: number
  totalSpent: number
  lastOrderDate: string
  location: string
  tags: string[]
}

export default function CustomerSegmentation() {
  const [segments] = useState<CustomerSegment[]>([
    {
      id: '1',
      name: 'VIP Customers',
      description: 'High-value customers with multiple purchases',
      criteria: [
        { field: 'total_spent', operator: 'greater_than', value: 10000 },
        { field: 'total_orders', operator: 'greater_than', value: 5 }
      ],
      customerCount: 125,
      lastUpdated: '2024-01-20',
      isActive: true,
      tags: ['high-value', 'loyal'],
      stats: {
        totalOrders: 1250,
        totalRevenue: 2500000,
        averageOrderValue: 2000,
        lastPurchaseDate: '2024-01-15'
      }
    },
    {
      id: '2',
      name: 'New Customers',
      description: 'Recently registered customers',
      criteria: [
        { field: 'registration_date', operator: 'greater_than', value: '2024-01-01' },
        { field: 'total_orders', operator: 'less_than', value: 3 }
      ],
      customerCount: 450,
      lastUpdated: '2024-01-20',
      isActive: true,
      tags: ['new', 'potential'],
      stats: {
        totalOrders: 180,
        totalRevenue: 360000,
        averageOrderValue: 2000,
        lastPurchaseDate: '2024-01-18'
      }
    },
    {
      id: '3',
      name: 'At-Risk Customers',
      description: 'Customers who haven\'t purchased recently',
      criteria: [
        { field: 'last_order_date', operator: 'less_than', value: '2023-12-01' },
        { field: 'total_orders', operator: 'greater_than', value: 1 }
      ],
      customerCount: 320,
      lastUpdated: '2024-01-20',
      isActive: true,
      tags: ['at-risk', 'retention'],
      stats: {
        totalOrders: 640,
        totalRevenue: 1280000,
        averageOrderValue: 2000,
        lastPurchaseDate: '2023-11-15'
      }
    },
    {
      id: '4',
      name: 'Skincare Enthusiasts',
      description: 'Customers interested in skincare products',
      criteria: [
        { field: 'category_preference', operator: 'contains', value: 'skincare' },
        { field: 'total_orders', operator: 'greater_than', value: 2 }
      ],
      customerCount: 280,
      lastUpdated: '2024-01-20',
      isActive: true,
      tags: ['skincare', 'engaged'],
      stats: {
        totalOrders: 840,
        totalRevenue: 1680000,
        averageOrderValue: 2000,
        lastPurchaseDate: '2024-01-16'
      }
    }
  ])

  const [customers] = useState<Customer[]>([
    {
      id: '1',
      name: 'Priya Sharma',
      email: 'priya.sharma@email.com',
      segment: 'VIP Customers',
      totalOrders: 12,
      totalSpent: 25000,
      lastOrderDate: '2024-01-15',
      location: 'Mumbai',
      tags: ['high-value', 'loyal']
    },
    {
      id: '2',
      name: 'Amit Kumar',
      email: 'amit.kumar@email.com',
      segment: 'New Customers',
      totalOrders: 2,
      totalSpent: 4000,
      lastOrderDate: '2024-01-18',
      location: 'Delhi',
      tags: ['new', 'potential']
    },
    {
      id: '3',
      name: 'Sneha Patel',
      email: 'sneha.patel@email.com',
      segment: 'Skincare Enthusiasts',
      totalOrders: 8,
      totalSpent: 16000,
      lastOrderDate: '2024-01-16',
      location: 'Bangalore',
      tags: ['skincare', 'engaged']
    }
  ])

  const [selectedSegment, setSelectedSegment] = useState<CustomerSegment | null>(null)
  const [showCreateSegment, setShowCreateSegment] = useState(false)
  const [showSegmentDetails, setShowSegmentDetails] = useState(false)
  const [activeTab, setActiveTab] = useState('segments')

  const totalStats = {
    totalSegments: segments.length,
    totalCustomers: segments.reduce((sum, s) => sum + s.customerCount, 0),
    activeSegments: segments.filter(s => s.isActive).length,
    totalRevenue: segments.reduce((sum, s) => sum + s.stats.totalRevenue, 0)
  }

  const getOperatorLabel = (operator: string) => {
    switch (operator) {
      case 'equals': return 'equals'
      case 'not_equals': return 'does not equal'
      case 'contains': return 'contains'
      case 'not_contains': return 'does not contain'
      case 'greater_than': return 'is greater than'
      case 'less_than': return 'is less than'
      case 'between': return 'is between'
      case 'in': return 'is in'
      case 'not_in': return 'is not in'
      default: return operator
    }
  }

  const getFieldLabel = (field: string) => {
    switch (field) {
      case 'total_spent': return 'Total Spent'
      case 'total_orders': return 'Total Orders'
      case 'registration_date': return 'Registration Date'
      case 'last_order_date': return 'Last Order Date'
      case 'category_preference': return 'Category Preference'
      case 'location': return 'Location'
      case 'age': return 'Age'
      case 'gender': return 'Gender'
      default: return field
    }
  }

  const handleCreateSegment = () => {
    setShowCreateSegment(true)
  }

  const handleEditSegment = (segment: CustomerSegment) => {
    setSelectedSegment(segment)
    setShowCreateSegment(true)
  }

  const handleDeleteSegment = (segmentId: string) => {
    console.log('Deleting segment:', segmentId)
    alert('Segment deleted successfully!')
  }

  const handleViewSegment = (segment: CustomerSegment) => {
    setSelectedSegment(segment)
    setShowSegmentDetails(true)
  }

  const tabs = [
    { id: 'segments', label: 'Segments', icon: Target },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ]

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Customer Segmentation
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Create targeted customer segments for personalized marketing
          </p>
        </div>
        <button
          onClick={handleCreateSegment}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Segment</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Total Segments</h3>
              <p className="text-3xl font-bold">{totalStats.totalSegments}</p>
            </div>
            <Target className="h-8 w-8" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Total Customers</h3>
              <p className="text-3xl font-bold">{totalStats.totalCustomers.toLocaleString()}</p>
            </div>
            <Users className="h-8 w-8" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Active Segments</h3>
              <p className="text-3xl font-bold">{totalStats.activeSegments}</p>
            </div>
            <TrendingUp className="h-8 w-8" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Total Revenue</h3>
              <p className="text-3xl font-bold">₹{(totalStats.totalRevenue / 100000).toFixed(1)}L</p>
            </div>
            <ShoppingCart className="h-8 w-8" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg">
        <div className="border-b border-slate-200 dark:border-slate-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Segments Tab */}
          {activeTab === 'segments' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {segments.map((segment) => (
                  <div key={segment.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                        {segment.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        segment.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {segment.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      {segment.description}
                    </p>
                    
                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Customers:</span>
                        <span className="font-semibold">{segment.customerCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Revenue:</span>
                        <span className="font-semibold text-green-600">₹{(segment.stats.totalRevenue / 100000).toFixed(1)}L</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Avg Order:</span>
                        <span className="font-semibold">₹{segment.stats.averageOrderValue}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-4">
                      {segment.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewSegment(segment)}
                        className="flex-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEditSegment(segment)}
                        className="px-3 py-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm rounded hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSegment(segment.id)}
                        className="px-3 py-1 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 text-sm rounded hover:bg-red-50 dark:hover:bg-red-900 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers Tab */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Customer List
                </h3>
                <div className="flex space-x-2">
                  <select className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100">
                    <option>All Segments</option>
                    <option>VIP Customers</option>
                    <option>New Customers</option>
                    <option>At-Risk Customers</option>
                    <option>Skincare Enthusiasts</option>
                  </select>
                  <button className="px-3 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <Filter className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Segment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Orders
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Total Spent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Last Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {customers.map((customer) => (
                      <tr key={customer.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {customer.name}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              {customer.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                            {customer.segment}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          {customer.totalOrders}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          ₹{customer.totalSpent.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          {new Date(customer.lastOrderDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          {customer.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">
                            View
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            Message
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                    Segment Performance
                  </h3>
                  <div className="space-y-3">
                    {segments
                      .sort((a, b) => b.stats.totalRevenue - a.stats.totalRevenue)
                      .slice(0, 3)
                      .map((segment, index) => (
                        <div key={segment.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                                {index + 1}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                                {segment.name}
                              </h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {segment.customerCount} customers
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">
                              ₹{(segment.stats.totalRevenue / 100000).toFixed(1)}L
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Revenue
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
                
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                    Segment Analytics
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Total Segments</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {totalStats.totalSegments}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Active Segments</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {totalStats.activeSegments}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Total Customers</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {totalStats.totalCustomers}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Total Revenue</span>
                      <span className="font-semibold text-green-600">
                        ₹{(totalStats.totalRevenue / 100000).toFixed(1)}L
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Segment Details Modal */}
      {showSegmentDetails && selectedSegment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Segment Details: {selectedSegment.name}
              </h3>
              <button
                onClick={() => setShowSegmentDetails(false)}
                className="text-2xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Description
                </h4>
                <p className="text-slate-600 dark:text-slate-400">
                  {selectedSegment.description}
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Segmentation Criteria
                </h4>
                <div className="space-y-2">
                  {selectedSegment.criteria.map((criterion, index) => (
                    <div key={index} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {getFieldLabel(criterion.field)}
                      </span>
                      <span className="mx-2 text-slate-600 dark:text-slate-400">
                        {getOperatorLabel(criterion.operator)}
                      </span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {criterion.value}
                        {criterion.value2 && ` and ${criterion.value2}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Segment Statistics
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">{selectedSegment.customerCount}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Customers</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{selectedSegment.stats.totalOrders}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Orders</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-purple-600">₹{(selectedSegment.stats.totalRevenue / 100000).toFixed(1)}L</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Revenue</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-orange-600">₹{selectedSegment.stats.averageOrderValue}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Avg Order Value</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Segment Modal */}
      {showCreateSegment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              {selectedSegment ? 'Edit Segment' : 'Create New Segment'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Segment Name
                </label>
                <input
                  type="text"
                  defaultValue={selectedSegment?.name || ''}
                  placeholder="Enter segment name"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  defaultValue={selectedSegment?.description || ''}
                  placeholder="Enter segment description"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Criteria
                </label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <select className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100">
                      <option>Total Spent</option>
                      <option>Total Orders</option>
                      <option>Registration Date</option>
                      <option>Last Order Date</option>
                      <option>Category Preference</option>
                    </select>
                    <select className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100">
                      <option>is greater than</option>
                      <option>is less than</option>
                      <option>equals</option>
                      <option>contains</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Value"
                      className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowCreateSegment(false)
                  setSelectedSegment(null)
                }}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowCreateSegment(false)
                  setSelectedSegment(null)
                  alert('Segment saved successfully!')
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {selectedSegment ? 'Update Segment' : 'Create Segment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Segmentation Best Practices */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-4">Customer Segmentation Best Practices</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold">1</span>
            </div>
            <h3 className="font-semibold mb-2">Define Clear Criteria</h3>
            <p className="text-sm opacity-90">
              Use specific, measurable criteria to create meaningful customer segments.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold">2</span>
            </div>
            <h3 className="font-semibold mb-2">Regular Updates</h3>
            <p className="text-sm opacity-90">
              Regularly update segments based on changing customer behavior and preferences.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold">3</span>
            </div>
            <h3 className="font-semibold mb-2">Personalized Marketing</h3>
            <p className="text-sm opacity-90">
              Use segments to deliver personalized marketing messages and offers.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
