import React, { useState } from 'react'
import { MessageCircle, Users, Send, BarChart3, Calendar, Target, Eye, MousePointer, Clock, TrendingUp, Filter, Plus, Phone, Video, FileText, Image, Smile, CheckCircle } from 'lucide-react'

interface ChatMessage {
  id: string
  sender: 'customer' | 'agent'
  senderName: string
  message: string
  timestamp: string
  type: 'text' | 'image' | 'file' | 'voice'
  isRead: boolean
  attachments?: string[]
}

interface ChatSession {
  id: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  status: 'active' | 'waiting' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignedAgent?: string
  lastMessage: string
  lastMessageTime: string
  messageCount: number
  tags: string[]
  notes: string
}

interface WhatsAppTemplate {
  id: string
  name: string
  category: string
  content: string
  variables: string[]
  isApproved: boolean
}

interface WhatsAppAutomation {
  id: string
  name: string
  trigger: string
  condition: string
  action: string
  isActive: boolean
  messagesSent: number
  responseRate: number
}

export default function WhatsAppChat() {
  const [activeSessions] = useState<ChatSession[]>([
    {
      id: '1',
      customerName: 'Priya Sharma',
      customerPhone: '+91 98765 43210',
      customerEmail: 'priya.sharma@email.com',
      status: 'active',
      priority: 'medium',
      assignedAgent: 'Agent Raj',
      lastMessage: 'Thank you for your help!',
      lastMessageTime: '2024-01-20 14:30',
      messageCount: 12,
      tags: ['skincare', 'order-issue'],
      notes: 'Customer had issues with order delivery'
    },
    {
      id: '2',
      customerName: 'Amit Kumar',
      customerPhone: '+91 87654 32109',
      status: 'waiting',
      priority: 'high',
      lastMessage: 'I need help with my refund',
      lastMessageTime: '2024-01-20 13:45',
      messageCount: 5,
      tags: ['refund', 'urgent'],
      notes: 'Customer requesting refund for damaged product'
    },
    {
      id: '3',
      customerName: 'Sneha Patel',
      customerPhone: '+91 76543 21098',
      customerEmail: 'sneha.patel@email.com',
      status: 'resolved',
      priority: 'low',
      assignedAgent: 'Agent Priya',
      lastMessage: 'Issue resolved, thank you!',
      lastMessageTime: '2024-01-20 12:15',
      messageCount: 8,
      tags: ['product-info', 'resolved'],
      notes: 'Customer inquiry about product ingredients'
    }
  ])

  const [currentSession, setCurrentSession] = useState<ChatSession | null>(activeSessions[0])
  const [messages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'customer',
      senderName: 'Priya Sharma',
      message: 'Hi, I have an issue with my recent order',
      timestamp: '2024-01-20 14:00',
      type: 'text',
      isRead: true
    },
    {
      id: '2',
      sender: 'agent',
      senderName: 'Agent Raj',
      message: 'Hello Priya! I\'m here to help. Can you please share your order number?',
      timestamp: '2024-01-20 14:01',
      type: 'text',
      isRead: true
    },
    {
      id: '3',
      sender: 'customer',
      senderName: 'Priya Sharma',
      message: 'Sure, it\'s ORD-2024-001',
      timestamp: '2024-01-20 14:02',
      type: 'text',
      isRead: true
    },
    {
      id: '4',
      sender: 'agent',
      senderName: 'Agent Raj',
      message: 'Thank you! I can see your order was delivered yesterday. What seems to be the issue?',
      timestamp: '2024-01-20 14:03',
      type: 'text',
      isRead: true
    },
    {
      id: '5',
      sender: 'customer',
      senderName: 'Priya Sharma',
      message: 'The product packaging was damaged and one of the items is missing',
      timestamp: '2024-01-20 14:05',
      type: 'text',
      isRead: true
    },
    {
      id: '6',
      sender: 'agent',
      senderName: 'Agent Raj',
      message: 'I\'m sorry to hear that. Let me arrange a replacement for the missing item and also provide you with a discount code for the inconvenience.',
      timestamp: '2024-01-20 14:07',
      type: 'text',
      isRead: true
    },
    {
      id: '7',
      sender: 'customer',
      senderName: 'Priya Sharma',
      message: 'Thank you for your help!',
      timestamp: '2024-01-20 14:30',
      type: 'text',
      isRead: true
    }
  ])

  const [templates] = useState<WhatsAppTemplate[]>([
    {
      id: '1',
      name: 'Order Confirmation',
      category: 'Transactional',
      content: 'Hi {{name}}, your order #{{order_id}} has been confirmed. Expected delivery: {{delivery_date}}',
      variables: ['name', 'order_id', 'delivery_date'],
      isApproved: true
    },
    {
      id: '2',
      name: 'Order Shipped',
      category: 'Transactional',
      content: 'Your order #{{order_id}} has been shipped! Track: {{tracking_link}}',
      variables: ['order_id', 'tracking_link'],
      isApproved: true
    },
    {
      id: '3',
      name: 'Welcome Message',
      category: 'Marketing',
      content: 'Welcome to Nefol! 🎉 Get 10% off your first order with code WELCOME10',
      variables: [],
      isApproved: true
    },
    {
      id: '4',
      name: 'Abandoned Cart',
      category: 'Marketing',
      content: 'Don\'t forget your skincare essentials! Complete your order: {{cart_link}}',
      variables: ['cart_link'],
      isApproved: false
    }
  ])

  const [automations] = useState<WhatsAppAutomation[]>([
    {
      id: '1',
      name: 'Order Confirmation',
      trigger: 'Order Placed',
      condition: 'All orders',
      action: 'Send confirmation message',
      isActive: true,
      messagesSent: 150,
      responseRate: 95.2
    },
    {
      id: '2',
      name: 'Cart Abandonment',
      trigger: 'Cart Abandoned',
      condition: 'Cart value > ₹500',
      action: 'Send reminder message after 2 hours',
      isActive: true,
      messagesSent: 85,
      responseRate: 78.5
    },
    {
      id: '3',
      name: 'Delivery Update',
      trigger: 'Order Shipped',
      condition: 'All shipped orders',
      action: 'Send tracking message',
      isActive: true,
      messagesSent: 120,
      responseRate: 88.3
    },
    {
      id: '4',
      name: 'Birthday Wishes',
      trigger: 'Customer Birthday',
      condition: 'Active customer',
      action: 'Send birthday message',
      isActive: false,
      messagesSent: 0,
      responseRate: 0
    }
  ])

  const [newMessage, setNewMessage] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [showAutomations, setShowAutomations] = useState(false)

  const totalStats = {
    totalSessions: activeSessions.length,
    activeSessions: activeSessions.filter(s => s.status === 'active').length,
    waitingSessions: activeSessions.filter(s => s.status === 'waiting').length,
    resolvedSessions: activeSessions.filter(s => s.status === 'resolved').length
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200'
      case 'waiting': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200'
      case 'resolved': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200'
      case 'closed': return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200'
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // In a real app, this would send the message via WhatsApp API
      console.log('Sending message:', newMessage)
      setNewMessage('')
    }
  }

  const handleSessionSelect = (session: ChatSession) => {
    setCurrentSession(session)
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            WhatsApp Chat Support
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage customer conversations and provide instant support
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowTemplates(true)}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center space-x-2"
          >
            <FileText className="h-4 w-4" />
            <span>Templates</span>
          </button>
          <button
            onClick={() => setShowAutomations(true)}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Automations</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Total Sessions</h3>
              <p className="text-3xl font-bold">{totalStats.totalSessions}</p>
            </div>
            <MessageCircle className="h-8 w-8" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Active</h3>
              <p className="text-3xl font-bold">{totalStats.activeSessions}</p>
            </div>
            <Users className="h-8 w-8" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Waiting</h3>
              <p className="text-3xl font-bold">{totalStats.waitingSessions}</p>
            </div>
            <Clock className="h-8 w-8" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Resolved</h3>
              <p className="text-3xl font-bold">{totalStats.resolvedSessions}</p>
            </div>
            <CheckCircle className="h-8 w-8" />
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions List */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Chat Sessions
            </h2>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => handleSessionSelect(session)}
                className={`p-4 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 ${
                  currentSession?.id === session.id ? 'bg-blue-50 dark:bg-blue-900' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    {session.customerName}
                  </h3>
                  <div className="flex space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(session.status)}`}>
                      {session.status}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(session.priority)}`}>
                      {session.priority}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                  {session.customerPhone}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500 truncate">
                  {session.lastMessage}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-slate-500 dark:text-slate-500">
                    {session.lastMessageTime}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-500">
                    {session.messageCount} messages
                  </span>
                </div>
                {session.assignedAgent && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Assigned to: {session.assignedAgent}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg flex flex-col">
          {currentSession ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      {currentSession.customerName}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {currentSession.customerPhone}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                      <Phone className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                      <Video className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex space-x-2 mt-2">
                  {currentSession.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto max-h-96">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'customer' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender === 'customer'
                            ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender === 'customer'
                            ? 'text-slate-500 dark:text-slate-400'
                            : 'text-blue-100'
                        }`}>
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex space-x-2">
                  <button className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                    <Image className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                    <FileText className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                    <Smile className="h-4 w-4" />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button
                    onClick={handleSendMessage}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  Select a chat session to start conversation
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Templates */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            WhatsApp Templates
          </h2>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            Create Template
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {templates.map((template) => (
            <div key={template.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {template.name}
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  template.isApproved 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {template.isApproved ? 'Approved' : 'Pending'}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                {template.category}
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                {template.content}
              </p>
              <div className="flex space-x-2">
                <button className="flex-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors">
                  Use Template
                </button>
                <button className="px-3 py-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm rounded hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WhatsApp Automations */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            WhatsApp Automations
          </h2>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Create Automation
          </button>
        </div>
        <div className="space-y-4">
          {automations.map((automation) => (
            <div key={automation.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    {automation.name}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    automation.isActive 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}>
                    {automation.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm rounded hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    Edit
                  </button>
                  <button className={`px-3 py-1 text-sm rounded transition-colors ${
                    automation.isActive
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}>
                    {automation.isActive ? 'Pause' : 'Activate'}
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Trigger:</span>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{automation.trigger}</p>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Condition:</span>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{automation.condition}</p>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Action:</span>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{automation.action}</p>
                </div>
              </div>
              
              <div className="mt-3 flex items-center justify-between text-sm">
                <div className="flex space-x-4">
                  <span className="text-slate-600 dark:text-slate-400">
                    Messages Sent: <span className="font-semibold">{automation.messagesSent}</span>
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">
                    Response Rate: <span className="font-semibold text-green-600">{automation.responseRate}%</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WhatsApp Best Practices */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-4">WhatsApp Business Best Practices</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold">1</span>
            </div>
            <h3 className="font-semibold mb-2">Quick Response</h3>
            <p className="text-sm opacity-90">
              Respond to customer messages within 24 hours to maintain good business rating.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold">2</span>
            </div>
            <h3 className="font-semibold mb-2">Use Templates</h3>
            <p className="text-sm opacity-90">
              Create approved templates for common messages to ensure consistency and compliance.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold">3</span>
            </div>
            <h3 className="font-semibold mb-2">Personal Touch</h3>
            <p className="text-sm opacity-90">
              Use customer names and personalize messages to create better engagement.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
