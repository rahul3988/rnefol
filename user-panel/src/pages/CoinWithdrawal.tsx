import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getApiBase } from '../utils/apiBase'
import { 
  Wallet, 
  ArrowLeft, 
  Building2, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react'

interface Withdrawal {
  id: number
  amount: number
  withdrawal_method: string
  account_holder_name: string
  account_number?: string
  ifsc_code?: string
  bank_name?: string
  upi_id?: string
  status: 'pending' | 'processing' | 'completed' | 'rejected' | 'failed'
  transaction_id?: string
  admin_notes?: string
  rejection_reason?: string
  created_at: string
  processed_at?: string
}

export default function CoinWithdrawal() {
  const { user } = useAuth()
  const [nefolCoins, setNefolCoins] = useState(0)
  const [loading, setLoading] = useState(false)
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    withdrawal_method: 'upi',
    account_holder_name: '',
    account_number: '',
    ifsc_code: '',
    bank_name: '',
    upi_id: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchCoinsData()
    fetchWithdrawals()
    
    // Auto-refresh every 30 seconds to catch status updates from admin
    const refreshInterval = setInterval(() => {
      fetchWithdrawals()
      fetchCoinsData()
    }, 30000)
    
    return () => {
      clearInterval(refreshInterval)
    }
  }, [])

  const fetchCoinsData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`${getApiBase()}/api/nefol-coins`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setNefolCoins(data.nefol_coins || 0)
      }
    } catch (error) {
      console.error('Failed to fetch coins:', error)
    }
  }

  const fetchWithdrawals = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`${getApiBase()}/api/coin-withdrawals`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setWithdrawals(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount'
    } else if (parseFloat(formData.amount) > nefolCoins) {
      newErrors.amount = 'Insufficient coins. You have ' + nefolCoins + ' coins available.'
    }

    if (!formData.account_holder_name) {
      newErrors.account_holder_name = 'Account holder name is required'
    }

    if (formData.withdrawal_method === 'bank') {
      if (!formData.account_number) {
        newErrors.account_number = 'Account number is required'
      }
      if (!formData.ifsc_code) {
        newErrors.ifsc_code = 'IFSC code is required'
      }
      if (!formData.bank_name) {
        newErrors.bank_name = 'Bank name is required'
      }
    } else {
      if (!formData.upi_id) {
        newErrors.upi_id = 'UPI ID is required'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Please login to continue')
        return
      }

      const payload: any = {
        amount: parseFloat(formData.amount),
        withdrawal_method: formData.withdrawal_method,
        account_holder_name: formData.account_holder_name
      }

      if (formData.withdrawal_method === 'bank') {
        payload.account_number = formData.account_number
        payload.ifsc_code = formData.ifsc_code
        payload.bank_name = formData.bank_name
      } else {
        payload.upi_id = formData.upi_id
      }

      const response = await fetch(`${getApiBase()}/api/coin-withdrawals`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (response.ok) {
        alert('Withdrawal request submitted successfully!')
        setShowForm(false)
        setFormData({
          amount: '',
          withdrawal_method: 'upi',
          account_holder_name: '',
          account_number: '',
          ifsc_code: '',
          bank_name: '',
          upi_id: ''
        })
        // Refresh all data
        await fetchCoinsData()
        await fetchWithdrawals()
        
        // Trigger a custom event to refresh coins page
        const event = new CustomEvent('coinsUpdated')
        window.dispatchEvent(event)
      } else {
        alert(data.message || 'Failed to submit withdrawal request')
      }
    } catch (error) {
      console.error('Error submitting withdrawal:', error)
      alert('Failed to submit withdrawal request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'rejected':
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'processing': 'bg-blue-100 text-blue-800 border-blue-300',
      'completed': 'bg-green-100 text-green-800 border-green-300',
      'rejected': 'bg-red-100 text-red-800 border-red-300',
      'failed': 'bg-red-100 text-red-800 border-red-300'
    }
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles['pending']}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => window.location.hash = '#/user/profile'}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Coin Withdrawal</h1>
            <p className="text-slate-600 dark:text-slate-400">Withdraw your Nefol coins to bank or UPI</p>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-slate-800 dark:to-slate-800 rounded-2xl p-6 mb-8 border border-yellow-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 dark:text-slate-400 mb-2">Available Coins</p>
              <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Wallet className="w-8 h-8 text-orange-500" />
                {nefolCoins}
              </h2>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
            >
              {showForm ? 'Cancel' : 'Request Withdrawal'}
            </button>
          </div>
        </div>

        {/* Withdrawal Form */}
        {showForm && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-8 border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
              Request Withdrawal
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Amount (Coins)
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  min="1"
                  max={nefolCoins}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.amount ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                  } bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500`}
                  placeholder="Enter amount to withdraw"
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.amount}
                  </p>
                )}
                <p className="mt-1 text-sm text-slate-500">
                  Minimum withdrawal: 10 coins
                </p>
              </div>

              {/* Withdrawal Method */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Withdrawal Method
                </label>
                <select
                  name="withdrawal_method"
                  value={formData.withdrawal_method}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="upi">UPI Transfer</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>

              {/* Account Holder Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  name="account_holder_name"
                  value={formData.account_holder_name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.account_holder_name ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                  } bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500`}
                  placeholder="Enter account holder name"
                />
                {errors.account_holder_name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.account_holder_name}
                  </p>
                )}
              </div>

              {/* UPI Fields */}
              {formData.withdrawal_method === 'upi' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    UPI ID
                  </label>
                  <input
                    type="text"
                    name="upi_id"
                    value={formData.upi_id}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.upi_id ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                    } bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500`}
                    placeholder="yourname@upi"
                  />
                  {errors.upi_id && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.upi_id}
                    </p>
                  )}
                </div>
              )}

              {/* Bank Fields */}
              {formData.withdrawal_method === 'bank' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      name="account_number"
                      value={formData.account_number}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.account_number ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                      } bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500`}
                      placeholder="Enter account number"
                    />
                    {errors.account_number && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.account_number}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        name="ifsc_code"
                        value={formData.ifsc_code}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-lg border ${
                          errors.ifsc_code ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                        } bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500`}
                        placeholder="Enter IFSC code"
                      />
                      {errors.ifsc_code && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.ifsc_code}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        name="bank_name"
                        value={formData.bank_name}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-lg border ${
                          errors.bank_name ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                        } bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500`}
                        placeholder="Enter bank name"
                      />
                      {errors.bank_name && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.bank_name}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        )}

        {/* Withdrawal History */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
            Withdrawal History
          </h2>

          {withdrawals.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">No withdrawal requests yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {withdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {withdrawal.withdrawal_method === 'bank' ? (
                        <Building2 className="w-6 h-6 text-blue-500" />
                      ) : (
                        <CreditCard className="w-6 h-6 text-purple-500" />
                      )}
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                          ₹{withdrawal.amount}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {new Date(withdrawal.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(withdrawal.status)}
                      {getStatusBadge(withdrawal.status)}
                    </div>
                  </div>

                  <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <p>
                      <span className="font-semibold">Method:</span>{' '}
                      {withdrawal.withdrawal_method === 'bank' ? 'Bank Transfer' : 'UPI Transfer'}
                    </p>
                    <p>
                      <span className="font-semibold">Account:</span> {withdrawal.account_holder_name}
                    </p>
                    {withdrawal.withdrawal_method === 'bank' && (
                      <p>
                        <span className="font-semibold">Bank:</span> {withdrawal.bank_name}
                      </p>
                    )}
                    {withdrawal.withdrawal_method === 'upi' && withdrawal.upi_id && (
                      <p>
                        <span className="font-semibold">UPI:</span> {withdrawal.upi_id}
                      </p>
                    )}
                    {withdrawal.transaction_id && (
                      <p>
                        <span className="font-semibold">Transaction ID:</span> {withdrawal.transaction_id}
                      </p>
                    )}
                    {withdrawal.rejection_reason && (
                      <p className="text-red-600">
                        <span className="font-semibold">Reason:</span> {withdrawal.rejection_reason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
