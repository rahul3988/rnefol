import React, { useState } from 'react'
import { Settings, Key, Code, Database, Mail, MessageSquare, Bell, ShoppingCart, CreditCard, Globe, Smartphone, Shield, Save, Eye, EyeOff, Copy, Check, AlertCircle, ExternalLink } from 'lucide-react'

interface APIConfig {
  id: string
  name: string
  description: string
  category: 'payment' | 'email' | 'sms' | 'push' | 'analytics' | 'social' | 'shipping' | 'database' | 'ai' | 'other'
  fields: APIField[]
  status: 'active' | 'inactive' | 'testing'
  lastUpdated: string
  icon: React.ComponentType<any>
  color: string
}

interface APIField {
  id: string
  name: string
  label: string
  type: 'text' | 'password' | 'url' | 'number' | 'select' | 'textarea'
  value: string
  placeholder?: string
  required: boolean
  description?: string
  options?: { value: string; label: string }[]
  sensitive: boolean
}

export default function APICodeManager() {
  const [configs] = useState<APIConfig[]>([
    {
      id: '1',
      name: 'Payment Gateway',
      description: 'Razorpay, Stripe, PayPal payment processing',
      category: 'payment',
      status: 'active',
      lastUpdated: '2024-01-20',
      icon: CreditCard,
      color: 'bg-green-500',
      fields: [
        {
          id: 'razorpay_key',
          name: 'razorpay_key',
          label: 'Razorpay Key ID',
          type: 'text',
          value: 'rzp_test_1234567890',
          placeholder: 'rzp_test_...',
          required: true,
          sensitive: true
        },
        {
          id: 'razorpay_secret',
          name: 'razorpay_secret',
          label: 'Razorpay Secret',
          type: 'password',
          value: 'sk_test_1234567890',
          placeholder: 'sk_test_...',
          required: true,
          sensitive: true
        },
        {
          id: 'stripe_key',
          name: 'stripe_key',
          label: 'Stripe Publishable Key',
          type: 'text',
          value: 'pk_test_1234567890',
          placeholder: 'pk_test_...',
          required: false,
          sensitive: true
        },
        {
          id: 'stripe_secret',
          name: 'stripe_secret',
          label: 'Stripe Secret Key',
          type: 'password',
          value: 'sk_test_1234567890',
          placeholder: 'sk_test_...',
          required: false,
          sensitive: true
        }
      ]
    },
    {
      id: '2',
      name: 'Email Service',
      description: 'SendGrid, Mailgun, AWS SES email delivery',
      category: 'email',
      status: 'active',
      lastUpdated: '2024-01-19',
      icon: Mail,
      color: 'bg-blue-500',
      fields: [
        {
          id: 'sendgrid_key',
          name: 'sendgrid_key',
          label: 'SendGrid API Key',
          type: 'password',
          value: 'SG.1234567890',
          placeholder: 'SG....',
          required: true,
          sensitive: true
        },
        {
          id: 'from_email',
          name: 'from_email',
          label: 'From Email Address',
          type: 'text',
          value: 'noreply@nefol.com',
          placeholder: 'noreply@yourdomain.com',
          required: true,
          sensitive: false
        },
        {
          id: 'from_name',
          name: 'from_name',
          label: 'From Name',
          type: 'text',
          value: 'Nefol Team',
          placeholder: 'Your Company Name',
          required: true,
          sensitive: false
        }
      ]
    },
    {
      id: '3',
      name: 'SMS Service',
      description: 'Twilio, AWS SNS SMS notifications',
      category: 'sms',
      status: 'active',
      lastUpdated: '2024-01-18',
      icon: MessageSquare,
      color: 'bg-purple-500',
      fields: [
        {
          id: 'twilio_sid',
          name: 'twilio_sid',
          label: 'Twilio Account SID',
          type: 'text',
          value: 'AC1234567890',
          placeholder: 'AC...',
          required: true,
          sensitive: true
        },
        {
          id: 'twilio_token',
          name: 'twilio_token',
          label: 'Twilio Auth Token',
          type: 'password',
          value: '1234567890',
          placeholder: 'Your auth token',
          required: true,
          sensitive: true
        },
        {
          id: 'twilio_phone',
          name: 'twilio_phone',
          label: 'Twilio Phone Number',
          type: 'text',
          value: '+1234567890',
          placeholder: '+1234567890',
          required: true,
          sensitive: false
        }
      ]
    },
    {
      id: '4',
      name: 'Push Notifications',
      description: 'Firebase, OneSignal web push notifications',
      category: 'push',
      status: 'testing',
      lastUpdated: '2024-01-17',
      icon: Bell,
      color: 'bg-orange-500',
      fields: [
        {
          id: 'firebase_config',
          name: 'firebase_config',
          label: 'Firebase Config',
          type: 'textarea',
          value: '{"apiKey":"AIza...","authDomain":"..."}',
          placeholder: 'Firebase configuration JSON',
          required: true,
          sensitive: true,
          description: 'Complete Firebase configuration object'
        },
        {
          id: 'onesignal_app_id',
          name: 'onesignal_app_id',
          label: 'OneSignal App ID',
          type: 'text',
          value: '12345678-1234-1234-1234-123456789012',
          placeholder: 'UUID format',
          required: false,
          sensitive: true
        }
      ]
    },
    {
      id: '5',
      name: 'Analytics',
      description: 'Google Analytics, Facebook Pixel tracking',
      category: 'analytics',
      status: 'active',
      lastUpdated: '2024-01-16',
      icon: Globe,
      color: 'bg-indigo-500',
      fields: [
        {
          id: 'google_analytics',
          name: 'google_analytics',
          label: 'Google Analytics ID',
          type: 'text',
          value: 'GA-123456789-1',
          placeholder: 'GA-123456789-1',
          required: true,
          sensitive: false
        },
        {
          id: 'facebook_pixel',
          name: 'facebook_pixel',
          label: 'Facebook Pixel ID',
          type: 'text',
          value: '123456789012345',
          placeholder: '123456789012345',
          required: false,
          sensitive: false
        },
        {
          id: 'google_tag_manager',
          name: 'google_tag_manager',
          label: 'Google Tag Manager ID',
          type: 'text',
          value: 'GTM-XXXXXXX',
          placeholder: 'GTM-XXXXXXX',
          required: false,
          sensitive: false
        }
      ]
    },
    {
      id: '6',
      name: 'Social Media',
      description: 'Facebook, Instagram, WhatsApp Business API',
      category: 'social',
      status: 'active',
      lastUpdated: '2024-01-15',
      icon: Smartphone,
      color: 'bg-pink-500',
      fields: [
        {
          id: 'facebook_app_id',
          name: 'facebook_app_id',
          label: 'Facebook App ID',
          type: 'text',
          value: '123456789012345',
          placeholder: '123456789012345',
          required: true,
          sensitive: true
        },
        {
          id: 'facebook_app_secret',
          name: 'facebook_app_secret',
          label: 'Facebook App Secret',
          type: 'password',
          value: '1234567890abcdef',
          placeholder: 'App secret key',
          required: true,
          sensitive: true
        },
        {
          id: 'whatsapp_token',
          name: 'whatsapp_token',
          label: 'WhatsApp Business Token',
          type: 'password',
          value: 'EAA1234567890',
          placeholder: 'WhatsApp access token',
          required: false,
          sensitive: true
        }
      ]
    },
    {
      id: '7',
      name: 'Database',
      description: 'PostgreSQL, Redis connection settings',
      category: 'database',
      status: 'active',
      lastUpdated: '2024-01-14',
      icon: Database,
      color: 'bg-cyan-500',
      fields: [
        {
          id: 'database_url',
          name: 'database_url',
          label: 'Database URL',
          type: 'password',
          value: 'postgresql://user:pass@localhost:5432/nefol',
          placeholder: 'postgresql://...',
          required: true,
          sensitive: true
        },
        {
          id: 'redis_url',
          name: 'redis_url',
          label: 'Redis URL',
          type: 'password',
          value: 'redis://localhost:6379',
          placeholder: 'redis://...',
          required: false,
          sensitive: true
        }
      ]
    },
    {
      id: '8',
      name: 'AI Services',
      description: 'OpenAI, Google AI, custom AI integrations',
      category: 'ai',
      status: 'testing',
      lastUpdated: '2024-01-13',
      icon: Shield,
      color: 'bg-emerald-500',
      fields: [
        {
          id: 'openai_key',
          name: 'openai_key',
          label: 'OpenAI API Key',
          type: 'password',
          value: 'sk-1234567890abcdef',
          placeholder: 'sk-...',
          required: false,
          sensitive: true
        },
        {
          id: 'google_ai_key',
          name: 'google_ai_key',
          label: 'Google AI API Key',
          type: 'password',
          value: 'AIza1234567890',
          placeholder: 'AIza...',
          required: false,
          sensitive: true
        }
      ]
    }
  ])

  const [activeTab, setActiveTab] = useState('overview')
  const [selectedConfig, setSelectedConfig] = useState<APIConfig | null>(null)
  const [showSensitive, setShowSensitive] = useState<{ [key: string]: boolean }>({})
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200'
      case 'inactive': return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200'
      case 'testing': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'payment': return <CreditCard className="h-4 w-4" />
      case 'email': return <Mail className="h-4 w-4" />
      case 'sms': return <MessageSquare className="h-4 w-4" />
      case 'push': return <Bell className="h-4 w-4" />
      case 'analytics': return <Globe className="h-4 w-4" />
      case 'social': return <Smartphone className="h-4 w-4" />
      case 'database': return <Database className="h-4 w-4" />
      case 'ai': return <Shield className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  const toggleSensitive = (fieldId: string) => {
    setShowSensitive(prev => ({
      ...prev,
      [fieldId]: !prev[fieldId]
    }))
  }

  const copyToClipboard = async (value: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(fieldId)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const tabs = [
    { id: 'overview', label: 'API Overview', icon: Settings },
    { id: 'configs', label: 'Configurations', icon: Key },
    { id: 'test', label: 'Test APIs', icon: Code }
  ]

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            API & Code Manager
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage all your API keys, codes, and integration settings
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center space-x-2">
            <ExternalLink className="h-4 w-4" />
            <span>Export Config</span>
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Save className="h-4 w-4" />
            <span>Save All</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Total APIs</h3>
              <p className="text-3xl font-bold">{configs.length}</p>
            </div>
            <Settings className="h-8 w-8" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Active APIs</h3>
              <p className="text-3xl font-bold">{configs.filter(c => c.status === 'active').length}</p>
            </div>
            <Key className="h-8 w-8" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Testing APIs</h3>
              <p className="text-3xl font-bold">{configs.filter(c => c.status === 'testing').length}</p>
            </div>
            <Code className="h-8 w-8" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Sensitive Keys</h3>
              <p className="text-3xl font-bold">
                {configs.reduce((sum, c) => sum + c.fields.filter(f => f.sensitive).length, 0)}
              </p>
            </div>
            <Shield className="h-8 w-8" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg">
        <div className="border-b border-slate-200 dark:border-slate-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* API Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                API Configurations Overview
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {configs.map((config) => {
                  const IconComponent = config.icon
                  return (
                    <div key={config.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 ${config.color} rounded-full flex items-center justify-center`}>
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                              {config.name}
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {config.category}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(config.status)}`}>
                          {config.status}
                        </span>
                      </div>
                      
                      <p className="text-slate-600 dark:text-slate-400 mb-4">
                        {config.description}
                      </p>
                      
                      <div className="space-y-2 mb-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Fields:</span>
                          <span className="font-semibold">{config.fields.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Sensitive:</span>
                          <span className="font-semibold text-red-600">
                            {config.fields.filter(f => f.sensitive).length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Last Updated:</span>
                          <span className="font-semibold">{new Date(config.lastUpdated).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedConfig(config)}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          Configure
                        </button>
                        <button className="px-3 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm rounded hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                          Test
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Configurations Tab */}
          {activeTab === 'configs' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                API Configuration Management
              </h3>
              
              <div className="space-y-6">
                {configs.map((config) => {
                  const IconComponent = config.icon
                  return (
                    <div key={config.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 ${config.color} rounded-full flex items-center justify-center`}>
                            <IconComponent className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                              {config.name}
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {config.description}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(config.status)}`}>
                          {config.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {config.fields.map((field) => (
                          <div key={field.id} className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            <div className="relative">
                              <input
                                type={field.sensitive && !showSensitive[field.id] ? 'password' : field.type === 'password' ? 'password' : 'text'}
                                value={field.value}
                                placeholder={field.placeholder}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-20"
                              />
                              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                                {field.sensitive && (
                                  <button
                                    onClick={() => toggleSensitive(field.id)}
                                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                  >
                                    {showSensitive[field.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                                )}
                                <button
                                  onClick={() => copyToClipboard(field.value, field.id)}
                                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                  {copiedField === field.id ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>
                            {field.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {field.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Test APIs Tab */}
          {activeTab === 'test' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                API Testing & Validation
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {configs.map((config) => {
                  const IconComponent = config.icon
                  return (
                    <div key={config.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className={`w-8 h-8 ${config.color} rounded-full flex items-center justify-center`}>
                          <IconComponent className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                            {config.name}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Test API connectivity and authentication
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Connection Test</span>
                          <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                            Test
                          </button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Authentication</span>
                          <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors">
                            Validate
                          </button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Rate Limits</span>
                          <button className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors">
                            Check
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configuration Details Modal */}
      {selectedConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Configure: {selectedConfig.name}
              </h3>
              <button
                onClick={() => setSelectedConfig(null)}
                className="text-2xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                <p className="text-slate-600 dark:text-slate-400">
                  {selectedConfig.description}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedConfig.fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={field.sensitive && !showSensitive[field.id] ? 'password' : field.type === 'password' ? 'password' : 'text'}
                        value={field.value}
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-20"
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                        {field.sensitive && (
                          <button
                            onClick={() => toggleSensitive(field.id)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          >
                            {showSensitive[field.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        )}
                        <button
                          onClick={() => copyToClipboard(field.value, field.id)}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          {copiedField === field.id ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    {field.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {field.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex space-x-3">
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Save Configuration
                </button>
                <button className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  Test API
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Manager Best Practices */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-4">API Management Best Practices</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold">1</span>
            </div>
            <h3 className="font-semibold mb-2">Secure Storage</h3>
            <p className="text-sm opacity-90">
              Store sensitive API keys securely and never expose them in client-side code.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold">2</span>
            </div>
            <h3 className="font-semibold mb-2">Regular Rotation</h3>
            <p className="text-sm opacity-90">
              Regularly rotate API keys and monitor usage to maintain security.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold">3</span>
            </div>
            <h3 className="font-semibold mb-2">Test & Monitor</h3>
            <p className="text-sm opacity-90">
              Continuously test API connections and monitor performance metrics.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
