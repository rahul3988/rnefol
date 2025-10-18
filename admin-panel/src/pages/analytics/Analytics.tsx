import React, { useState, useEffect } from 'react'

type AnalyticsData = {
  sessions: number
  pageViews: number
  bounceRate: number
  avgSessionDuration: string
  conversionRate: number
  revenue: number
  orders: number
  customers: number
}

type ChartData = {
  date: string
  sessions: number
  revenue: number
  orders: number
}

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    sessions: 0,
    pageViews: 0,
    bounceRate: 0,
    avgSessionDuration: '0:00',
    conversionRate: 0,
    revenue: 0,
    orders: 0,
    customers: 0
  })
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')

  const apiBase = (import.meta as any).env.VITE_API_URL || `http://${window.location.hostname}:4000`

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${apiBase}/api/analytics?range=${timeRange}`)
      const data = await res.json()
      setAnalyticsData(data.overview || analyticsData)
      setChartData(data.chartData || [])
    } catch (error) {
      console.error('Failed to load analytics:', error)
      setAnalyticsData({
        sessions: 0,
        pageViews: 0,
        bounceRate: 0,
        avgSessionDuration: '0:00',
        conversionRate: 0,
        revenue: 0,
        orders: 0,
        customers: 0
      })
      setChartData([])
    } finally {
      setLoading(false)
    }
  }

  const metrics = [
    {
      title: 'Sessions',
      value: analyticsData.sessions.toLocaleString(),
      change: '+9%',
      trend: 'up',
      icon: '📈'
    },
    {
      title: 'Page Views',
      value: analyticsData.pageViews.toLocaleString(),
      change: '+12%',
      trend: 'up',
      icon: '👁️'
    },
    {
      title: 'Bounce Rate',
      value: `${analyticsData.bounceRate}%`,
      change: '-2%',
      trend: 'down',
      icon: '📊'
    },
    {
      title: 'Avg. Session',
      value: analyticsData.avgSessionDuration,
      change: '+15%',
      trend: 'up',
      icon: '⏱️'
    },
    {
      title: 'Conversion Rate',
      value: `${analyticsData.conversionRate}%`,
      change: '+3%',
      trend: 'up',
      icon: '🎯'
    },
    {
      title: 'Revenue',
      value: `₹${analyticsData.revenue.toLocaleString()}`,
      change: '+137%',
      trend: 'up',
      icon: '💰'
    },
    {
      title: 'Orders',
      value: analyticsData.orders.toString(),
      change: '+25%',
      trend: 'up',
      icon: '📦'
    },
    {
      title: 'Customers',
      value: analyticsData.customers.toString(),
      change: '+18%',
      trend: 'up',
      icon: '👥'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <div className="flex items-center space-x-4">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button onClick={loadAnalyticsData} className="btn-secondary">
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              </div>
              <div className="text-2xl">{metric.icon}</div>
            </div>
            <div className="mt-4 flex items-center">
              <span className={`text-sm font-medium ${
                metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.change}
              </span>
              <span className="text-sm text-gray-500 ml-2">vs last period</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sessions Chart */}
        <div className="metric-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sessions Over Time</h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {chartData.map((data, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div 
                  className="bg-brand-secondary rounded-t w-full mb-2"
                  style={{ height: `${(data.sessions / Math.max(...chartData.map(d => d.sessions))) * 200}px` }}
                ></div>
                <span className="text-xs text-gray-500">{new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="metric-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Over Time</h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {chartData.map((data, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div 
                  className="bg-green-500 rounded-t w-full mb-2"
                  style={{ height: `${(data.revenue / Math.max(...chartData.map(d => d.revenue))) * 200}px` }}
                ></div>
                <span className="text-xs text-gray-500">{new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Pages */}
      <div className="metric-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Pages</h3>
        <div className="space-y-3">
          {[
            { page: '/', views: 1250, unique: 980 },
            { page: '/shop', views: 890, unique: 720 },
            { page: '/product/nefol-aprajita', views: 650, unique: 580 },
            { page: '/skincare', views: 420, unique: 380 },
            { page: '/ingredients', views: 320, unique: 290 }
          ].map((page, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div>
                <p className="font-medium text-gray-900">{page.page}</p>
                <p className="text-sm text-gray-500">{page.unique} unique views</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{page.views}</p>
                <p className="text-sm text-gray-500">total views</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}








