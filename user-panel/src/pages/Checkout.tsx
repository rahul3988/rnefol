import { useEffect, useMemo, useState } from 'react'
import { useCart, parsePrice } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import { CreditCard, Smartphone, Wallet, Building } from 'lucide-react'
import PricingDisplay from '../components/PricingDisplay'
import AuthGuard from '../components/AuthGuard'

const paymentMethods = [
  { id: 'cod', name: 'Cash on Delivery', icon: CreditCard, color: 'bg-green-500' },
  { id: 'razorpay', name: 'Razorpay', icon: CreditCard, color: 'bg-blue-500' },
  { id: 'easybuzz', name: 'Easybuzz', icon: Building, color: 'bg-green-500' },
  { id: 'phonepe', name: 'PhonePe', icon: Smartphone, color: 'bg-purple-500' },
  { id: 'googlepay', name: 'Google Pay', icon: Wallet, color: 'bg-blue-600' },
  { id: 'paytm', name: 'Paytm', icon: Wallet, color: 'bg-yellow-500' },
  { id: 'navi', name: 'Navi', icon: CreditCard, color: 'bg-indigo-500' },
  { id: 'bhim', name: 'BHIM', icon: Building, color: 'bg-orange-500' }
]

interface CheckoutProps {
  affiliateId?: string | null
}

export default function Checkout({ affiliateId }: CheckoutProps) {
  const cartContext = useCart()
  
  // Safely access cart properties with fallbacks
  const items = cartContext?.items || []
  const subtotal = cartContext?.subtotal || 0
  const tax = cartContext?.tax || 0
  const total = cartContext?.total || 0
  const clear = cartContext?.clear
  const { user, isAuthenticated } = useAuth()
  const [buySlug, setBuySlug] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPayment, setSelectedPayment] = useState('cod')
  const [paymentType, setPaymentType] = useState<'prepaid' | 'postpaid'>('prepaid')
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<any[]>([])
  const [loyaltyPoints, setLoyaltyPoints] = useState(0)
  const [discountCode, setDiscountCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null)
  const [csvProducts, setCsvProducts] = useState<any>({}) // Store CSV product data by slug

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')

  useEffect(() => {
    const u = new URL(window.location.href)
    const s = u.hash.split('?')[1] || ''
    const params = new URLSearchParams(s)
    const slug = params.get('buy')
    setBuySlug(slug)
    
    // Load user data if authenticated
    if (isAuthenticated && user) {
      setName(user.name || '')
      setEmail(user.email || '')
      setPhone(user.phone || '')
      setAddress(user.address?.street || '')
      setCity(user.address?.city || '')
      setState(user.address?.state || '')
      setZip(user.address?.zip || '')
      setLoyaltyPoints(user.loyalty_points || 0)
    }
    
    // Fetch available payment methods
    fetchPaymentMethods()
    
    // Fetch CSV product data
    fetchCsvProducts()
  }, [isAuthenticated, user])
  
  const fetchCsvProducts = async () => {
    try {
      const apiBase = `${window.location.protocol}//${window.location.hostname}:4000`
      const response = await fetch(`${apiBase}/api/products-csv`)
      if (response.ok) {
        const data = await response.json()
        // Create a map of slug to CSV data
        const csvMap: any = {}
        data.forEach((csvProduct: any) => {
          // Handle potential variations in column names (trim spaces)
          const normalizedProduct: any = {}
          Object.keys(csvProduct).forEach(key => {
            const normalizedKey = key.trim()
            normalizedProduct[normalizedKey] = csvProduct[key]
          })
          
          const csvSlug = normalizedProduct['Slug'] || normalizedProduct['Product Name']?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || ''
          
          if (csvSlug) {
            csvMap[csvSlug] = normalizedProduct
            // Debug: log HSN codes
            if (csvSlug === 'nefol-hair-mask') {
              console.log('🔍 Hair Mask CSV Data:', normalizedProduct)
              console.log('🔍 HSN Code:', normalizedProduct['HSN Code'])
            }
          }
        })
        console.log('📊 CSV Products Map:', csvMap)
        setCsvProducts(csvMap)
      }
    } catch (error) {
      console.error('Failed to fetch CSV products:', error)
    }
  }

  const orderItems = useMemo(() => {
    const baseItems: any[] = buySlug 
      ? items.filter(i => i.slug === buySlug)
      : items
    
    // Enrich with CSV data if available
    return baseItems.map((item: any) => {
      const csvProduct = csvProducts[item.slug]
      return {
        ...item,
        csvProduct: csvProduct || null
      }
    })
  }, [buySlug, items, csvProducts])

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch(`${window.location.protocol}//${window.location.hostname}:4000/api/payment-gateways`)
      if (response.ok) {
        const data = await response.json()
        setAvailablePaymentMethods(data.filter((gateway: any) => gateway.is_active))
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error)
    }
  }

  const applyDiscountCode = async () => {
    try {
      const response = await fetch(`${window.location.protocol}//${window.location.hostname}:4000/api/discounts/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountCode, amount: calcSubtotal })
      })
      
      if (response.ok) {
        const discount = await response.json()
        setAppliedDiscount(discount)
        setError(null)
      } else {
        setError('Invalid discount code')
      }
    } catch (error) {
      setError('Failed to apply discount code')
    }
  }

  const calcSubtotal = useMemo(() => {
    if (buySlug) return orderItems.reduce((s, i) => s + parsePrice(i.price) * (i.quantity || 1), 0)
    return subtotal
  }, [buySlug, orderItems, subtotal])

  const calculateDiscountAmount = () => {
    if (!appliedDiscount) return 0
    if (appliedDiscount.type === 'percentage') {
      return (calcSubtotal * appliedDiscount.value) / 100
    }
    return appliedDiscount.value
  }

  const calculateFinalTotal = () => {
    const discountAmount = calculateDiscountAmount()
    return Math.max(0, calcSubtotal - discountAmount)
  }

  const shipping = 0
  
  // Calculate tax based on categories
  const calculateTax = () => {
    if (buySlug) {
      // For single item checkout
      const item = orderItems[0]
      if (!item) return 0
      const itemSubtotal = parsePrice(item.price) * (item.quantity || 1)
      const category = (item.category || '').toLowerCase()
      const taxRate = category.includes('hair') ? 0.05 : 0.18
      return itemSubtotal * taxRate
    }
    return tax
  }
  
  const calculatedTax = calculateTax()
  const finalTotal = buySlug ? calcSubtotal + shipping + calculatedTax : total

  // Payment rules: <1000 prepaid/postpaid, >1000 prepaid only
  const canUsePostpaid = finalTotal < 1000
  const isCOD = selectedPayment === 'cod'

  useEffect(() => {
    if (!canUsePostpaid) {
      setPaymentType('prepaid')
    }
  }, [canUsePostpaid])

  // Helper function to enrich order items with CSV data
  const enrichOrderItems = () => {
    return orderItems.map((item: any) => {
      const csvProduct = csvProducts[item.slug] || {}
      return {
        ...item,
        csvProduct: {
          'Brand Name': csvProduct['Brand Name'],
          'SKU': csvProduct['SKU'],
          'HSN Code': csvProduct['HSN Code'],
          'Net Quantity (Content)': csvProduct['Net Quantity (Content)'],
          'Unit Count (Pack of)': csvProduct['Unit Count (Pack of)'],
          'Net Weight (Product Only)': csvProduct['Net Weight (Product Only)'],
          'Dead Weight (Packaging Only)': csvProduct['Dead Weight (Packaging Only)'],
          'GST %': csvProduct['GST %'],
          'Country of Origin': csvProduct['Country of Origin'],
          'Manufacturer / Packer / Importer': csvProduct['Manufacturer / Packer / Importer'],
          'Key Ingredients': csvProduct['Key Ingredients'],
          'Ingredient Benefits': csvProduct['Ingredient Benefits'],
          'How to Use (Steps)': csvProduct['How to Use (Steps)'],
          'Package Content Details': csvProduct['Package Content Details'],
          'Inner Packaging Type': csvProduct['Inner Packaging Type'],
          'Outer Packaging Type': csvProduct['Outer Packaging Type'],
          'Hazardous / Fragile (Y/N)': csvProduct['Hazardous / Fragile (Y/N)'],
          'Special Attributes (Badges)': csvProduct['Special Attributes (Badges)'],
          'Product Category': csvProduct['Product Category'],
          'Product Sub-Category': csvProduct['Product Sub-Category'],
          'Product Type': csvProduct['Product Type'],
          'Skin/Hair Type': csvProduct['Skin/Hair Type'],
          'MRP': csvProduct['MRP'],
          'website price': csvProduct['website price'],
          'discount': csvProduct['discount'],
          'Image Links': csvProduct['Image Links'],
          'Video Links': csvProduct['Video Links']
        }
      }
    })
  }

  // Handle Razorpay payment
  const handleRazorpayPayment = async () => {
    try {
      const orderNumber = `NEFOL-${Date.now()}`
      const enrichedItems = enrichOrderItems()
      
      const orderData = {
        order_number: orderNumber,
        customer_name: name,
        customer_email: email,
        shipping_address: { 
          address, 
          city, 
          state: state, 
          zip, 
          phone 
        },
        items: enrichedItems,
        subtotal: Number(calcSubtotal.toFixed(2)),
        shipping,
        tax: calculatedTax,
        total: Number(finalTotal.toFixed(2)),
        payment_method: 'razorpay',
        payment_type: paymentType,
        status: 'created',
        affiliate_id: affiliateId
      }

      // Create order in backend first
      await api.orders.createOrder(orderData)

      // Create Razorpay order
      const razorpayOrder = await api.payment.createRazorpayOrder({
        amount: Number(finalTotal.toFixed(2)),
        currency: 'INR',
        order_number: orderNumber,
        customer_name: name,
        customer_email: email,
        customer_phone: phone
      })

      // Initialize Razorpay checkout
      const options = {
        key: razorpayOrder.key_id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Nefol',
        description: `Order ${orderNumber}`,
        order_id: razorpayOrder.id,
        prefill: {
          name: name,
          email: email,
          contact: phone
        },
        handler: async function(response: any) {
          try {
            // Verify payment
            await api.payment.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_number: orderNumber
            })

            if (clear) clear()
            window.location.hash = `#/user/confirmation?order=${encodeURIComponent(orderNumber)}`
          } catch (err: any) {
            setError('Payment verification failed: ' + err.message)
          }
        },
        modal: {
          ondismiss: function() {
            setLoading(false)
          }
        }
      }

      const rzp = (window as any).Razorpay(options)
      rzp.open()

    } catch (err: any) {
      setError(err?.message || 'Payment initiation failed')
      setLoading(false)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Handle Razorpay payment
      if (selectedPayment === 'razorpay') {
        await handleRazorpayPayment()
        return
      }

      // Handle other payment methods (COD, etc.)
      const orderNumber = `NEFOL-${Date.now()}`
      
      if (affiliateId) {
        console.log('🎯 Processing order with affiliate ID:', affiliateId)
      }
      
      const enrichedItems = enrichOrderItems()
      
      const orderData = {
        order_number: orderNumber,
        customer_name: name,
        customer_email: email,
        shipping_address: { 
          address, 
          city, 
          state: state, 
          zip, 
          phone 
        },
        items: enrichedItems,
        subtotal: Number(calcSubtotal.toFixed(2)),
        shipping,
        tax: calculatedTax,
        total: Number(finalTotal.toFixed(2)),
        payment_method: selectedPayment,
        payment_type: isCOD ? 'cod' : paymentType,
        status: 'created',
        affiliate_id: affiliateId
      }
      
      const data = await api.orders.createOrder(orderData)
      if (clear) clear()
      window.location.hash = `#/user/confirmation?order=${encodeURIComponent(data.order_number || orderNumber)}`
    } catch (err: any) {
      setError(err?.message || 'Order failed')
    } finally {
      setLoading(false)
    }
  }

  if (!orderItems.length) {
    return (
      <AuthGuard>
        <main className="py-10 dark:bg-slate-900">
          <div className="mx-auto max-w-3xl px-4">
            <h1 className="text-2xl font-bold dark:text-slate-100">Checkout</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Your cart is empty.</p>
          </div>
        </main>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
    <main className="py-10 dark:bg-slate-900">
      <div className="mx-auto max-w-5xl px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <form onSubmit={submit} className="md:col-span-2 space-y-6">
          {/* Shipping Information */}
          <div>
            <h1 className="text-2xl font-bold dark:text-slate-100 mb-4">Shipping Information</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="rounded border border-slate-300 px-3 py-2 dark:bg-slate-800 dark:border-slate-600" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} required />
              <input type="email" className="rounded border border-slate-300 px-3 py-2 dark:bg-slate-800 dark:border-slate-600" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
            </div>
            <input type="tel" className="w-full rounded border border-slate-300 px-3 py-2 dark:bg-slate-800 dark:border-slate-600 mt-3" placeholder="Phone Number" value={phone} onChange={e=>setPhone(e.target.value)} required />
            <input className="w-full rounded border border-slate-300 px-3 py-2 dark:bg-slate-800 dark:border-slate-600 mt-3" placeholder="Address" value={address} onChange={e=>setAddress(e.target.value)} required />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              <input className="rounded border border-slate-300 px-3 py-2 dark:bg-slate-800 dark:border-slate-600" placeholder="City" value={city} onChange={e=>setCity(e.target.value)} required />
              <input className="rounded border border-slate-300 px-3 py-2 dark:bg-slate-800 dark:border-slate-600" placeholder="State" value={state} onChange={e=>setState(e.target.value)} required />
              <input className="rounded border border-slate-300 px-3 py-2 dark:bg-slate-800 dark:border-slate-600" placeholder="ZIP" value={zip} onChange={e=>setZip(e.target.value)} required />
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <h2 className="text-xl font-bold dark:text-slate-100 mb-4">Payment Method</h2>
            
            {/* Payment Type Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Payment Type
              </label>
              {isCOD ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    💰 Cash on Delivery - Pay when your order arrives
                  </p>
                </div>
              ) : (
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentType"
                      value="prepaid"
                      checked={paymentType === 'prepaid'}
                      onChange={(e) => setPaymentType(e.target.value as 'prepaid' | 'postpaid')}
                      className="mr-2"
                    />
                    <span className="text-slate-700 dark:text-slate-300">Prepaid</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentType"
                      value="postpaid"
                      checked={paymentType === 'postpaid'}
                      onChange={(e) => setPaymentType(e.target.value as 'prepaid' | 'postpaid')}
                      disabled={!canUsePostpaid}
                      className="mr-2"
                    />
                    <span className={`${!canUsePostpaid ? 'text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      Postpaid {!canUsePostpaid && '(Orders above ₹1000 require prepaid)'}
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Payment Gateway Selection */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {paymentMethods.map((method) => {
                const IconComponent = method.icon
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setSelectedPayment(method.id)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedPayment === method.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-300 dark:border-slate-600 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-8 h-8 rounded-full ${method.color} flex items-center justify-center`}>
                        <IconComponent className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {method.name}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {error && <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{error}</div>}
          
          <button 
            disabled={loading} 
            className="w-full rounded bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Processing Order...' : 
             isCOD ? `Place Order (COD) - ₹${finalTotal.toFixed(2)}` : 
             `Pay ₹${finalTotal.toFixed(2)} with ${paymentMethods.find(m => m.id === selectedPayment)?.name}`}
          </button>
        </form>
        <aside>
          <h2 className="text-xl font-semibold mb-3 dark:text-slate-100">Order Summary</h2>
          <div className="space-y-3">
            {orderItems.map((i: any) => (
              <div key={i.slug} className="flex justify-between text-sm">
                <div>
                  <span className="dark:text-slate-300">{i.title} × {i.quantity}</span>
                  <div className="text-xs">
                    <PricingDisplay 
                      product={i} 
                      csvProduct={i.csvProduct}
                      className="text-xs"
                    />
                  </div>
                </div>
                <span className="dark:text-slate-100">₹{(parsePrice(i.price) * i.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">Subtotal</span><span className="dark:text-slate-100">₹{calcSubtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">Shipping</span><span className="dark:text-slate-100">₹{shipping.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">GST ({buySlug ? (orderItems[0]?.category?.toLowerCase().includes('hair') ? '5%' : '18%') : 'Mixed'})</span><span className="dark:text-slate-100">₹{calculatedTax.toFixed(2)}</span></div>
              <div className="flex justify-between font-semibold"><span className="dark:text-slate-100">Total</span><span className="dark:text-slate-100">₹{finalTotal.toFixed(2)}</span></div>
            </div>
          </div>
        </aside>
      </div>
    </main>
    </AuthGuard>
  )
}


