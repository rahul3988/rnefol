import { useEffect, useState } from 'react'
import { CheckCircle, Package, Truck, Clock } from 'lucide-react'

interface OrderDetails {
  order_number: string
  invoice_number?: string
  shipment_id?: string
  customer_name: string
  customer_email: string
  shipping_address: {
    address: string
    city: string
    state: string
    zip: string
    phone: string
  }
  items: Array<{
    title: string
    price: string
    quantity: number
    slug: string
  }>
  subtotal: number
  shipping: number
  tax: number
  total: number
  status: string
  payment_method: string
  payment_type: string
  created_at: string
  estimated_delivery: string
}

export default function Confirmation() {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const u = new URL(window.location.href)
  const qs = new URLSearchParams(u.hash.split('?')[1] || '')
  const orderNumber = qs.get('order')

  useEffect(() => {
    if (orderNumber) {
      fetchOrderDetails(orderNumber)
    } else {
      setLoading(false)
    }
  }, [orderNumber])

  const fetchOrderDetails = async (orderNum: string) => {
    try {
      const response = await fetch(`${window.location.protocol}//${window.location.hostname}:4000/api/orders/${orderNum}`)
      if (response.ok) {
        const data = await response.json()
        setOrderDetails(data)
      } else {
        setError('Order not found')
      }
    } catch (err) {
      setError('Failed to fetch order details')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'shipped':
        return <Truck className="h-5 w-5 text-blue-500" />
      case 'delivered':
        return <Package className="h-5 w-5 text-green-600" />
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Order Confirmed'
      case 'shipped':
        return 'Shipped'
      case 'delivered':
        return 'Delivered'
      default:
        return 'Processing'
    }
  }

  if (loading) {
    return (
      <main className="py-10 dark:bg-slate-900">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Loading order details...</p>
        </div>
      </main>
    )
  }

  if (error || !orderDetails) {
    return (
      <main className="py-10 dark:bg-slate-900">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h1 className="text-3xl font-bold mb-2 dark:text-slate-100">Order Not Found</h1>
          <p className="text-slate-600 dark:text-slate-400">{error || 'Unable to load order details'}</p>
          <a href="#/shop" className="inline-block mt-6 rounded bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700">Continue Shopping</a>
        </div>
      </main>
    )
  }

  return (
    <main className="py-10 dark:bg-slate-900">
      <div className="mx-auto max-w-4xl px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2 dark:text-slate-100">Order Confirmed!</h1>
          <p className="text-slate-600 dark:text-slate-400">Your order has been placed successfully.</p>
          <p className="mt-2 text-lg dark:text-slate-100">Order Number: <span className="font-mono text-blue-600">{orderDetails.order_number}</span></p>
          {orderDetails.invoice_number && (
            <p className="mt-1 text-sm dark:text-slate-100">Invoice: <span className="font-mono text-green-600">{orderDetails.invoice_number}</span></p>
          )}
          {orderDetails.shipment_id && (
            <p className="mt-1 text-sm dark:text-slate-100">Shipment ID: <span className="font-mono text-purple-600">{orderDetails.shipment_id}</span></p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Status */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 dark:text-slate-100">Order Status</h2>
            <div className="flex items-center gap-3 mb-4">
              {getStatusIcon(orderDetails.status)}
              <span className="font-medium dark:text-slate-100">{getStatusText(orderDetails.status)}</span>
            </div>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <p>Payment Method: <span className="font-medium text-slate-900 dark:text-slate-100">{orderDetails.payment_method}</span></p>
              <p>Payment Type: <span className="font-medium text-slate-900 dark:text-slate-100">{orderDetails.payment_type}</span></p>
              <p>Order Date: <span className="font-medium text-slate-900 dark:text-slate-100">{new Date(orderDetails.created_at).toLocaleDateString()}</span></p>
              <p>Estimated Delivery: <span className="font-medium text-slate-900 dark:text-slate-100">{orderDetails.estimated_delivery}</span></p>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 dark:text-slate-100">Shipping Address</h2>
            <div className="text-slate-600 dark:text-slate-400">
              <p className="font-medium text-slate-900 dark:text-slate-100">{orderDetails.customer_name}</p>
              <p>{orderDetails.shipping_address.address}</p>
              <p>{orderDetails.shipping_address.city}, {orderDetails.shipping_address.state} {orderDetails.shipping_address.zip}</p>
              <p>Phone: {orderDetails.shipping_address.phone}</p>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 dark:text-slate-100">Order Items</h2>
          <div className="space-y-3">
            {orderDetails.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                <div>
                  <p className="font-medium dark:text-slate-100">{item.title}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Qty: {item.quantity}</p>
                </div>
                <p className="font-medium dark:text-slate-100">₹{(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          
          {/* Order Summary */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                <span className="dark:text-slate-100">₹{Number(orderDetails.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Shipping</span>
                <span className="dark:text-slate-100">₹{Number(orderDetails.shipping || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Tax</span>
                <span className="dark:text-slate-100">₹{Number(orderDetails.tax || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="dark:text-slate-100">Total</span>
                <span className="dark:text-slate-100">₹{Number(orderDetails.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <a href="#/shop" className="inline-block rounded bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 transition-colors">
            Continue Shopping
          </a>
          <button 
            onClick={() => window.print()} 
            className="inline-block rounded border border-slate-300 dark:border-slate-600 px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Print Receipt
          </button>
        </div>

        {/* Invoice & Shiprocket Integration */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Invoice Information */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-900 dark:text-green-100">Invoice Generated</h3>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Your invoice has been automatically generated and sent to your email.
                  {orderDetails.invoice_number && (
                    <span className="block mt-1 font-mono text-green-800 dark:text-green-200">
                      Invoice: {orderDetails.invoice_number}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Shiprocket Integration */}
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Truck className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-purple-900 dark:text-purple-100">Shiprocket Integration</h3>
                <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                  Your order details have been sent to Shiprocket for delivery processing.
                  {orderDetails.shipment_id && (
                    <span className="block mt-1 font-mono text-purple-800 dark:text-purple-200">
                      Shipment ID: {orderDetails.shipment_id}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Notification */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Package className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">Delivery Updates</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                You'll receive SMS and email notifications when your order is shipped and delivered. 
                Track your order using the order number: <span className="font-mono">{orderDetails.order_number}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}


