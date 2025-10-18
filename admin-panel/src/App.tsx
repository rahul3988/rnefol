import React, { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './layouts/Layout'
import { AuthProvider } from './contexts/AuthContext'
import { socketService } from './services/socket'
import { 
  Dashboard, Orders, Customers, Users, Categories, Settings, Products,
  Analytics, Marketing, Discounts, FacebookInstagram, OnlineStore, GoogleYouTube, Forms,
  Invoice, Tax, Returns, Payment
} from './pages'
import Shipments from './pages/sales/Shipments'
import LoginPage from './pages/Login'
import CMS from './pages/CMS'

// Import all the new components
import LoyaltyProgram from './components/LoyaltyProgram'
import AffiliateMarketing from './components/AffiliateMarketing'
import CashbackSystem from './components/CashbackSystem'
import EmailMarketing from './components/EmailMarketing'
import SMSMarketing from './components/SMSMarketing'
import WebPushNotifications from './components/WebPushNotifications'
import WhatsAppChat from './components/WhatsAppChat'
import LiveChat from './components/LiveChat'
import AdvancedAnalytics from './components/AdvancedAnalytics'
import FormBuilder from './components/FormBuilder'
import WorkflowAutomation from './components/WorkflowAutomation'
import CustomerSegmentation from './components/CustomerSegmentation'
import CustomerJourneyTracking from './components/CustomerJourneyTracking'
import ActionableAnalytics from './components/ActionableAnalytics'
import AIBox from './components/AIBox'
import JourneyFunnel from './components/JourneyFunnel'
import AIPersonalization from './components/AIPersonalization'
import CustomAudience from './components/CustomAudience'
import OmniChannel from './components/OmniChannel'
import APICodeManager from './components/APICodeManager'
import PaymentOptions from './components/PaymentOptions'
import VideoManager from './components/VideoManager'

export default function App() {
  useEffect(() => {
    console.log('🔌 Initializing admin socket connection...')
    // Initialize Socket.IO connection for real-time updates
    socketService.connect()
    
    // Subscribe to order updates
    socketService.subscribe('order_created', (data: any) => {
      console.log('✅ New order created:', data)
      // You can add notification logic here
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Order!', {
          body: `Order #${data.order_number || 'N/A'} received`,
          icon: '/favicon.ico'
        })
      }
    })
    
    socketService.subscribe('order_updated', (data: any) => {
      console.log('🔄 Order updated:', data)
      // You can add notification logic here
    })
    
    socketService.subscribe('orders_created', (data: any) => {
      console.log('✅ Order created:', data)
    })
    
    socketService.subscribe('orders_updated', (data: any) => {
      console.log('🔄 Order updated:', data)
    })
    
    socketService.subscribe('user_profile_updated', (data: any) => {
      console.log('👤 User profile updated:', data)
      // You can add notification logic here
    })
    
    socketService.subscribe('users_created', (data: any) => {
      console.log('👤 New user registered:', data)
    })
    
    socketService.subscribe('products_created', (data: any) => {
      console.log('🛍️ Product created:', data)
    })
    
    socketService.subscribe('products_updated', (data: any) => {
      console.log('🛍️ Product updated:', data)
    })
    
    socketService.subscribe('products_deleted', (data: any) => {
      console.log('🗑️ Product deleted:', data)
    })
    
    socketService.subscribe('delivery_status_updated', (data: any) => {
      console.log('🚚 Delivery status updated:', data)
      // You can add notification logic here
    })
    
    // Ask for notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    
    return () => {
      socketService.disconnect()
    }
  }, [])

  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="orders" element={<Orders />} />
            <Route path="invoices" element={<Invoice />} />
            <Route path="shipments" element={<Shipments />} />
            <Route path="customers" element={<Customers />} />
            <Route path="users" element={<Users />} />
            <Route path="categories" element={<Categories />} />
            <Route path="tax" element={<Tax />} />
            <Route path="returns" element={<Returns />} />
            <Route path="payment" element={<Payment />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="marketing" element={<Marketing />} />
            <Route path="discounts" element={<Discounts />} />
            <Route path="facebook" element={<FacebookInstagram />} />
            <Route path="store" element={<OnlineStore />} />
            <Route path="google" element={<GoogleYouTube />} />
            <Route path="forms" element={<Forms />} />
            <Route path="settings" element={<Settings />} />
            
            {/* New Customer Engagement Features */}
            <Route path="loyalty-program" element={<LoyaltyProgram />} />
            <Route path="affiliate-program" element={<AffiliateMarketing />} />
            <Route path="cashback" element={<CashbackSystem />} />
            <Route path="email-marketing" element={<EmailMarketing />} />
            <Route path="sms-marketing" element={<SMSMarketing />} />
            <Route path="push-notifications" element={<WebPushNotifications />} />
            <Route path="whatsapp-chat" element={<WhatsAppChat />} />
            <Route path="live-chat" element={<LiveChat />} />
            <Route path="advanced-analytics" element={<AdvancedAnalytics />} />
            <Route path="form-builder" element={<FormBuilder />} />
            <Route path="workflow-automation" element={<WorkflowAutomation />} />
            <Route path="customer-segmentation" element={<CustomerSegmentation />} />
            <Route path="journey-tracking" element={<CustomerJourneyTracking />} />
            <Route path="actionable-analytics" element={<ActionableAnalytics />} />
            <Route path="ai-box" element={<AIBox />} />
            <Route path="journey-funnel" element={<JourneyFunnel />} />
            <Route path="ai-personalization" element={<AIPersonalization />} />
            <Route path="custom-audience" element={<CustomAudience />} />
            <Route path="omni-channel" element={<OmniChannel />} />
            <Route path="api-manager" element={<APICodeManager />} />
            <Route path="payment-options" element={<PaymentOptions />} />
            <Route path="video-manager" element={<VideoManager />} />
            <Route path="cms" element={<CMS />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
