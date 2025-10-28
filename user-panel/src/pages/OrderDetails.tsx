import React, { useState, useEffect } from 'react'
import { Package, CheckCircle, XCircle, Truck, MapPin, Calendar, CreditCard, ArrowLeft, Download } from 'lucide-react'
import { api } from '../services/api'
import { getApiBase } from '../utils/apiBase'
import { useAuth } from '../contexts/AuthContext'

interface OrderDetails {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  shipping_address: any
  items: any[]
  subtotal: number
  shipping: number
  tax: number
  total: number
  status: string
  payment_method: string
  payment_type: string
  created_at: string
  tracking_number?: string
  estimated_delivery?: string
}

export default function OrderDetails() {
  const { isAuthenticated } = useAuth()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [relatedProducts, setRelatedProducts] = useState<any[]>([])
  
  // Get order number from URL
  useEffect(() => {
    const hash = window.location.hash
    const orderNumberMatch = hash.match(/user\/order\/(.+)/)
    const orderNumber = orderNumberMatch ? orderNumberMatch[1] : ''
    
    if (!isAuthenticated) {
      setError('Please login to view order details')
      setLoading(false)
      return
    }
    
    if (orderNumber) {
      fetchOrderDetails(orderNumber)
    } else {
      setError('Order number not found')
      setLoading(false)
    }
  }, [isAuthenticated])

  const fetchOrderDetails = async (orderNumber: string) => {
    try {
      setLoading(true)
      const orderData = await api.orders.getById(orderNumber)
      
      setOrder({
        id: orderData.id.toString(),
        order_number: orderData.order_number,
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email,
        shipping_address: orderData.shipping_address,
        items: orderData.items || [],
        subtotal: orderData.subtotal || 0,
        shipping: orderData.shipping || 0,
        tax: orderData.tax || 0,
        total: orderData.total || 0,
        status: orderData.status,
        payment_method: orderData.payment_method,
        payment_type: orderData.payment_type,
        created_at: orderData.created_at,
        tracking_number: orderData.tracking_number,
        estimated_delivery: orderData.estimated_delivery
      })
    } catch (err: any) {
      console.error('Failed to fetch order details:', err)
      setError(err.message || 'Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  const fetchRelatedProducts = async () => {
    try {
      const response = await fetch(`${getApiBase()}/api/products`)
      const products = await response.json()
      // Get random 6 products as related products
      const shuffled = products.sort(() => 0.5 - Math.random())
      setRelatedProducts(shuffled.slice(0, 6))
    } catch (error) {
      console.error('Failed to fetch related products:', error)
      setRelatedProducts([])
    }
  }

  useEffect(() => {
    if (!loading && order) {
      fetchRelatedProducts()
    }
  }, [order, loading])

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return <CheckCircle className="w-6 h-6 text-green-600" />
      case 'shipped':
        return <Truck className="w-6 h-6 text-blue-600" />
      case 'processing':
      case 'pending':
        return <Package className="w-6 h-6 text-yellow-600" />
      case 'cancelled':
        return <XCircle className="w-6 h-6 text-red-600" />
      default:
        return <Package className="w-6 h-6 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300 dark:border-green-700'
      case 'shipped':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700'
      case 'processing':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 dark:border-red-700'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-700'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <main className="py-10 dark:bg-slate-900 min-h-screen">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading order details...</p>
          </div>
        </div>
      </main>
    )
  }

  if (error || !order) {
    return (
      <main className="py-10 dark:bg-slate-900 min-h-screen">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              {error || 'Order not found'}
            </h2>
            <a
              href="#/user/user-orders"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Orders
            </a>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="py-10 dark:bg-slate-900 min-h-screen">
      <div className="mx-auto max-w-5xl px-4">
        {/* Back Button */}
        <button
          onClick={() => window.location.hash = '#/user/user-orders'}
          className="mb-6 flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Orders</span>
        </button>

        {/* Order Header */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Order #{order.order_number}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Placed on {formatDate(order.created_at)}
              </p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
              <span className="font-semibold capitalize">{order.status}</span>
            </div>
          </div>

          {/* Order Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Order Date</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {formatDate(order.created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <CreditCard className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Payment</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {order.payment_method}
                </p>
              </div>
            </div>
            {order.tracking_number && (
              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <Truck className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Tracking</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {order.tracking_number}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Order Items
          </h2>
          <div className="space-y-4">
            {order.items.map((item: any, index: number) => {
              // Construct full image URL
              const imageUrl = item.list_image || item.image || item.product_image
              const fullImageUrl = imageUrl && imageUrl.startsWith('http') 
                ? imageUrl 
                : imageUrl 
                  ? `http://192.168.1.66:4000${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`
                  : null
              
              return (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                >
                  <div className="w-24 h-24 flex-shrink-0 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden shadow-sm">
                    {fullImageUrl ? (
                      <img
                        src={fullImageUrl}
                        alt={item.name || item.title || 'Product'}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          // Fallback to default image on error
                          const target = e.target as HTMLImageElement
                          target.src = '/IMAGES/default-product.jpg'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg">
                      {item.name || item.title || 'Product'}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Quantity: {item.quantity || 1}
                    </p>
                    {item.details && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                        {item.details}
                      </p>
                    )}
                    {item.category && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                        {item.category}
                      </span>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-lg text-slate-900 dark:text-slate-100">
                      ₹{item.price ? parseFloat(item.price).toLocaleString() : '0'}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {item.quantity || 1}x
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Shipping Address */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Shipping Address
              </h2>
            </div>
            <div className="text-slate-700 dark:text-slate-300">
              <p className="font-semibold">{order.customer_name}</p>
              <p>{order.shipping_address?.street || order.shipping_address?.address || 'Address not available'}</p>
              <p>
                {order.shipping_address?.city || ''}, {order.shipping_address?.state || ''}
              </p>
              <p>{order.shipping_address?.zip || ''}</p>
              {order.shipping_address?.phone && (
                <p className="mt-2">Phone: {order.shipping_address.phone}</p>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Order Summary
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span>₹{order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Shipping</span>
                <span>₹{order.shipping.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Tax</span>
                <span>₹{order.tax.toLocaleString()}</span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Total
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    ₹{order.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-4">
          <button 
            onClick={() => {
              const apiBase = getApiBase();
              window.open(`${apiBase}/api/invoices/${order.id}/download`, '_blank');
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Download Invoice
          </button>
          <a
            href="#/user/contact"
            className="flex items-center gap-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Contact Support
          </a>
          {order.status.toLowerCase() === 'delivered' || order.status.toLowerCase() === 'completed' ? (
            <button className="flex items-center gap-2 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 px-6 py-3 rounded-lg hover:bg-green-50 dark:hover:bg-green-900 transition-colors">
              Reorder
            </button>
          ) : null}
        </div>

        {/* Track Order Section */}
        {order.tracking_number && (
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Track Your Order
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Tracking Number: <span className="font-semibold">{order.tracking_number}</span>
            </p>
            {order.estimated_delivery && (
              <p className="text-slate-600 dark:text-slate-400">
                Estimated Delivery: <span className="font-semibold">{formatDate(order.estimated_delivery)}</span>
              </p>
            )}
          </div>
        )}

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                You May Also Like
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Discover more products from Nefol
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {relatedProducts.map((product: any) => {
                const imageUrl = product.list_image || product.image
                const fullImageUrl = imageUrl && imageUrl.startsWith('http') 
                  ? imageUrl 
                  : imageUrl 
                    ? `http://192.168.1.66:4000${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`
                    : '/IMAGES/default-product.jpg'

                return (
                  <div
                    key={product.id}
                    onClick={() => window.location.hash = `#/user/product/${product.slug || product.id}`}
                    className="bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden group"
                  >
                    <div className="aspect-square overflow-hidden bg-slate-100 dark:bg-slate-700">
                      <img
                        src={fullImageUrl}
                        alt={product.title || product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/IMAGES/default-product.jpg'
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {product.title || product.name}
                      </h3>
                      {product.category && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                          {product.category}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <div>
                          <p className="text-2xl font-bold text-blue-600">
                            ₹{product.price ? parseFloat(product.price).toLocaleString() : '999'}
                          </p>
                          {product.mrp && parseFloat(product.mrp) > parseFloat(product.price || '0') && (
                            <p className="text-sm text-slate-500 line-through">
                              ₹{parseFloat(product.mrp).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-8 text-center">
              <a
                href="#/user/shop"
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Shop All Products
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

