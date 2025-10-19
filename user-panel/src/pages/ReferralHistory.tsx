import React, { useState, useEffect } from 'react'
import { ArrowLeft, Users, Calendar, DollarSign, Package, TrendingUp, Filter, Download } from 'lucide-react'

interface ReferralData {
  id: string
  name: string
  email: string
  signup_date: string
  total_orders: number
  total_spent: number
  commission_earned: number
  status: 'active' | 'inactive'
  last_order_date?: string
  conversion_rate: number
}

interface ReferralStats {
  total_referrals: number
  active_referrals: number
  total_commission: number
  average_order_value: number
  conversion_rate: number
}

export default function ReferralHistory() {
  const [referrals, setReferrals] = useState<ReferralData[]>([])
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'commission' | 'orders'>('date')

  useEffect(() => {
    fetchReferralHistory()
  }, [])

  const fetchReferralHistory = async () => {
    try {
      // Mock data - replace with actual API call later
      const mockReferrals: ReferralData[] = [
        {
          id: '1',
          name: 'Priya Sharma',
          email: 'priya@example.com',
          signup_date: '2024-11-15',
          total_orders: 3,
          total_spent: 2500,
          commission_earned: 250,
          status: 'active',
          last_order_date: '2024-12-10',
          conversion_rate: 85
        },
        {
          id: '2',
          name: 'Raj Patel',
          email: 'raj@example.com',
          signup_date: '2024-11-10',
          total_orders: 1,
          total_spent: 1200,
          commission_earned: 120,
          status: 'active',
          last_order_date: '2024-11-20',
          conversion_rate: 60
        },
        {
          id: '3',
          name: 'Sneha Gupta',
          email: 'sneha@example.com',
          signup_date: '2024-10-28',
          total_orders: 5,
          total_spent: 4500,
          commission_earned: 450,
          status: 'active',
          last_order_date: '2024-12-05',
          conversion_rate: 95
        },
        {
          id: '4',
          name: 'Amit Kumar',
          email: 'amit@example.com',
          signup_date: '2024-10-15',
          total_orders: 0,
          total_spent: 0,
          commission_earned: 0,
          status: 'inactive',
          conversion_rate: 0
        },
        {
          id: '5',
          name: 'Kavya Singh',
          email: 'kavya@example.com',
          signup_date: '2024-09-20',
          total_orders: 2,
          total_spent: 1800,
          commission_earned: 180,
          status: 'inactive',
          last_order_date: '2024-10-15',
          conversion_rate: 70
        }
      ]

      const mockStats: ReferralStats = {
        total_referrals: mockReferrals.length,
        active_referrals: mockReferrals.filter(r => r.status === 'active').length,
        total_commission: mockReferrals.reduce((sum, r) => sum + r.commission_earned, 0),
        average_order_value: mockReferrals.filter(r => r.total_orders > 0).reduce((sum, r) => sum + (r.total_spent / r.total_orders), 0) / mockReferrals.filter(r => r.total_orders > 0).length || 0,
        conversion_rate: (mockReferrals.filter(r => r.total_orders > 0).length / mockReferrals.length) * 100
      }

      setReferrals(mockReferrals)
      setStats(mockStats)
    } catch (error) {
      console.error('Failed to fetch referral history:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredReferrals = referrals.filter(referral => {
    if (filter === 'all') return true
    return referral.status === filter
  })

  const sortedReferrals = [...filteredReferrals].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.signup_date).getTime() - new Date(a.signup_date).getTime()
      case 'commission':
        return b.commission_earned - a.commission_earned
      case 'orders':
        return b.total_orders - a.total_orders
      default:
        return 0
    }
  })

  const exportToCSV = () => {
    const csvContent = [
      ['Name', 'Email', 'Signup Date', 'Orders', 'Total Spent', 'Commission', 'Status', 'Conversion Rate'].join(','),
      ...sortedReferrals.map(referral => [
        referral.name,
        referral.email,
        referral.signup_date,
        referral.total_orders,
        referral.total_spent,
        referral.commission_earned,
        referral.status,
        referral.conversion_rate
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `referral-history-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <main className="py-10 dark:bg-slate-900 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </main>
    )
  }

  return (
    <main className="py-10 dark:bg-slate-900 min-h-screen">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => window.location.hash = '#/affiliate-partner'}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Affiliate Dashboard
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Referral History</h1>
              <p className="text-slate-600 dark:text-slate-400">Track and analyze your referral performance</p>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Referrals</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.total_referrals}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">Active Referrals</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.active_referrals}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Total Commission</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">₹{stats.total_commission.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Avg Order Value</p>
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">₹{stats.average_order_value.toFixed(0)}</p>
                </div>
                <Package className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">Conversion Rate</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.conversion_rate.toFixed(1)}%</p>
                </div>
                <Calendar className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        )}

        {/* Filters and Controls */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filter:</span>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'inactive')}
                  className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-slate-100"
                >
                  <option value="all">All Referrals</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'commission' | 'orders')}
                  className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-slate-100"
                >
                  <option value="date">Signup Date</option>
                  <option value="commission">Commission</option>
                  <option value="orders">Order Count</option>
                </select>
              </div>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Showing {sortedReferrals.length} of {referrals.length} referrals
            </div>
          </div>
        </div>

        {/* Referrals Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Referral</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Signup Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Spent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Commission</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {sortedReferrals.map((referral) => (
                  <tr key={referral.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{referral.name}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">{referral.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                      {new Date(referral.signup_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                      {referral.total_orders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                      ₹{referral.total_spent.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                      ₹{referral.commission_earned.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        referral.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {referral.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                      {referral.conversion_rate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {sortedReferrals.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold dark:text-slate-100 mb-2">No Referrals Found</h3>
            <p className="text-slate-600 dark:text-slate-400">No referrals match your current filter criteria</p>
          </div>
        )}
      </div>
    </main>
  )
}
