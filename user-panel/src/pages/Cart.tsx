import React from 'react'
import { useCart } from '../contexts/CartContext'
import { parsePrice } from '../contexts/CartContext'
import PricingDisplay from '../components/PricingDisplay'

export default function Cart() {
  const { items, removeItem, updateQuantity, clear, subtotal, tax, total, loading, error } = useCart()

  // Debug: Log cart items to see image data
  console.log('Cart items:', items)

  const handleQuantityChange = async (cartItemId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      await removeItem(cartItemId)
    } else {
      await updateQuantity(cartItemId, newQuantity)
    }
  }

  const handleRemoveItem = async (cartItemId: number) => {
    if (window.confirm('Are you sure you want to remove this item from your cart?')) {
      await removeItem(cartItemId)
    }
  }

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your entire cart?')) {
      await clear()
    }
  }

  const formatPrice = (price: string) => {
    const numericPrice = parsePrice(price)
    return `₹${numericPrice.toLocaleString()}`
  }

  const calculateItemTax = (price: string, quantity: number, category?: string) => {
    const itemSubtotal = parsePrice(price) * quantity
    const categoryLower = (category || '').toLowerCase()
    const taxRate = categoryLower.includes('hair') ? 0.05 : 0.18
    return `₹${(itemSubtotal * taxRate).toLocaleString()}`
  }

  const getTaxRateText = (category?: string) => {
    const categoryLower = (category || '').toLowerCase()
    return categoryLower.includes('hair') ? '5%' : '18%'
  }

  const calculateItemTotal = (price: string, quantity: number) => {
    const numericPrice = parsePrice(price)
    return `₹${(numericPrice * quantity).toLocaleString()}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gradient-primary mb-2">Shopping Cart</h1>
          <p className="text-slate-600">Review your items and proceed to checkout</p>
        </div>

        {items.length === 0 ? (
          /* Empty Cart */
          <div className="text-center py-16">
            <div className="mb-6">
              <img 
                src="/IMAGES/BANNER (2).jpg" 
                alt="Empty Cart" 
                className="w-32 h-32 mx-auto rounded-lg object-cover shadow-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  target.nextElementSibling?.classList.remove('hidden')
                }}
              />
              <div className="hidden w-32 h-32 mx-auto bg-slate-100 rounded-lg shadow-lg flex items-center justify-center">
                <span className="text-6xl">🛒</span>
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-slate-700 mb-4">Your cart is empty</h2>
            <p className="text-slate-500 mb-8">Looks like you haven't added any items to your cart yet.</p>
            <a 
              href="#/shop" 
              className="inline-block bg-gradient-primary text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              Start Shopping
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-slate-800">
                    Cart Items ({items.length})
                  </h2>
                  <button
                    onClick={handleClearCart}
                    className="text-red-500 hover:text-red-700 font-medium text-sm hover:underline"
                  >
                    Clear Cart
                  </button>
                </div>

                <div className="space-y-4">
                  {loading && (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-slate-600">Loading cart...</p>
                    </div>
                  )}
                  
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <p className="text-red-600">Error: {error}</p>
                    </div>
                  )}
                  
                  {items.map((item) => (
                    <div key={item.id || `${item.slug}-${item.product_id}`} className="flex items-center space-x-4 p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <div className="relative">
                          <img
                            src={item.image || '/IMAGES/BANNER (1).jpg'}
                            alt={item.title}
                            className="w-24 h-24 object-cover rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                            onError={(e) => {
                              // Fallback to a default image if the main image fails to load
                              const target = e.target as HTMLImageElement
                              console.log('Image failed to load:', target.src)
                              if (!target.src.includes('/IMAGES/BANNER (1).jpg')) {
                                target.src = '/IMAGES/BANNER (1).jpg'
                              } else if (!target.src.includes('/IMAGES/face.jpg')) {
                                target.src = '/IMAGES/face.jpg'
                              } else if (!target.src.includes('/IMAGES/body.jpg')) {
                                target.src = '/IMAGES/body.jpg'
                              } else {
                                // If even the fallback fails, show a placeholder
                                target.style.display = 'none'
                                const placeholder = target.nextElementSibling as HTMLElement
                                if (placeholder) placeholder.classList.remove('hidden')
                              }
                            }}
                          />
                          {/* Placeholder for when image fails to load */}
                          <div className="hidden w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg border border-slate-200 flex items-center justify-center shadow-sm">
                            <span className="text-3xl">📦</span>
                          </div>
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-slate-800 truncate">
                          {item.title}
                        </h3>
                        <p className="text-slate-600 text-sm">
                          <PricingDisplay 
                            product={item} 
                            csvProduct={item.csvProduct}
                            className="text-sm"
                          />
                        </p>
                        <p className="text-slate-600 text-sm">
                          Total: {calculateItemTotal(item.price, item.quantity)}
                        </p>
                        <p className="text-slate-600 text-sm">
                          Tax ({getTaxRateText(item.category)}): {calculateItemTax(item.price, item.quantity, item.category)}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleQuantityChange(item.id || item.product_id, item.quantity - 1)}
                          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-800 transition-colors"
                          disabled={item.quantity <= 1}
                        >
                          −
                        </button>
                        <span className="w-12 text-center font-semibold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.id || item.product_id, item.quantity + 1)}
                          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-800 transition-colors"
                        >
                          +
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(item.id || item.product_id)}
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove item"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
                <h2 className="text-xl font-semibold text-slate-800 mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal ({items.length} items)</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  {/* Show tax breakdown by category */}
                  {items.some(item => (item.category || '').toLowerCase().includes('hair')) && (
                    <div className="flex justify-between text-slate-600">
                      <span>GST (5% - Hair Products)</span>
                      <span>₹{items.reduce((sum, item) => {
                        const category = (item.category || '').toLowerCase()
                        if (category.includes('hair')) {
                          return sum + (parsePrice(item.price) * item.quantity * 0.05)
                        }
                        return sum
                      }, 0).toLocaleString()}</span>
                    </div>
                  )}
                  {items.some(item => !(item.category || '').toLowerCase().includes('hair')) && (
                    <div className="flex justify-between text-slate-600">
                      <span>GST (18% - Other Products)</span>
                      <span>₹{items.reduce((sum, item) => {
                        const category = (item.category || '').toLowerCase()
                        if (!category.includes('hair')) {
                          return sum + (parsePrice(item.price) * item.quantity * 0.18)
                        }
                        return sum
                      }, 0).toLocaleString()}</span>
                    </div>
                  )}
                  <hr className="border-slate-200" />
                  <div className="flex justify-between text-lg font-semibold text-slate-800">
                    <span>Total</span>
                    <span>₹{total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <a
                    href="#/checkout"
                    className="block w-full bg-gradient-primary text-white py-3 px-4 rounded-lg font-semibold text-center hover:shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    Proceed to Checkout
                  </a>
                  <a
                    href="#/shop"
                    className="block w-full border border-slate-300 text-slate-700 py-3 px-4 rounded-lg font-semibold text-center hover:bg-slate-50 transition-colors"
                  >
                    Continue Shopping
                  </a>
                </div>

                {/* Security Badge */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="flex items-center justify-center space-x-2 text-slate-500 text-sm">
                    <span>🔒</span>
                    <span>Secure Checkout</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
