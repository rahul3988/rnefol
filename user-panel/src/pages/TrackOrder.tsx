import { FormEvent, useState } from 'react'
import { api } from '../services/api'

type OrderStatus =
  | 'created'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'out-for-delivery'
  | 'delivered'
  | 'cancelled'

const statusSteps: { key: OrderStatus; label: string }[] = [
  { key: 'created', label: 'Order Placed' },
  { key: 'processing', label: 'Processing' },
  { key: 'packed', label: 'Packed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'out-for-delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' }
]

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<any>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!orderNumber.trim()) {
      setError('Please enter your order number.')
      return
    }
    try {
      setLoading(true)
      setError(null)

      // Requires backend support: GET /api/orders/:orderNumber
      const response = await api.orders.getById(orderNumber.trim())

      if (email && response.customer_email && response.customer_email !== email.trim()) {
        setError('Email does not match our records for this order.')
        setOrder(null)
        return
      }

      setOrder(response)
    } catch (err: any) {
      console.error('Failed to track order:', err)
      setError(err?.message || 'Order not found. Please verify the details and try again.')
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }

  const normalizedStatus = (order?.status || 'created').toLowerCase().replace(/\s+/g, '-') as OrderStatus

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 py-12">
      <div className="mx-auto max-w-4xl px-4">
        <header className="mb-10 text-center">
          <span className="inline-flex items-center rounded-full bg-indigo-100 px-4 py-1 text-sm font-semibold text-indigo-600">
            Track Order
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
            Stay Updated On Your Parcel
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-600">
            Inspired by Sugar Cosmetics and WOW Skin Science order trackers, follow your package in real-time and access support instantly.
          </p>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Order Number
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={event => setOrderNumber(event.target.value)}
                placeholder="e.g. NEFOL-20251027-1234"
                className="mt-2 w-full rounded-full border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email (optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="For verification"
                className="mt-2 w-full rounded-full border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div className="sm:col-span-3">
              <button
                type="submit"
                className="w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
              >
                {loading ? 'Fetching status…' : 'Track Order'}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {order && (
            <div className="mt-8 space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Order Summary</p>
                <div className="mt-3 grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
                  <div>
                    <p className="font-semibold text-slate-900">{order.order_number}</p>
                    <p className="text-xs text-slate-500">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="sm:text-right">
                    <p className="font-semibold text-slate-900">₹{Number(order.total).toFixed(2)}</p>
                    <p className="text-xs text-slate-500">Payment: {order.payment_method}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Live Status</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-6">
                  {statusSteps.map((step, index) => {
                    const isActive = statusSteps.findIndex(s => s.key === normalizedStatus) >= index
                    return (
                      <div key={step.key} className="text-center">
                        <div
                          className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition ${
                            isActive
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-slate-200 bg-slate-100 text-slate-400'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <p className="mt-2 text-xs font-medium text-slate-600">{step.label}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Items</p>
                <div className="mt-3 space-y-3">
                  {order.items?.map((item: any) => (
                    <div key={item.name} className="flex items-center justify-between rounded-xl bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                      <span>
                        {item.name} <span className="text-xs text-slate-400">× {item.quantity}</span>
                      </span>
                      <span className="font-semibold text-slate-900">₹{Number(item.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-700">
                  <p className="font-semibold">Need assistance?</p>
                  <p className="mt-1 text-xs text-indigo-600">
                    Chat with our support team or call +91-8887-847213 for expedited help.
                  </p>
                  <button
                    onClick={() => (window.location.hash = '#/user/contact')}
                    className="mt-3 rounded-full bg-white px-4 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-slate-100"
                  >
                    Contact Support
                  </button>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Pickup in Store?</p>
                  <p className="mt-1 text-xs text-slate-500">Switch to in-store pickup if delivery timelines don’t work for you.</p>
                  <button
                    onClick={() => (window.location.hash = '#/user/store-locator')}
                    className="mt-3 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                  >
                    Find Stores
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}


