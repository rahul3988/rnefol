// API Service for connecting frontend with backend
const API_BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000`

class ApiService {
  private baseURL: string

  constructor() {
    this.baseURL = API_BASE_URL
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error)
      throw error
    }
  }

  // Loyalty Program APIs
  async getLoyaltyPrograms() {
    return this.request('/api/loyalty-program')
  }

  async createLoyaltyProgram(data: any) {
    return this.request('/api/loyalty-program', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Affiliate Program APIs
  async getAffiliatePrograms() {
    return this.request('/api/affiliate-program')
  }

  async createAffiliateProgram(data: any) {
    return this.request('/api/affiliate-program', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Cashback System APIs
  async getCashbackSystems() {
    return this.request('/api/cashback-system')
  }

  async createCashbackSystem(data: any) {
    return this.request('/api/cashback-system', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Email Marketing APIs
  async getEmailCampaigns() {
    return this.request('/api/email-marketing')
  }

  async createEmailCampaign(data: any) {
    return this.request('/api/email-marketing', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // SMS Marketing APIs
  async getSMSCampaigns() {
    return this.request('/api/sms-marketing')
  }

  async createSMSCampaign(data: any) {
    return this.request('/api/sms-marketing', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Push Notifications APIs
  async getPushNotifications() {
    return this.request('/api/push-notifications')
  }

  async createPushNotification(data: any) {
    return this.request('/api/push-notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // WhatsApp Chat APIs
  async getWhatsAppChats() {
    return this.request('/api/whatsapp-chat')
  }

  async createWhatsAppChat(data: any) {
    return this.request('/api/whatsapp-chat', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Live Chat APIs
  async getLiveChats() {
    return this.request('/api/live-chat')
  }

  async createLiveChat(data: any) {
    return this.request('/api/live-chat', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Advanced Analytics APIs
  async getAnalyticsData() {
    return this.request('/api/advanced-analytics')
  }

  // Form Builder APIs
  async getForms() {
    return this.request('/api/form-builder')
  }

  async createForm(data: any) {
    return this.request('/api/form-builder', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Workflow Automation APIs
  async getWorkflows() {
    return this.request('/api/workflow-automation')
  }

  async createWorkflow(data: any) {
    return this.request('/api/workflow-automation', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Customer Segmentation APIs
  async getCustomerSegments() {
    return this.request('/api/customer-segmentation')
  }

  async createCustomerSegment(data: any) {
    return this.request('/api/customer-segmentation', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Journey Tracking APIs
  async getCustomerJourneys() {
    return this.request('/api/journey-tracking')
  }

  // Actionable Analytics APIs
  async getActionableInsights() {
    return this.request('/api/actionable-analytics')
  }

  // AI Box APIs
  async getAIFeatures() {
    return this.request('/api/ai-box')
  }

  // Journey Funnel APIs
  async getJourneyFunnels() {
    return this.request('/api/journey-funnel')
  }

  // AI Personalization APIs
  async getPersonalizationRules() {
    return this.request('/api/ai-personalization')
  }

  // Custom Audience APIs
  async getCustomAudiences() {
    return this.request('/api/custom-audience')
  }

  // Omni Channel APIs
  async getOmniChannelCampaigns() {
    return this.request('/api/omni-channel')
  }

  // API Manager APIs
  async getAPIConfigurations() {
    return this.request('/api/api-manager')
  }

  async createAPIConfiguration(data: any) {
    return this.request('/api/api-manager', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Products APIs (existing)
  async getProducts() {
    return this.request('/api/products')
  }

  async createProduct(data: any) {
    return this.request('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }


  // Customers APIs (existing)
  async getCustomers() {
    return this.request('/api/customers')
  }

  // Analytics APIs (existing)
  async getAnalytics() {
    return this.request('/api/analytics')
  }

  // Payment gateways APIs
  async getPaymentGateways() {
    return this.request('/api/payment-gateways')
  }

  async createPaymentGateway(data: any) {
    return this.request('/api/payment-gateways', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updatePaymentGateway(id: number, data: any) {
    return this.request(`/api/payment-gateways/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deletePaymentGateway(id: number) {
    return this.request(`/api/payment-gateways/${id}`, {
      method: 'DELETE',
    })
  }

  // Order delivery APIs
  async getOrderDelivery(orderId: string) {
    return this.request(`/api/order-delivery/${orderId}`)
  }

  async updateOrderDelivery(data: any) {
    return this.request('/api/order-delivery', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Product reviews APIs
  async getProductReviews(productId: number) {
    return this.request(`/api/product-reviews/${productId}`)
  }

  async createProductReview(data: any) {
    return this.request('/api/product-reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateProductReview(reviewId: number, data: any) {
    return this.request(`/api/product-reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Shiprocket APIs
  async getShiprocketConfig() {
    return this.request('/api/shiprocket-config')
  }

  async updateShiprocketConfig(data: any) {
    return this.request('/api/shiprocket-config', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async createShipment(data: any) {
    return this.request('/api/shiprocket-shipment', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getShipmentTracking(orderId: string) {
    return this.request(`/api/shipment-tracking/${orderId}`)
  }

  // Discounts APIs
  async getDiscounts() {
    return this.request('/api/discounts')
  }

  async createDiscount(data: any) {
    return this.request('/api/discounts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getDiscountUsage() {
    return this.request('/api/discounts/usage')
  }

  // Orders APIs (updated)
  async getOrders() {
    return this.request('/api/orders')
  }

  async createOrder(data: any) {
    return this.request('/api/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateOrder(orderId: string, data: any) {
    return this.request(`/api/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }
}

// Create and export a singleton instance
export const apiService = new ApiService()
export default apiService
