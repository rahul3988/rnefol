import React, { useState, useEffect } from 'react'
import { Star, Gift, Users, Crown, TrendingUp, Award, Plus, Edit, Trash2 } from 'lucide-react'
import apiService from '../services/api'

interface LoyaltyProgram {
  id: number
  name: string
  description: string
  points_per_rupee: number
  referral_bonus: number
  vip_threshold: number
  status: string
  created_at: string
}

interface LoyaltyTier {
  id: string
  name: string
  minPoints: number
  benefits: string[]
  color: string
  icon: React.ReactNode
}

interface LoyaltyPoints {
  totalPoints: number
  availablePoints: number
  usedPoints: number
  tier: string
  nextTierPoints: number
}

interface ReferralData {
  totalReferrals: number
  successfulReferrals: number
  pendingReferrals: number
  referralCode: string
  referralReward: number
}

export default function LoyaltyProgram() {
  const [programs, setPrograms] = useState<LoyaltyProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    points_per_rupee: 1,
    referral_bonus: 100,
    vip_threshold: 1000,
    status: 'active'
  })

  useEffect(() => {
    fetchPrograms()
  }, [])

  const fetchPrograms = async () => {
    try {
      setLoading(true)
      const data = await apiService.getLoyaltyPrograms()
      setPrograms(data as LoyaltyProgram[])
    } catch (error) {
      console.error('Failed to fetch loyalty programs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiService.createLoyaltyProgram(formData)
      setShowForm(false)
      setFormData({
        name: '',
        description: '',
        points_per_rupee: 1,
        referral_bonus: 100,
        vip_threshold: 1000,
        status: 'active'
      })
      fetchPrograms()
    } catch (error) {
      console.error('Failed to create loyalty program:', error)
    }
  }

  const [loyaltyPoints, setLoyaltyPoints] = useState<LoyaltyPoints>({
    totalPoints: 1250,
    availablePoints: 850,
    usedPoints: 400,
    tier: 'Gold',
    nextTierPoints: 500
  })

  const [referralData, setReferralData] = useState<ReferralData>({
    totalReferrals: 12,
    successfulReferrals: 8,
    pendingReferrals: 4,
    referralCode: 'NEFOL2024',
    referralReward: 100
  })

  const loyaltyTiers: LoyaltyTier[] = [
    {
      id: 'bronze',
      name: 'Bronze',
      minPoints: 0,
      benefits: ['5% discount on all orders', 'Birthday surprise', 'Early access to sales'],
      color: 'bg-amber-600',
      icon: <Award className="h-5 w-5" />
    },
    {
      id: 'silver',
      name: 'Silver',
      minPoints: 500,
      benefits: ['10% discount on all orders', 'Free shipping', 'Exclusive products', 'Priority support'],
      color: 'bg-gray-400',
      icon: <Star className="h-5 w-5" />
    },
    {
      id: 'gold',
      name: 'Gold',
      minPoints: 1000,
      benefits: ['15% discount on all orders', 'Free express shipping', 'VIP customer service', 'Exclusive events', 'Personal beauty consultant'],
      color: 'bg-yellow-500',
      icon: <Crown className="h-5 w-5" />
    },
    {
      id: 'platinum',
      name: 'Platinum',
      minPoints: 2000,
      benefits: ['20% discount on all orders', 'Free worldwide shipping', '24/7 VIP support', 'Exclusive product launches', 'Personalized beauty routine', 'Free samples'],
      color: 'bg-purple-600',
      icon: <Crown className="h-5 w-5" />
    }
  ]

  const currentTier = loyaltyTiers.find(tier => tier.name === loyaltyPoints.tier) || loyaltyTiers[0]
  const nextTier = loyaltyTiers.find(tier => tier.minPoints > loyaltyPoints.totalPoints) || loyaltyTiers[loyaltyTiers.length - 1]

  const recentActivities = [
    { type: 'purchase', points: 50, description: 'Face Cleanser Purchase', date: '2 days ago' },
    { type: 'review', points: 25, description: 'Product Review', date: '1 week ago' },
    { type: 'referral', points: 100, description: 'Friend Referral', date: '2 weeks ago' },
    { type: 'birthday', points: 200, description: 'Birthday Bonus', date: '1 month ago' }
  ]

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Nefol Loyalty Program
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Earn points, unlock rewards, and enjoy exclusive benefits
        </p>
      </div>

      {/* Points Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Total Points</h3>
              <p className="text-3xl font-bold">{loyaltyPoints.totalPoints}</p>
            </div>
            <TrendingUp className="h-8 w-8" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Available Points</h3>
              <p className="text-3xl font-bold">{loyaltyPoints.availablePoints}</p>
            </div>
            <Gift className="h-8 w-8" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Current Tier</h3>
              <p className="text-2xl font-bold">{loyaltyPoints.tier}</p>
            </div>
            <Crown className="h-8 w-8" />
          </div>
        </div>
      </div>

      {/* Tier Progress */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Tier Progress
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">Current: {loyaltyPoints.tier}</span>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {loyaltyPoints.totalPoints} / {nextTier.minPoints} points
            </span>
          </div>
          
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ 
                width: `${Math.min((loyaltyPoints.totalPoints / nextTier.minPoints) * 100, 100)}%` 
              }}
            ></div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {nextTier.minPoints - loyaltyPoints.totalPoints} points to {nextTier.name}
            </span>
          </div>
        </div>
      </div>

      {/* Current Tier Benefits */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
        <div className="flex items-center mb-4">
          <div className={`${currentTier.color} text-white p-2 rounded-lg mr-3`}>
            {currentTier.icon}
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {currentTier.name} Tier Benefits
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentTier.benefits.map((benefit, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-slate-700 dark:text-slate-300">{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Referral Program */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Referral Program
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Your Referral Code
            </h3>
            <div className="flex items-center space-x-2">
              <input 
                type="text" 
                value={referralData.referralCode}
                readOnly
                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
              <button 
                onClick={() => {
                  try {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                      navigator.clipboard.writeText(referralData.referralCode);
                    } else {
                      // Fallback for older browsers
                      const textArea = document.createElement('textarea');
                      textArea.value = referralData.referralCode;
                      document.body.appendChild(textArea);
                      textArea.select();
                      document.execCommand('copy');
                      document.body.removeChild(textArea);
                    }
                  } catch (error) {
                    console.error('Failed to copy text:', error);
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = referralData.referralCode;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Copy
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Earn {referralData.referralReward} points for each successful referral
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Referral Stats
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Total Referrals:</span>
                <span className="font-semibold">{referralData.totalReferrals}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Successful:</span>
                <span className="font-semibold text-green-600">{referralData.successfulReferrals}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Pending:</span>
                <span className="font-semibold text-yellow-600">{referralData.pendingReferrals}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Recent Activities
        </h2>
        
        <div className="space-y-3">
          {recentActivities.map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                    +{activity.points}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {activity.description}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {activity.date}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How to Earn Points */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
          How to Earn Points
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="text-center p-4 border border-slate-200 dark:border-slate-600 rounded-lg">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 dark:text-blue-400 font-bold">₹</span>
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
              Make Purchases
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Earn 1 point for every ₹10 spent
            </p>
          </div>
          
          <div className="text-center p-4 border border-slate-200 dark:border-slate-600 rounded-lg">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
              Refer Friends
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Earn 100 points for each successful referral
            </p>
          </div>
          
          <div className="text-center p-4 border border-slate-200 dark:border-slate-600 rounded-lg">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <Star className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
              Write Reviews
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Earn 25 points for each product review
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
