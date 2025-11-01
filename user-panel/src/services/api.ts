/**
 * Comprehensive API Service Layer for NEFOL User Panel
 * This service handles all backend communication with proper error handling,
 * authentication, and data transformation.
 */

import { getApiBase } from '../utils/apiBase'

// Types
export interface User {
  id: number
  name: string
  email: string
  phone: string
  address: {
    street: string
    city: string
    state: string
    zip: string
  }
  profile_photo?: string
  loyalty_points: number
  total_orders: number
  member_since: string
  is_verified: boolean
}

export interface Product {
  id: number
  slug: string
  title: string
  category: string
  price: string
  list_image: string
  description: string
  details: any
  created_at: string
  updated_at: string
}

export interface Order {
  id: number
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

export interface Review {
  id: number
  order_id: string
  product_id: number
  customer_email: string
  customer_name: string
  rating: number
  title: string
  review_text: string
  images: any[]
  is_verified: boolean
  is_featured: boolean
  points_awarded: number
  status: string
  created_at: string
}

export interface Discount {
  id: number
  name: string
  code: string
  type: 'percentage' | 'fixed' | 'free_shipping'
  value: number
  min_amount: number
  max_amount: number
  usage_limit: number
  valid_from: string
  valid_until: string
  is_active: boolean
}

// API Configuration
const API_BASE = getApiBase()

// Utility functions
const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`)
  }
  return response.json()
}

// Authentication API
export const authAPI = {
  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    return handleResponse(response)
  },

  async signup(userData: {
    name: string
    email: string
    password: string
    phone: string
    address: any
  }) {
    const response = await fetch(`${API_BASE}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })
    return handleResponse(response)
  },

  async logout() {
    // Clear local storage
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}

// User Profile API
export const userAPI = {
  async getProfile(): Promise<User> {
    const response = await fetch(`${API_BASE}/api/users/profile`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await fetch(`${API_BASE}/api/users/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  async getSavedCards() {
    const response = await fetch(`${API_BASE}/api/users/saved-cards`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  }
}

// Products API
export const productsAPI = {
  async getAll(): Promise<Product[]> {
    const response = await fetch(`${API_BASE}/api/products`)
    return handleResponse(response)
  },

  async getBySlug(slug: string): Promise<Product> {
    const response = await fetch(`${API_BASE}/api/products/slug/${slug}`)
    return handleResponse(response)
  },

  async getById(id: number): Promise<Product> {
    const response = await fetch(`${API_BASE}/api/products/${id}`)
    return handleResponse(response)
  },

  async getByCategory(category: string): Promise<Product[]> {
    const response = await fetch(`${API_BASE}/api/products/category/${category}`)
    return handleResponse(response)
  },

  async search(query: string): Promise<Product[]> {
    const response = await fetch(`${API_BASE}/api/products/search?q=${encodeURIComponent(query)}`)
    return handleResponse(response)
  }
}

// Cart API (Backend Integration)
export const cartAPI = {
  async getCart() {
    const response = await fetch(`${API_BASE}/api/cart`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  async addToCart(productId: number, quantity: number = 1) {
    console.log('🌐 API: Adding to cart', { productId, quantity, headers: getAuthHeaders() })
    const response = await fetch(`${API_BASE}/api/cart`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ product_id: productId, quantity })
    })
    console.log('🌐 API: Cart response status:', response.status)
    return handleResponse(response)
  },

  async updateCartItem(cartItemId: number, quantity: number) {
    const response = await fetch(`${API_BASE}/api/cart/${cartItemId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ quantity })
    })
    return handleResponse(response)
  },

  async removeFromCart(cartItemId: number) {
    const response = await fetch(`${API_BASE}/api/cart/${cartItemId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  async clearCart() {
    const response = await fetch(`${API_BASE}/api/cart`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  }
}

// Wishlist API
export const wishlistAPI = {
  async getWishlist() {
    const response = await fetch(`${API_BASE}/api/wishlist`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  async addToWishlist(productId: number) {
    const response = await fetch(`${API_BASE}/api/wishlist`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ product_id: productId })
    })
    return handleResponse(response)
  },

  async removeFromWishlist(productId: number) {
    const response = await fetch(`${API_BASE}/api/wishlist/${productId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  }
}

// Orders API
export const ordersAPI = {
  async getAll(): Promise<Order[]> {
    const response = await fetch(`${API_BASE}/api/orders`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  async getById(orderId: string): Promise<Order> {
    const response = await fetch(`${API_BASE}/api/orders/${orderId}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  async createOrder(orderData: {
    order_number: string
    customer_name: string
    customer_email: string
    shipping_address: any
    items: any[]
    subtotal: number
    shipping: number
    tax: number
    total: number
    payment_method: string
    payment_type: string
    status: string
  }) {
    const response = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(orderData)
    })
    return handleResponse(response)
  },

  async updateOrderStatus(orderId: string, status: string, additionalData?: any) {
    const response = await fetch(`${API_BASE}/api/orders/${orderId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, ...additionalData })
    })
    return handleResponse(response)
  }
}

// Reviews API
export const reviewsAPI = {
  async getProductReviews(productId: number): Promise<Review[]> {
    const response = await fetch(`${API_BASE}/api/product-reviews/${productId}`)
    return handleResponse(response)
  },

  async createReview(reviewData: {
    order_id: string
    product_id: number
    customer_email: string
    customer_name: string
    rating: number
    title: string
    review_text: string
    images?: any[]
  }) {
    const response = await fetch(`${API_BASE}/api/product-reviews`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(reviewData)
    })
    return handleResponse(response)
  },

  async createProductReview(reviewData: {
    order_id: string
    product_id: number
    customer_email: string
    customer_name: string
    rating: number
    title: string
    review_text: string
    images?: any[]
  }) {
    return this.createReview(reviewData)
  },

  async updateReviewStatus(reviewId: number, status: string) {
    const response = await fetch(`${API_BASE}/api/product-reviews/${reviewId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    })
    return handleResponse(response)
  }
}

// Discounts API
export const discountsAPI = {
  async getAll(): Promise<Discount[]> {
    const response = await fetch(`${API_BASE}/api/discounts`)
    return handleResponse(response)
  },

  async applyDiscount(code: string, amount: number) {
    const response = await fetch(`${API_BASE}/api/discounts/apply`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ code, amount })
    })
    return handleResponse(response)
  }
}

// Payment API
export const paymentAPI = {
  async getPaymentGateways() {
    const response = await fetch(`${API_BASE}/api/payment/gateways`)
    return handleResponse(response)
  },

  async createPaymentGateway(gatewayData: any) {
    const response = await fetch(`${API_BASE}/api/payment/gateways`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(gatewayData)
    })
    return handleResponse(response)
  },

  // Razorpay APIs
  async createRazorpayOrder(orderData: {
    amount: number
    currency?: string
    order_number: string
    customer_name: string
    customer_email: string
    customer_phone: string
  }) {
    const response = await fetch(`${API_BASE}/api/payment/razorpay/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    })
    return handleResponse(response)
  },

  async verifyRazorpayPayment(paymentData: {
    razorpay_order_id: string
    razorpay_payment_id: string
    razorpay_signature: string
    order_number: string
  }) {
    const response = await fetch(`${API_BASE}/api/payment/razorpay/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    })
    return handleResponse(response)
  }
}

// Analytics API
export const analyticsAPI = {
  async getPersonalizedContent() {
    const response = await fetch(`${API_BASE}/api/ai-personalization/content`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  async getCashbackBalance() {
    const response = await fetch(`${API_BASE}/api/cashback/balance`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  }
}

// Videos API
export const videosAPI = {
  async getAll() {
    const response = await fetch(`${API_BASE}/api/videos`)
    return handleResponse(response)
  },

  async getById(id: number) {
    const response = await fetch(`${API_BASE}/api/videos/${id}`)
    return handleResponse(response)
  }
}

// Live Chat API
export const liveChatAPI = {
  async createSession(data: { userId?: string | number, customerName?: string, customerEmail?: string, customerPhone?: string }) {
    const response = await fetch(`${API_BASE}/api/live-chat/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  async getMessages(sessionId: number | string) {
    const params = new URLSearchParams({ sessionId: String(sessionId) }).toString()
    const response = await fetch(`${API_BASE}/api/live-chat/messages?${params}`)
    return handleResponse(response)
  },

  async sendMessage(data: { sessionId: number | string, sender: 'customer' | 'agent', senderName?: string, message: string, type?: string }) {
    const response = await fetch(`${API_BASE}/api/live-chat/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  }
}

// Recommendations API
export const recommendationsAPI = {
  async trackProductView(productId: number | string, data?: { viewDuration?: number, source?: string }) {
    const response = await fetch(`${API_BASE}/api/products/${productId}/view`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data || {})
    })
    return handleResponse(response)
  },

  async getRecentlyViewed(limit: number = 10) {
    const response = await fetch(`${API_BASE}/api/recommendations/recently-viewed?limit=${limit}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  async getRelatedProducts(productId: number | string, limit: number = 8) {
    const response = await fetch(`${API_BASE}/api/recommendations/related/${productId}?limit=${limit}`)
    return handleResponse(response)
  },

  async getRecommendations(type: string = 'based_on_browsing', limit: number = 8) {
    const response = await fetch(`${API_BASE}/api/recommendations?type=${type}&limit=${limit}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  async trackSearch(query: string, resultsCount: number = 0) {
    const response = await fetch(`${API_BASE}/api/search/track`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ query, resultsCount })
    })
    return handleResponse(response)
  },

  async getPopularSearches(limit: number = 10) {
    const response = await fetch(`${API_BASE}/api/search/popular?limit=${limit}`)
    return handleResponse(response)
  }
}

// WhatsApp Subscription API
export const whatsappAPI = {
  async subscribe(phone: string, name?: string, source?: string) {
    const response = await fetch(`${API_BASE}/api/whatsapp/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, name, source })
    })
    return handleResponse(response)
  },

  async unsubscribe(phone: string) {
    const response = await fetch(`${API_BASE}/api/whatsapp/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    })
    return handleResponse(response)
  }
}

// Newsletter API (deprecated - kept for backward compatibility)
export const newsletterAPI = {
  async subscribe(email: string, name?: string, source?: string) {
    const response = await fetch(`${API_BASE}/api/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, source })
    })
    return handleResponse(response)
  },

  async unsubscribe(email: string, token?: string) {
    const response = await fetch(`${API_BASE}/api/newsletter/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token })
    })
    return handleResponse(response)
  }
}

// Export all APIs
export const api = {
  auth: authAPI,
  user: userAPI,
  products: productsAPI,
  cart: cartAPI,
  wishlist: wishlistAPI,
  orders: ordersAPI,
  reviews: reviewsAPI,
  discounts: discountsAPI,
  payment: paymentAPI,
  analytics: analyticsAPI,
  videos: videosAPI,
  liveChat: liveChatAPI,
  recommendations: recommendationsAPI,
  whatsapp: whatsappAPI,
  newsletter: newsletterAPI
}

export default api
