import React, { useState } from 'react'
import { DollarSign, CreditCard, Gift, TrendingUp, Clock, CheckCircle, ArrowRight, Star, Calendar, Wallet, XCircle } from 'lucide-react'

// Coins calculation utility
const COINS_CONVERSION_RATE = 10 // 10 coins = ₹1

const rupeesToCoins = (rupees: number): number => {
  return Math.floor(rupees * COINS_CONVERSION_RATE)
}

const coinsToRupees = (coins: number): number => {
  return coins / COINS_CONVERSION_RATE
}

const formatCoins = (coins: number): string => {
  return `${coins} coins`
}

interface CashbackOffer {
  id: string
  title: string
  description: string
  cashbackPercentage: number
  minOrderValue: number
  maxCashback: number
  validUntil: string
  category: string
  isActive: boolean
  terms: string[]
}

interface CashbackTransaction {
  id: string
  orderId: string
  amount: number
  status: 'pending' | 'approved' | 'credited' | 'expired'
  date: string
  productName: string
  orderValue: number
}

interface CashbackWallet {
  totalEarned: number
  availableBalance: number
  pendingAmount: number
  usedAmount: number
  nextPayoutDate: string
  payoutMethod: string
}

export default function CashbackSystem() {
  const [cashbackWallet] = useState<CashbackWallet>({
    totalEarned: rupeesToCoins(2500), // ₹2500 = 25,000 coins
    availableBalance: rupeesToCoins(1800), // ₹1800 = 18,000 coins
    pendingAmount: rupeesToCoins(700), // ₹700 = 7,000 coins
    usedAmount: rupeesToCoins(700), // ₹700 = 7,000 coins
    nextPayoutDate: '2024-02-15',
    payoutMethod: 'Bank Transfer'
  })

  const [cashbackOffers] = useState<CashbackOffer[]>([
    {
      id: '1',
      title: 'Skincare Essentials',
      description: 'Get cashback on all skincare products',
      cashbackPercentage: 5,
      minOrderValue: 1000,
      maxCashback: 500,
      validUntil: '2024-02-28',
      category: 'Skincare',
      isActive: true,
      terms: ['Minimum order value ₹1000', 'Maximum cashback ₹500', 'Valid on skincare products only']
    },
    {
      id: '2',
      title: 'Premium Products',
      description: 'Extra cashback on premium skincare range',
      cashbackPercentage: 8,
      minOrderValue: 2000,
      maxCashback: 1000,
      validUntil: '2024-03-15',
      category: 'Premium',
      isActive: true,
      terms: ['Minimum order value ₹2000', 'Maximum cashback ₹1000', 'Valid on premium products only']
    },
    {
      id: '3',
      title: 'First Time Buyer',
      description: 'Special cashback for new customers',
      cashbackPercentage: 10,
      minOrderValue: 500,
      maxCashback: 300,
      validUntil: '2024-02-20',
      category: 'New Customer',
      isActive: true,
      terms: ['For first-time buyers only', 'Minimum order value ₹500', 'Maximum cashback ₹300']
    },
    {
      id: '4',
      title: 'Bundle Offers',
      description: 'Get more cashback on product bundles',
      cashbackPercentage: 12,
      minOrderValue: 3000,
      maxCashback: 1500,
      validUntil: '2024-03-30',
      category: 'Bundles',
      isActive: true,
      terms: ['Minimum order value ₹3000', 'Maximum cashback ₹1500', 'Valid on bundle offers only']
    }
  ])

  const [transactions] = useState<CashbackTransaction[]>([
    {
      id: '1',
      orderId: 'ORD-2024-001',
      amount: 150,
      status: 'credited',
      date: '2024-01-15',
      productName: 'Face Cleanser + Moisturizer',
      orderValue: 1500
    },
    {
      id: '2',
      orderId: 'ORD-2024-002',
      amount: 200,
      status: 'approved',
      date: '2024-01-20',
      productName: 'Anti-Aging Serum',
      orderValue: 2000
    },
    {
      id: '3',
      orderId: 'ORD-2024-003',
      amount: 100,
      status: 'pending',
      date: '2024-01-25',
      productName: 'Sunscreen SPF 50',
      orderValue: 1000
    },
    {
      id: '4',
      orderId: 'ORD-2024-004',
      amount: 300,
      status: 'credited',
      date: '2024-01-10',
      productName: 'Complete Skincare Kit',
      orderValue: 3000
    }
  ])

  const [showRedeemModal, setShowRedeemModal] = useState(false)
  const [redeemAmount, setRedeemAmount] = useState(0)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200'
      case 'approved': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200'
      case 'credited': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200'
      case 'expired': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'credited': return <CheckCircle className="h-4 w-4" />
      case 'expired': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const handleRedeemCashback = () => {
    if (redeemAmount > cashbackWallet.availableBalance) {
      alert('Insufficient balance')
      return
    }
    if (redeemAmount < 100) {
      alert('Minimum redemption amount is ₹100')
      return
    }
    alert(`Cashback redemption request submitted for ₹${redeemAmount}`)
    setShowRedeemModal(false)
    setRedeemAmount(0)
  }

  const calculateCashback = (orderValue: number, offer: CashbackOffer) => {
    const cashback = (orderValue * offer.cashbackPercentage) / 100
    return Math.min(cashback, offer.maxCashback)
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Nefol Coins Program
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Earn coins on every purchase and redeem them for future orders
        </p>
      </div>

      {/* Points Wallet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Available Coins</h3>
              <p className="text-3xl font-bold">{formatCoins(cashbackWallet.availableBalance)}</p>
            </div>
            <Wallet className="h-8 w-8" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Total Earned</h3>
              <p className="text-3xl font-bold">{formatCoins(cashbackWallet.totalEarned)}</p>
            </div>
            <TrendingUp className="h-8 w-8" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Pending</h3>
              <p className="text-3xl font-bold">{formatCoins(cashbackWallet.pendingAmount)}</p>
            </div>
            <Clock className="h-8 w-8" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Used</h3>
              <p className="text-3xl font-bold">{formatCoins(cashbackWallet.usedAmount)}</p>
            </div>
            <CreditCard className="h-8 w-8" />
          </div>
        </div>
      </div>

      {/* Redeem Points */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Redeem Points
          </h2>
          <button
            onClick={() => setShowRedeemModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Redeem Now
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Next Payout
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {new Date(cashbackWallet.nextPayoutDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Payout Method
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {cashbackWallet.payoutMethod}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Minimum Redemption
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              ₹100
            </p>
          </div>
        </div>
      </div>

      {/* Active Cashback Offers */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Active Cashback Offers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cashbackOffers.map((offer) => (
            <div key={offer.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {offer.title}
                </h3>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                  {offer.cashbackPercentage}% Cashback
                </span>
              </div>
              
              <p className="text-slate-600 dark:text-slate-400 mb-3">
                {offer.description}
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Min Order:</span>
                  <span className="font-semibold">₹{offer.minOrderValue}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Max Cashback:</span>
                  <span className="font-semibold">₹{offer.maxCashback}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Valid Until:</span>
                  <span className="font-semibold">{new Date(offer.validUntil).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                  {offer.category}
                </span>
                <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                  Shop Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cashback Calculator */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Cashback Calculator
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Order Value (₹)
            </label>
            <input
              type="number"
              placeholder="Enter order value"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Select Offer
            </label>
            <select className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100">
              <option>Skincare Essentials (5%)</option>
              <option>Premium Products (8%)</option>
              <option>First Time Buyer (10%)</option>
              <option>Bundle Offers (12%)</option>
            </select>
          </div>
        </div>
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-green-800 dark:text-green-200 font-semibold">
              Estimated Cashback:
            </span>
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              ₹150
            </span>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Transaction History
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Order Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Cashback
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                    {transaction.orderId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {transaction.productName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    ₹{transaction.orderValue}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    ₹{transaction.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                      {getStatusIcon(transaction.status)}
                      <span className="ml-1">{transaction.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-4">How Cashback Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold">1</span>
            </div>
            <h3 className="font-semibold mb-2">Shop & Earn</h3>
            <p className="text-sm opacity-90">
              Make purchases and automatically earn cashback based on active offers
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold">2</span>
            </div>
            <h3 className="font-semibold mb-2">Cashback Processing</h3>
            <p className="text-sm opacity-90">
              Your cashback is processed within 24-48 hours after order confirmation
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold">3</span>
            </div>
            <h3 className="font-semibold mb-2">Redeem & Save</h3>
            <p className="text-sm opacity-90">
              Use your cashback balance to get discounts on future purchases
            </p>
          </div>
        </div>
      </div>

      {/* Redeem Modal */}
      {showRedeemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Redeem Cashback
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Available Balance: ₹{cashbackWallet.availableBalance}
                </label>
                <input
                  type="number"
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(Number(e.target.value))}
                  placeholder="Enter amount to redeem"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Payout Method
                </label>
                <select className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100">
                  <option>Bank Transfer</option>
                  <option>UPI</option>
                  <option>Wallet Credit</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setShowRedeemModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRedeemCashback}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Redeem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
