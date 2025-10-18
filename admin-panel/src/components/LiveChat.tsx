import React, { useState } from 'react'
import { MessageSquare, Users, Send, BarChart3, Calendar, Target, Eye, MousePointer, Clock, TrendingUp, Filter, Plus, Phone, Video, FileText, Image, Smile, Mic, MicOff, Headphones, Settings, CheckCircle } from 'lucide-react'

interface ChatMessage {
  id: string
  sender: 'customer' | 'agent'
  senderName: string
  message: string
  timestamp: string
  type: 'text' | 'image' | 'file' | 'voice' | 'emoji'
  isRead: boolean
  attachments?: string[]
  isTyping?: boolean
}

interface ChatSession {
  id: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  status: 'active' | 'waiting' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignedAgent?: string
  lastMessage: string
  lastMessageTime: string
  messageCount: number
  tags: string[]
  notes: string
  customerLocation?: string
  deviceInfo?: string
  referrer?: string
}

interface Agent {
  id: string
  name: string
  email: string
  status: 'online' | 'busy' | 'away' | 'offline'
  activeSessions: number
  totalSessions: number
  rating: number
  responseTime: number
  specialization: string[]
}

interface ChatWidget {
  id: string
  name: string
  isActive: boolean
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  theme: 'light' | 'dark' | 'custom'
  welcomeMessage: string
  offlineMessage: string
  businessHours: {
    enabled: boolean
    timezone: string
    schedule: {
      [key: string]: { start: string; end: string; enabled: boolean }
    }
  }
}

export default function LiveChat() {
  const [activeSessions] = useState<ChatSession[]>([
    {
      id: '1',
      customerName: 'Priya Sharma',
      customerEmail: 'priya.sharma@email.com',
      customerPhone: '+91 98765 43210',
      status: 'active',
      priority: 'medium',
      assignedAgent: 'Agent Raj',
      lastMessage: 'Thank you for your help!',
      lastMessageTime: '2024-01-20 14:30',
      messageCount: 12,
      tags: ['skincare', 'order-issue'],
      notes: 'Customer had issues with order delivery',
      customerLocation: 'Mumbai, India',
      deviceInfo: 'Chrome on Windows',
      referrer: 'Google Search'
    },
    {
      id: '2',
      customerName: 'Amit Kumar',
      customerEmail: 'amit.kumar@email.com',
      status: 'waiting',
      priority: 'high',
      lastMessage: 'I need help with my refund',
      lastMessageTime: '2024-01-20 13:45',
      messageCount: 5,
      tags: ['refund', 'urgent'],
      notes: 'Customer requesting refund for damaged product',
      customerLocation: 'Delhi, India',
      deviceInfo: 'Safari on iPhone',
      referrer: 'Direct'
    },
    {
      id: '3',
      customerName: 'Sneha Patel',
      customerEmail: 'sneha.patel@email.com',
      customerPhone: '+91 76543 21098',
      status: 'resolved',
      priority: 'low',
      assignedAgent: 'Agent Priya',
      lastMessage: 'Issue resolved, thank you!',
      lastMessageTime: '2024-01-20 12:15',
      messageCount: 8,
      tags: ['product-info', 'resolved'],
      notes: 'Customer inquiry about product ingredients',
      customerLocation: 'Bangalore, India',
      deviceInfo: 'Firefox on Mac',
      referrer: 'Social Media'
    }
  ])

  const [agents] = useState<Agent[]>([
    {
      id: '1',
      name: 'Agent Raj',
      email: 'raj@nefol.com',
      status: 'online',
      activeSessions: 3,
      totalSessions: 45,
      rating: 4.8,
      responseTime: 2.5,
      specialization: ['skincare', 'orders', 'general']
    },
    {
      id: '2',
      name: 'Agent Priya',
      email: 'priya@nefol.com',
      status: 'busy',
      activeSessions: 5,
      totalSessions: 38,
      rating: 4.9,
      responseTime: 1.8,
      specialization: ['products', 'ingredients', 'general']
    },
    {
      id: '3',
      name: 'Agent Amit',
      email: 'amit@nefol.com',
      status: 'away',
      activeSessions: 0,
      totalSessions: 52,
      rating: 4.7,
      responseTime: 3.2,
      specialization: ['refunds', 'returns', 'general']
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

  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showWidgetSettings, setShowWidgetSettings] = useState(false)
  const [showAgentManagement, setShowAgentManagement] = useState(false)

  const totalStats = {
    totalSessions: activeSessions.length,
    activeSessions: activeSessions.filter(s => s.status === 'active').length,
    waitingSessions: activeSessions.filter(s => s.status === 'waiting').length,
    resolvedSessions: activeSessions.filter(s => s.status === 'resolved').length,
    onlineAgents: agents.filter(a => a.status === 'online').length,
    averageResponseTime: agents.reduce((sum, agent) => sum + agent.responseTime, 0) / agents.length
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

  const getAgentStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200'
      case 'busy': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200'
      case 'away': return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-200'
      case 'offline': return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // In a real app, this would send the message via WebSocket
      console.log('Sending message:', newMessage)
      setNewMessage('')
    }
  }

  const handleSessionSelect = (session: ChatSession) => {
    setCurrentSession(session)
  }

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true)
      // In a real app, this would send typing indicator via WebSocket
    } else if (isTyping && e.target.value.length === 0) {
      setIsTyping(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Live Chat Support
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Real-time customer support and engagement platform
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowWidgetSettings(true)}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center space-x-2"
          >
            <Settings className="h-4 w-4" />
            <span>Widget Settings</span>
          </button>
          <button
            onClick={() => setShowAgentManagement(true)}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center space-x-2"
          >
            <Users className="h-4 w-4" />
            <span>Manage Agents</span>
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
            <MessageSquare className="h-8 w-8" />
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
              <h3 className="text-lg font-semibold">Online Agents</h3>
              <p className="text-3xl font-bold">{totalStats.onlineAgents}</p>
            </div>
            <Headphones className="h-8 w-8" />
          </div>
        </div>
      </div>

      {/* Agent Status */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Agent Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <div key={agent.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {agent.name}
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAgentStatusColor(agent.status)}`}>
                  {agent.status}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Active Sessions:</span>
                  <span className="font-semibold">{agent.activeSessions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Total Sessions:</span>
                  <span className="font-semibold">{agent.totalSessions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Rating:</span>
                  <span className="font-semibold">{agent.rating}/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Response Time:</span>
                  <span className="font-semibold">{agent.responseTime}m</span>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Specialization:</p>
                <div className="flex flex-wrap gap-1">
                  {agent.specialization.map((spec, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
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
                  {session.customerEmail}
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
                {session.customerLocation && (
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                    📍 {session.customerLocation}
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
                      {currentSession.customerEmail}
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
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-500">
                  <span>📍 {currentSession.customerLocation}</span>
                  <span className="ml-4">🖥️ {currentSession.deviceInfo}</span>
                  <span className="ml-4">🔗 {currentSession.referrer}</span>
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
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-lg">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  )}
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
                  <button className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                    <Mic className="h-4 w-4" />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={handleTyping}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button
                    onClick={handleSendMessage}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  Select a chat session to start conversation
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Widget Preview */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Chat Widget Preview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Desktop Preview
            </h3>
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-700">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">N</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">Nefol Support</h4>
                    <p className="text-xs text-green-600">Online</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  Hi! How can we help you today?
                </p>
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-blue-700 transition-colors">
                  Start Chat
                </button>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Mobile Preview
            </h3>
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-700">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm max-w-xs mx-auto">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">N</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Nefol Support</h4>
                    <p className="text-xs text-green-600">Online</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  Hi! How can we help you today?
                </p>
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-blue-700 transition-colors">
                  Start Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Chat Best Practices */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-4">Live Chat Best Practices</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold">1</span>
            </div>
            <h3 className="font-semibold mb-2">Quick Response</h3>
            <p className="text-sm opacity-90">
              Respond to customer messages within 2 minutes for optimal customer satisfaction.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold">2</span>
            </div>
            <h3 className="font-semibold mb-2">Proactive Engagement</h3>
            <p className="text-sm opacity-90">
              Use visitor tracking to proactively engage customers who might need help.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold">3</span>
            </div>
            <h3 className="font-semibold mb-2">Personal Touch</h3>
            <p className="text-sm opacity-90">
              Use customer names and personalize conversations to create better connections.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
