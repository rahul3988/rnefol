import React, { useState, useEffect } from 'react'
import { Coins, Gift, ShoppingBag, TrendingUp, Clock, Wallet } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getApiBase } from '../utils/apiBase'

interface Transaction {
  id: number
  amount: number
  type: 'earned' | 'redeemed' | 'purchase_bonus' | 'withdrawal_pending' | 'withdrawal_processing' | 'withdrawal_completed' | 'withdrawal_rejected' | 'withdrawal_failed' | 'referral_bonus' | 'order_bonus' | 'cashback'
  description: string
  date: string
  status?: 'pending' | 'processing' | 'completed' | 'rejected' | 'failed' | 'cancelled'
}

interface CashbackWallet {
  balance: number
  totalSpent: number
  transactions: Transaction[]
}

interface CoinTransaction {
  id: number
  amount: number
  type: string
  description: string
  status: string
  order_id?: number
  withdrawal_id?: number
  metadata?: any
  created_at: string
}

export default function NefolCoins() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [wallet, setWallet] = useState<CashbackWallet | null>(null)
  const [nefolCoins, setNefolCoins] = useState(0)
  const [coinTransactions, setCoinTransactions] = useState<CoinTransaction[]>([])

  useEffect(() => {
    fetchCoinsData()
    
    // Listen for updates from other pages
    const handleCoinsUpdate = () => {
      fetchCoinsData()
    }
    
    window.addEventListener('coinsUpdated', handleCoinsUpdate)
    
    // Auto-refresh every 30 seconds to catch status updates
    const refreshInterval = setInterval(() => {
      fetchCoinsData()
    }, 30000)
    
    return () => {
      window.removeEventListener('coinsUpdated', handleCoinsUpdate)
      clearInterval(refreshInterval)
    }
  }, [])

  const fetchCoinsData = async () => {
    try {
      // Don't show loading spinner on auto-refresh
      const isInitialLoad = coinTransactions.length === 0
      if (isInitialLoad) {
        setLoading(true)
      }
      
      const token = localStorage.getItem('token')
      
      // Fetch Nefol coins
      const coinsResponse = await fetch(`${getApiBase()}/api/nefol-coins`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (coinsResponse.ok) {
        const coinsData = await coinsResponse.json()
        setNefolCoins(coinsData.nefol_coins || 0)
      }

      // Fetch cashback wallet data
      const walletResponse = await fetch(`${getApiBase()}/api/cashback/wallet`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (walletResponse.ok) {
        const walletData = await walletResponse.json()
        setWallet(walletData)
      }

      // Fetch coin transaction history
      const transactionsResponse = await fetch(`${getApiBase()}/api/coin-transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json()
        // Handle both response formats: {data: [...]} or direct array
        const transactions = Array.isArray(transactionsData) ? transactionsData : (transactionsData.data || [])
        setCoinTransactions(transactions)
      }
    } catch (error) {
      console.error('Failed to fetch coins data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} mins ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hours ago`
    
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays} days ago`
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earned':
      case 'referral_bonus':
      case 'order_bonus':
      case 'cashback':
        return <TrendingUp className="w-5 h-5 text-green-600" />
      case 'redeemed':
        return <Gift className="w-5 h-5 text-blue-600" />
      case 'purchase_bonus':
        return <ShoppingBag className="w-5 h-5 text-purple-600" />
      case 'withdrawal_pending':
      case 'withdrawal_processing':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'withdrawal_completed':
        return <TrendingUp className="w-5 h-5 text-green-600" />
      case 'withdrawal_rejected':
      case 'withdrawal_failed':
        return <Coins className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'processing': 'bg-blue-100 text-blue-800 border-blue-300',
      'completed': 'bg-green-100 text-green-800 border-green-300',
      'rejected': 'bg-red-100 text-red-800 border-red-300',
      'failed': 'bg-red-100 text-red-800 border-red-300',
      'cancelled': 'bg-gray-100 text-gray-800 border-gray-300'
    }
    
    if (!status) return null
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles['pending']}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <main className="py-10 dark:bg-slate-900 min-h-screen">
        <div className="mx-auto max-w-4xl px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading your coins...</p>
          </div>
        </div>
      </main>
    )
  }

  const totalCoins = nefolCoins + (wallet?.balance || 0)

  return (
    <main className="py-10 dark:bg-slate-900 min-h-screen">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-4">
            <Coins className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Nefol Coins
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Earn coins with every purchase and enjoy exclusive rewards
          </p>
        </div>

        {/* Coins Balance Card */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-slate-800 dark:to-slate-800 rounded-2xl p-8 mb-8 border border-yellow-200 dark:border-slate-700">
          <div className="text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-2">Your Total Balance</p>
            <h2 className="text-6xl font-bold text-slate-900 dark:text-slate-100 mb-6">
              {totalCoins.toLocaleString()} Coins
            </h2>
            <div className="flex justify-center gap-6 text-sm mb-6">
              <div className="text-center">
                <p className="text-slate-500 dark:text-slate-400">Loyalty Points</p>
                <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">{nefolCoins}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-500 dark:text-slate-400">Cashback</p>
                <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">₹{wallet?.balance || 0}</p>
              </div>
            </div>
            {nefolCoins >= 10 && (
              <button
                onClick={() => window.location.hash = '#/user/coin-withdrawal'}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
              >
                <Wallet className="w-5 h-5" />
                Withdraw Coins
              </button>
            )}
          </div>
        </div>

        {/* How to Earn Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
            How to Earn Nefol Coins
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <ShoppingBag className="w-8 h-8 text-blue-600 mb-3" />
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Make a Purchase
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Earn coins for every purchase you make
              </p>
            </div>
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <Gift className="w-8 h-8 text-purple-600 mb-3" />
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Refer Friends
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Get coins when friends make purchases
              </p>
            </div>
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <TrendingUp className="w-8 h-8 text-green-600 mb-3" />
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Loyalty Rewards
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Earn 5% cashback on all orders
              </p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {wallet && wallet.totalSpent > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
              Your Statistics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Total Spent</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  ₹{wallet.totalSpent.toLocaleString()}
                </p>
              </div>
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Cashback Earned</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{wallet.balance.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
            Recent Transactions
          </h3>
          {coinTransactions.length > 0 ? (
            <div className="space-y-4">
              {coinTransactions.map((transaction) => {
                const isDebit = transaction.type.includes('withdrawal')
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {getTransactionIcon(transaction.type)}
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {transaction.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {formatDateTime(transaction.created_at)}
                          </p>
                          {getStatusBadge(transaction.status)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold text-lg ${
                          isDebit ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {isDebit ? '-' : '+'}
                        {transaction.amount}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">coins</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : wallet && wallet.transactions && wallet.transactions.length > 0 ? (
            <div className="space-y-4">
              {wallet.transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between border border-slate-200 dark:border-slate-700 rounded-lg p-4"
                >
                  <div className="flex items-center gap-4">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(transaction.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${
                        transaction.type === 'earned' || transaction.type === 'purchase_bonus'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'redeemed' ? '-' : '+'}
                      {transaction.amount}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400">
                No transactions yet. Start shopping to earn coins!
              </p>
              <a
                href="#/user/shop"
                className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Shopping
              </a>
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Ready to Earn More Coins?</h3>
          <p className="mb-6 text-blue-100">
            Check out our amazing products and start earning coins today!
          </p>
          <a
            href="#/user/shop"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Shop Now
          </a>
        </div>
      </div>
    </main>
  )
}

