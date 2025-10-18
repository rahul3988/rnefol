import React, { useState } from 'react'

export default function GoogleYouTube() {
  const [isConnected, setIsConnected] = useState(false)
  const [analytics, setAnalytics] = useState({
    impressions: 12500,
    clicks: 890,
    ctr: 7.12,
    conversions: 45
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Google & YouTube</h1>
        <button 
          onClick={() => setIsConnected(!isConnected)}
          className={isConnected ? "btn-secondary" : "btn-primary"}
        >
          {isConnected ? 'Disconnect' : 'Connect Google'}
        </button>
      </div>

      {!isConnected ? (
        <div className="metric-card text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect Google Services</h2>
          <p className="text-gray-600 mb-6">Connect your Google Ads and YouTube accounts to manage campaigns and track performance.</p>
          <button 
            onClick={() => setIsConnected(true)}
            className="btn-primary"
          >
            Connect Google Account
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Connection Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="metric-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">Y</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">YouTube Channel</h3>
                    <p className="text-sm text-gray-600">Nefol Skincare</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">Connected</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">G</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Google Ads</h3>
                    <p className="text-sm text-gray-600">Nefol Campaigns</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">Connected</span>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { title: 'Impressions', value: analytics.impressions.toLocaleString(), icon: '👁️' },
              { title: 'Clicks', value: analytics.clicks.toLocaleString(), icon: '🖱️' },
              { title: 'CTR', value: `${analytics.ctr}%`, icon: '📊' },
              { title: 'Conversions', value: analytics.conversions.toString(), icon: '🎯' }
            ].map((stat, index) => (
              <div key={index} className="metric-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className="text-2xl">{stat.icon}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Campaigns */}
          <div className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Campaigns</h2>
              <button className="btn-primary">Create Campaign</button>
            </div>

            <div className="space-y-4">
              {[
                {
                  name: 'Skincare Awareness',
                  platform: 'YouTube',
                  status: 'active',
                  budget: '₹5,000',
                  spent: '₹3,200',
                  impressions: '8,500',
                  clicks: '340'
                },
                {
                  name: 'Product Launch',
                  platform: 'Google Ads',
                  status: 'paused',
                  budget: '₹10,000',
                  spent: '₹7,800',
                  impressions: '12,000',
                  clicks: '890'
                }
              ].map((campaign, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                      <p className="text-sm text-gray-600">{campaign.platform}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        campaign.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {campaign.status}
                      </span>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{campaign.spent} / {campaign.budget}</p>
                        <p className="text-xs text-gray-500">{campaign.clicks} clicks</p>
                      </div>
                      <div className="flex space-x-2">
                        <button className="btn-secondary text-xs px-2 py-1">Edit</button>
                        <button className="btn-secondary text-xs px-2 py-1">View</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}








