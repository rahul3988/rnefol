// API Service for connecting frontend with backend
const API_BASE_URL = import.meta.env.VITE_API_URL || `http://192.168.1.66:4000`

class ApiService {
  private baseURL: string

  constructor() {
    this.baseURL = API_BASE_URL
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    // Get auth token from localStorage
    const token = localStorage.getItem('auth_token')
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
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

  async getCashbackWallet() {
    return this.request('/api/cashback/wallet')
  }

  async getCashbackOffers() {
    return this.request('/api/cashback/offers')
  }

  async getCashbackTransactions() {
    return this.request('/api/cashback/transactions')
  }

  async redeemCashback(data: any) {
    return this.request('/api/cashback/redeem', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Email Marketing APIs
  async getEmailCampaigns() {
    return this.request('/api/email-marketing/campaigns')
  }

  async createEmailCampaign(data: any) {
    return this.request('/api/email-marketing/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateEmailCampaign(id: string, data: any) {
    return this.request(`/api/email-marketing/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteEmailCampaign(id: string) {
    return this.request(`/api/email-marketing/campaigns/${id}`, {
      method: 'DELETE',
    })
  }

  async getEmailTemplates() {
    return this.request('/api/email-marketing/templates')
  }

  async getEmailAutomations() {
    return this.request('/api/email-marketing/automations')
  }

  async createEmailAutomation(data: any) {
    return this.request('/api/email-marketing/automations', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateEmailAutomation(id: string, data: any) {
    return this.request(`/api/email-marketing/automations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // SMS Marketing APIs
  async getSMSCampaigns() {
    return this.request('/api/sms-marketing/campaigns')
  }

  async createSMSCampaign(data: any) {
    return this.request('/api/sms-marketing/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateSMSCampaign(id: string, data: any) {
    return this.request(`/api/sms-marketing/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteSMSCampaign(id: string) {
    return this.request(`/api/sms-marketing/campaigns/${id}`, {
      method: 'DELETE',
    })
  }

  async getSMSTemplates() {
    return this.request('/api/sms-marketing/templates')
  }

  async getSMSAutomations() {
    return this.request('/api/sms-marketing/automations')
  }

  async createSMSAutomation(data: any) {
    return this.request('/api/sms-marketing/automations', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateSMSAutomation(id: string, data: any) {
    return this.request(`/api/sms-marketing/automations/${id}`, {
      method: 'PUT',
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

  async getPushTemplates() {
    return this.request('/api/push-notifications/templates')
  }

  async getPushAutomations() {
    return this.request('/api/push-notifications/automations')
  }

  // WhatsApp Chat APIs
  async getWhatsAppChats() {
    return this.request('/api/whatsapp-chat/sessions')
  }

  async getWhatsAppTemplates() {
    return this.request('/api/whatsapp-chat/templates')
  }

  async getWhatsAppAutomations() {
    return this.request('/api/whatsapp-chat/automations')
  }

  // Live Chat APIs
  async getLiveChatSessions() {
    return this.request('/api/live-chat/sessions')
  }

  async getLiveChatAgents() {
    return this.request('/api/live-chat/agents')
  }

  async getLiveChatWidgets() {
    return this.request('/api/live-chat/widgets')
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

  // Journey Tracking APIs
  async getCustomerJourneys() {
    return this.request('/api/journey-tracking')
  }

  // Actionable Analytics APIs
  async getActionableInsights() {
    return this.request('/api/actionable_insights')
  }

  // AI Box APIs
  async getAIFeatures() {
    return this.request('/api/ai/features')
  }

  async getAITasks() {
    return this.request('/api/ai/tasks')
  }

  // Journey Funnel APIs
  async getJourneyFunnels() {
    return this.request('/api/journey_funnels')
  }

  // AI Personalization APIs
  async getPersonalizationRules() {
    return this.request('/api/personalization_rules')
  }

  // Customer Segmentation APIs
  async getCustomerSegments() {
    return this.request('/api/customer_segments')
  }

  async createCustomerSegment(data: any) {
    return this.request('/api/customer_segments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Custom Audience APIs
  async getCustomAudiences() {
    return this.request('/api/custom_audiences')
  }

  async createCustomAudience(data: any) {
    return this.request('/api/custom_audiences', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Workflow Automation APIs
  async getWorkflows() {
    return this.request('/api/workflows')
  }

  async createWorkflow(data: any) {
    return this.request('/api/workflows', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateWorkflow(id: string, data: any) {
    return this.request(`/api/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteWorkflow(id: string) {
    return this.request(`/api/workflows/${id}`, {
      method: 'DELETE',
    })
  }

  // Omni Channel APIs
  async getOmniChannelCampaigns() {
    return this.request('/api/omni_channel_campaigns')
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

  // Contact Messages APIs
  async getContactMessages() {
    return this.request('/api/contact/messages')
  }

  async updateContactMessageStatus(id: number, status: string) {
    return this.request(`/api/contact/messages/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
  }

  // Admin Notifications APIs
  async getAdminNotifications(status: string = 'all', limit: number = 50) {
    return this.request(`/api/admin/notifications?status=${status}&limit=${limit}`)
  }

  async getAdminNotificationUnreadCount() {
    return this.request('/api/admin/notifications/unread-count')
  }

  async markNotificationAsRead(id: number) {
    return this.request(`/api/admin/notifications/${id}/read`, {
      method: 'PUT',
    })
  }

  async markAllNotificationsAsRead() {
    return this.request('/api/admin/notifications/read-all', {
      method: 'PUT',
    })
  }

  async deleteNotification(id: number) {
    return this.request(`/api/admin/notifications/${id}`, {
      method: 'DELETE',
    })
  }
}

// Create and export a singleton instance
export const apiService = new ApiService()
export default apiService
