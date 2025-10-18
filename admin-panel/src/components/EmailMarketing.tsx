import React, { useState } from 'react'
import { Mail, Users, Send, BarChart3, Calendar, Target, Eye, MousePointer, Clock, TrendingUp, Filter, Plus } from 'lucide-react'

interface EmailCampaign {
  id: string
  name: string
  subject: string
  status: 'draft' | 'scheduled' | 'sent' | 'paused'
  type: 'promotional' | 'newsletter' | 'abandoned_cart' | 'welcome' | 'birthday'
  audience: string
  scheduledDate?: string
  sentDate?: string
  recipients: number
  openRate: number
  clickRate: number
  conversionRate: number
  revenue: number
}

interface EmailTemplate {
  id: string
  name: string
  category: string
  preview: string
  isCustom: boolean
}

interface EmailAutomation {
  id: string
  name: string
  trigger: string
  condition: string
  action: string
  isActive: boolean
  emailsSent: number
  conversionRate: number
}

export default function EmailMarketing() {
  const [campaigns] = useState<EmailCampaign[]>([
    {
      id: '1',
      name: 'New Year Skincare Sale',
      subject: 'Get 25% off on all skincare products!',
      status: 'sent',
      type: 'promotional',
      audience: 'All Customers',
      sentDate: '2024-01-01',
      recipients: 5000,
      openRate: 24.5,
      clickRate: 8.2,
      conversionRate: 3.1,
      revenue: 12500
    },
    {
      id: '2',
      name: 'Weekly Beauty Tips',
      subject: 'This week\'s skincare routine tips',
      status: 'scheduled',
      type: 'newsletter',
      audience: 'Subscribers',
      scheduledDate: '2024-02-15',
      recipients: 3200,
      openRate: 0,
      clickRate: 0,
      conversionRate: 0,
      revenue: 0
    },
    {
      id: '3',
      name: 'Cart Abandonment Reminder',
      subject: 'Don\'t forget your skincare essentials!',
      status: 'sent',
      type: 'abandoned_cart',
      audience: 'Cart Abandoners',
      sentDate: '2024-01-20',
      recipients: 850,
      openRate: 18.7,
      clickRate: 12.3,
      conversionRate: 7.8,
      revenue: 3200
    },
    {
      id: '4',
      name: 'Welcome Series - Day 1',
      subject: 'Welcome to Nefol! Start your skincare journey',
      status: 'sent',
      type: 'welcome',
      audience: 'New Customers',
      sentDate: '2024-01-15',
      recipients: 1200,
      openRate: 32.1,
      clickRate: 15.6,
      conversionRate: 9.2,
      revenue: 4800
    }
  ])

  const [templates] = useState<EmailTemplate[]>([
    {
      id: '1',
      name: 'Sale Announcement',
      category: 'Promotional',
      preview: 'Limited time offer - Get up to 50% off on selected products',
      isCustom: false
    },
    {
      id: '2',
      name: 'Product Launch',
      category: 'Promotional',
      preview: 'Introducing our new anti-aging serum with revolutionary formula',
      isCustom: false
    },
    {
      id: '3',
      name: 'Newsletter Template',
      category: 'Newsletter',
      preview: 'This week\'s beauty tips and skincare routine recommendations',
      isCustom: false
    },
    {
      id: '4',
      name: 'Birthday Wishes',
      category: 'Personal',
      preview: 'Happy Birthday! Here\'s a special gift just for you',
      isCustom: false
    }
  ])

  const [automations] = useState<EmailAutomation[]>([
    {
      id: '1',
      name: 'Welcome Series',
      trigger: 'New Customer Registration',
      condition: 'First time buyer',
      action: 'Send welcome email series (3 emails)',
      isActive: true,
      emailsSent: 1200,
      conversionRate: 9.2
    },
    {
      id: '2',
      name: 'Cart Abandonment',
      trigger: 'Cart Abandoned',
      condition: 'Cart value > ₹500',
      action: 'Send reminder email after 1 hour',
      isActive: true,
      emailsSent: 850,
      conversionRate: 7.8
    },
    {
      id: '3',
      name: 'Birthday Campaign',
      trigger: 'Customer Birthday',
      condition: 'Active customer',
      action: 'Send birthday discount email',
      isActive: true,
      emailsSent: 320,
      conversionRate: 12.5
    },
    {
      id: '4',
      name: 'Re-engagement',
      trigger: 'No Purchase in 30 Days',
      condition: 'Last purchase > 30 days',
      action: 'Send re-engagement offer',
      isActive: false,
      emailsSent: 0,
      conversionRate: 0
    }
  ])

  const [showCreateCampaign, setShowCreateCampaign] = useState(false)
  const [showCreateAutomation, setShowCreateAutomation] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null)

  const totalStats = {
    totalCampaigns: campaigns.length,
    totalRecipients: campaigns.reduce((sum, campaign) => sum + campaign.recipients, 0),
    averageOpenRate: campaigns.reduce((sum, campaign) => sum + campaign.openRate, 0) / campaigns.length,
    totalRevenue: campaigns.reduce((sum, campaign) => sum + campaign.revenue, 0)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200'
      case 'scheduled': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200'
      case 'sent': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200'
      case 'paused': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'promotional': return 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-200'
      case 'newsletter': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200'
      case 'abandoned_cart': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200'
      case 'welcome': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200'
      case 'birthday': return 'text-pink-600 bg-pink-100 dark:bg-pink-900 dark:text-pink-200'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Email Marketing
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Create and manage email campaigns to engage your customers
          </p>
        </div>
        <button
          onClick={() => setShowCreateCampaign(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Campaign</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Total Campaigns</h3>
              <p className="text-3xl font-bold">{totalStats.totalCampaigns}</p>
            </div>
            <Mail className="h-8 w-8" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Total Recipients</h3>
              <p className="text-3xl font-bold">{totalStats.totalRecipients.toLocaleString()}</p>
            </div>
            <Users className="h-8 w-8" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Avg Open Rate</h3>
              <p className="text-3xl font-bold">{totalStats.averageOpenRate.toFixed(1)}%</p>
            </div>
            <Eye className="h-8 w-8" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Total Revenue</h3>
              <p className="text-3xl font-bold">₹{totalStats.totalRevenue.toLocaleString()}</p>
            </div>
            <TrendingUp className="h-8 w-8" />
          </div>
        </div>
      </div>

      {/* Campaigns */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Email Campaigns
          </h2>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm hover:bg-slate-50 dark:hover:bg-slate-700">
              <Filter className="h-4 w-4 inline mr-1" />
              Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Recipients
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Open Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {campaigns.map((campaign) => (
                <tr key={campaign.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {campaign.name}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {campaign.subject}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(campaign.type)}`}>
                      {campaign.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {campaign.recipients.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {campaign.openRate}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    ₹{campaign.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => setSelectedCampaign(campaign)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      Edit
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email Templates */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Email Templates
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {templates.map((template) => (
            <div key={template.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {template.name}
                </h3>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                  {template.category}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                {template.preview}
              </p>
              <div className="flex space-x-2">
                <button className="flex-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                  Use Template
                </button>
                <button className="px-3 py-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm rounded hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  Preview
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Email Automations */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Email Automations
          </h2>
          <button
            onClick={() => setShowCreateAutomation(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Automation</span>
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
                    Emails Sent: <span className="font-semibold">{automation.emailsSent}</span>
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">
                    Conversion Rate: <span className="font-semibold text-green-600">{automation.conversionRate}%</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Campaign Performance */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Campaign Performance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Top Performing Campaigns
            </h3>
            <div className="space-y-3">
              {campaigns
                .sort((a, b) => b.conversionRate - a.conversionRate)
                .slice(0, 3)
                .map((campaign, index) => (
                  <div key={campaign.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                          {campaign.name}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {campaign.conversionRate}% conversion rate
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        ₹{campaign.revenue.toLocaleString()}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Revenue
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Email Metrics
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">Average Open Rate</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {totalStats.averageOpenRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">Average Click Rate</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {campaigns.reduce((sum, c) => sum + c.clickRate, 0) / campaigns.length}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">Average Conversion Rate</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {campaigns.reduce((sum, c) => sum + c.conversionRate, 0) / campaigns.length}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">Total Revenue</span>
                <span className="font-semibold text-green-600">
                  ₹{totalStats.totalRevenue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Campaign Modal */}
      {showCreateCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Create Email Campaign
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Campaign Name
                </label>
                <input
                  type="text"
                  placeholder="Enter campaign name"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email Subject
                </label>
                <input
                  type="text"
                  placeholder="Enter email subject"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Campaign Type
                </label>
                <select className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100">
                  <option>Promotional</option>
                  <option>Newsletter</option>
                  <option>Abandoned Cart</option>
                  <option>Welcome</option>
                  <option>Birthday</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Target Audience
                </label>
                <select className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100">
                  <option>All Customers</option>
                  <option>Subscribers</option>
                  <option>New Customers</option>
                  <option>VIP Customers</option>
                  <option>Cart Abandoners</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setShowCreateCampaign(false)}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowCreateCampaign(false)
                  alert('Campaign created successfully!')
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
