import React, { useState, useEffect } from 'react'
import { Package, Clock, CheckCircle, XCircle, Truck, Eye } from 'lucide-react'
import { api } from '../services/api'
import { getApiBase } from '../utils/apiBase'
import { useAuth } from '../contexts/AuthContext'

interface OrderItem {
  id: number
  name: string
  quantity: number
  price: string
}

interface Order {
  id: string
  order_number: string
  status: string
  total: number
  date: string
  items: OrderItem[]
}

export default function UserOrders() {
  const { isAuthenticated } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const ordersData = await api.orders.getAll()
      
      // Filter orders for current user
      const token = localStorage.getItem('token')
      if (!token) {
        setOrders([])
        return
      }
      
      // Parse token to get user info
      const tokenParts = token.split('_')
      const userId = tokenParts[2]
      
      const userOrders = ordersData.map((order: any) => ({
        id: order.id.toString(),
        order_number: order.order_number,
        status: order.status,
        total: parseFloat(order.total),
        date: new Date(order.created_at).toLocaleDateString(),
        items: Array.isArray(order.items) ? order.items : []
      }))
      
      setOrders(userOrders)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'shipped':
        return <Truck className="w-5 h-5 text-blue-600" />
      case 'processing':
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Package className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'shipped':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'processing':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  if (loading) {
    return (
      <main className="py-10 dark:bg-slate-900 min-h-screen">
        <div className="mx-auto max-w-4xl px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading your orders...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="py-10 dark:bg-slate-900 min-h-screen">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4">
            <Package className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Your Orders
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Track and manage all your Nefol orders
          </p>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              No Orders Yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Start shopping to see your orders here.
            </p>
            <a 
              href="#/user/shop" 
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Start Shopping
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      Order #{order.order_number}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Placed on {order.date}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-2 capitalize">{order.status}</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-2">
                      ₹{order.total.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Items Ordered:
                  </h4>
                  <div className="space-y-2">
                    {order.items.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">
                          {item.name || 'Product'} x {item.quantity || 1}
                        </span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          ₹{item.price || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button 
                    onClick={() => window.location.hash = '#/user/contact'}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                  >
                    Contact Support
                  </button>
                  <button 
                    onClick={() => window.location.hash = `#/user/order/${order.order_number}`}
                    className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-sm font-medium">View Details</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 text-center">
            Need Help with Your Orders?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-center mb-6">
            Our customer support team is here to help you with any questions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#/user/contact" 
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Contact Support
            </a>
            <a 
              href="#/user/faq" 
              className="inline-block border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition-colors"
            >
              View FAQ
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}

