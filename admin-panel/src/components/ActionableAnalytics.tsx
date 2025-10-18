import React, { useState } from 'react'
import { BarChart3, TrendingUp, Users, Target, Filter, Download, Share, Eye, MousePointer, Clock, DollarSign, ShoppingCart, Heart, Star } from 'lucide-react'

interface AnalyticsMetric {
  id: string
  name: string
  value: number
  change: number
  trend: 'up' | 'down' | 'stable'
  icon: React.ComponentType<any>
  color: string
}

interface ActionableInsight {
  id: string
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  category: 'revenue' | 'conversion' | 'retention' | 'engagement'
  action: string
  estimatedValue: number
  priority: number
}

interface PerformanceData {
  metric: string
  current: number
  previous: number
  benchmark: number
  status: 'excellent' | 'good' | 'average' | 'poor'
}

export default function ActionableAnalytics() {
  const [metrics] = useState<AnalyticsMetric[]>([
    {
      id: '1',
      name: 'Revenue',
      value: 2500000,
      change: 12.5,
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      id: '2',
      name: 'Conversion Rate',
      value: 3.2,
      change: -2.1,
      trend: 'down',
      icon: Target,
      color: 'text-red-600'
    },
    {
      id: '3',
      name: 'Customer Retention',
      value: 78.5,
      change: 5.2,
      trend: 'up',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      id: '4',
      name: 'Average Order Value',
      value: 1250,
      change: 8.7,
      trend: 'up',
      icon: ShoppingCart,
      color: 'text-purple-600'
    }
  ])

  const [insights] = useState<ActionableInsight[]>([
    {
      id: '1',
      title: 'Optimize Checkout Process',
      description: 'Cart abandonment rate is 68% - implement one-click checkout',
      impact: 'high',
      category: 'conversion',
      action: 'Add express checkout options',
      estimatedValue: 450000,
      priority: 1
    },
    {
      id: '2',
      title: 'Improve Email Engagement',
      description: 'Email open rates dropped 15% - segment audiences better',
      impact: 'medium',
      category: 'engagement',
      action: 'Implement dynamic content',
      estimatedValue: 120000,
      priority: 2
    },
    {
      id: '3',
      title: 'Retarget Abandoned Carts',
      description: '15% of abandoned carts convert with retargeting',
      impact: 'high',
      category: 'revenue',
      action: 'Set up automated retargeting',
      estimatedValue: 280000,
      priority: 1
    },
    {
      id: '4',
      title: 'Enhance Product Recommendations',
      description: 'AI recommendations show 25% higher conversion',
      impact: 'medium',
      category: 'conversion',
      action: 'Implement AI-powered suggestions',
      estimatedValue: 180000,
      priority: 3
    }
  ])

  const [performanceData] = useState<PerformanceData[]>([
    {
      metric: 'Revenue Growth',
      current: 12.5,
      previous: 8.2,
      benchmark: 15.0,
      status: 'good'
    },
    {
      metric: 'Customer Acquisition Cost',
      current: 45,
      previous: 52,
      benchmark: 40,
      status: 'average'
    },
    {
      metric: 'Customer Lifetime Value',
      current: 1250,
      previous: 1100,
      benchmark: 1500,
      status: 'good'
    },
    {
      metric: 'Return Customer Rate',
      current: 35,
      previous: 28,
      benchmark: 40,
      status: 'average'
    }
  ])

  const [activeTab, setActiveTab] = useState('overview')
  const [timeRange, setTimeRange] = useState('30d')

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200'
      case 'good': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200'
      case 'average': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200'
      case 'poor': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'insights', label: 'Actionable Insights', icon: Target },
    { id: 'performance', label: 'Performance', icon: TrendingUp }
  ]

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Actionable Analytics
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Data-driven insights to optimize your business performance
          </p>
        </div>
        <div className="flex space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => {
          const IconComponent = metric.icon
          return (
            <div key={metric.id} className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{metric.name}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {metric.name === 'Revenue' ? `₹${(metric.value / 100000).toFixed(1)}L` :
                     metric.name === 'Conversion Rate' ? `${metric.value}%` :
                     metric.name === 'Customer Retention' ? `${metric.value}%` :
                     `₹${metric.value}`}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${metric.color.replace('text-', 'bg-').replace('-600', '-100')} dark:bg-opacity-20`}>
                  <IconComponent className={`h-6 w-6 ${metric.color}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className={`text-sm font-medium ${
                  metric.trend === 'up' ? 'text-green-600' : 
                  metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {metric.trend === 'up' ? '↗' : metric.trend === 'down' ? '↘' : '→'} {Math.abs(metric.change)}%
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">vs last period</span>
              </div>
            </div>
          )
        })}
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
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Business Overview
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
                    Revenue Trends
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Monthly Revenue</span>
                      <span className="font-semibold text-green-600">₹2.5M</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Growth Rate</span>
                      <span className="font-semibold text-green-600">+12.5%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Target Achievement</span>
                      <span className="font-semibold text-blue-600">95%</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
                    Customer Metrics
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">New Customers</span>
                      <span className="font-semibold text-blue-600">1,250</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Retention Rate</span>
                      <span className="font-semibold text-green-600">78.5%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Churn Rate</span>
                      <span className="font-semibold text-red-600">5.2%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actionable Insights Tab */}
          {activeTab === 'insights' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Actionable Insights
              </h3>
              
              <div className="space-y-4">
                {insights.map((insight) => (
                  <div key={insight.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                            {insight.title}
                          </h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getImpactColor(insight.impact)}`}>
                            {insight.impact} impact
                          </span>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                            Priority {insight.priority}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 mb-3">
                          {insight.description}
                        </p>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-slate-600 dark:text-slate-400">
                            Category: <span className="font-semibold">{insight.category}</span>
                          </span>
                          <span className="text-slate-600 dark:text-slate-400">
                            Estimated Value: <span className="font-semibold text-green-600">₹{(insight.estimatedValue / 100000).toFixed(1)}L</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Eye className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Recommended Action: {insight.action}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                          Implement
                        </button>
                        <button className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm">
                          Learn More
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Performance Analysis
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Metric
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Current
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Previous
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Benchmark
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {performanceData.map((data, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                          {data.metric}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                          {data.metric.includes('Cost') || data.metric.includes('Value') ? `₹${data.current}` : `${data.current}%`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                          {data.metric.includes('Cost') || data.metric.includes('Value') ? `₹${data.previous}` : `${data.previous}%`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                          {data.metric.includes('Cost') || data.metric.includes('Value') ? `₹${data.benchmark}` : `${data.benchmark}%`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(data.status)}`}>
                            {data.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actionable Analytics Best Practices */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-4">Actionable Analytics Best Practices</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold">1</span>
            </div>
            <h3 className="font-semibold mb-2">Focus on Actionable Metrics</h3>
            <p className="text-sm opacity-90">
              Track metrics that directly impact business decisions and can be acted upon.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold">2</span>
            </div>
            <h3 className="font-semibold mb-2">Set Clear Benchmarks</h3>
            <p className="text-sm opacity-90">
              Compare performance against industry standards and historical data.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold">3</span>
            </div>
            <h3 className="font-semibold mb-2">Regular Review Cycles</h3>
            <p className="text-sm opacity-90">
              Schedule regular reviews to identify trends and take corrective actions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
