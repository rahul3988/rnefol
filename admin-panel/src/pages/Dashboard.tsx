import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LiveMonitoring from '../components/LiveMonitoring'

const Dashboard = () => {
  const navigate = useNavigate()
  const [showCongrats, setShowCongrats] = useState(true)
  const metrics = [
    {
      title: 'Sessions',
      value: '1,640',
      change: '+9%',
      trend: 'up',
      icon: '📈'
    },
    {
      title: 'Total sales',
      value: '₹1,889',
      change: '+137%',
      trend: 'up',
      icon: '💰'
    },
    {
      title: 'Orders',
      value: '85',
      change: '-33%',
      trend: 'down',
      icon: '📦'
    },
    {
      title: 'Conversion rate',
      value: '1.28%',
      change: '-78%',
      trend: 'down',
      icon: '🎯'
    }
  ]

  const actionItems = [
    {
      title: '1 order to fulfill',
      icon: '✅',
      color: 'text-blue-600'
    },
    {
      title: '3 payments to capture',
      icon: '💳',
      color: 'text-green-600'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Live Monitoring Section */}
      <LiveMonitoring />
      
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/analytics')}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Last 30 days</span>
          </button>
          <button 
            onClick={() => navigate('/analytics')}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <span>All channels</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600">2 live visitors</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{metric.icon}</span>
                <h3 className="text-sm font-medium text-gray-600">{metric.title}</h3>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-gray-900">{metric.value}</span>
              <div className={`flex items-center space-x-1 text-sm ${
                metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.trend === 'up' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
                  </svg>
                )}
                <span>{metric.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Chart */}
      <div className="metric-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Sessions</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Sep 8-Oct 8, 2025</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-200 rounded-full"></div>
              <span className="text-sm text-gray-600">Aug 8-Sep 7, 2025</span>
            </div>
          </div>
        </div>
        
        {/* Simple Chart Placeholder */}
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-500">Performance chart will be displayed here</p>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {actionItems.map((item, index) => (
          <div key={index} className="metric-card">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{item.icon}</span>
              <span className={`font-medium ${item.color}`}>{item.title}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Congratulations Card */}
      {showCongrats && (
        <div className="metric-card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 relative">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Congratulations on reaching 10 orders!
              </h3>
              <p className="text-gray-600 mb-4">
                This is just the beginning of your journey. Keep pushing forward and watch your business grow with each new customer.
              </p>
              <button 
                onClick={() => navigate('/orders')}
                className="btn-primary"
              >
                View orders report
              </button>
            </div>
            <div className="ml-8">
              {/* Butterfly Pea Symbol */}
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-4xl">🦋</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowCongrats(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

export default Dashboard
