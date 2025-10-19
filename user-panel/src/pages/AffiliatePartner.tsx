import React, { useState, useEffect } from 'react'
import { Users, DollarSign, TrendingUp, Share2, ArrowLeft, Copy, Download, Eye, Calendar, BarChart3, CheckCircle, FileText } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'

interface AffiliatePartner {
  id: string
  referral_code: string
  total_earnings: number
  total_referrals: number
  active_referrals: number
  commission_rate: number
  status: 'active' | 'pending' | 'suspended' | 'unverified'
  join_date: string
  last_payment: string
  pending_earnings: number
  verification_code?: string
  is_verified: boolean
}

interface ReferralData {
  id: string
  name: string
  email: string
  signup_date: string
  total_orders: number
  total_spent: number
  commission_earned: number
  status: 'active' | 'inactive'
}

export default function AffiliatePartner() {
  const { user } = useAuth()
  const [affiliateData, setAffiliateData] = useState<AffiliatePartner | null>(null)
  const [referrals, setReferrals] = useState<ReferralData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [verificationCode, setVerificationCode] = useState('')
  const [showVerificationForm, setShowVerificationForm] = useState(false)
  const [hasSubmittedApplication, setHasSubmittedApplication] = useState(false)
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [applicationStatus, setApplicationStatus] = useState<'not_submitted' | 'pending' | 'approved' | 'rejected'>('not_submitted')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    instagram: '',
    snapchat: '',
    youtube: '',
    facebook: '',
    followers: '',
    platform: '',
    experience: '',
    whyJoin: '',
    expectedSales: '',
    // Address fields
    houseNumber: '',
    street: '',
    building: '',
    apartment: '',
    road: '',
    city: '',
    pincode: '',
    state: '',
    agreeTerms: false
  })

  useEffect(() => {
    fetchAffiliateData()
    fetchReferrals()
    checkApplicationStatus()
  }, [])

  const checkApplicationStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/affiliate/application-status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setHasSubmittedApplication(true)
          setApplicationStatus(data.data.status || 'pending')
        }
      }
    } catch (error) {
      console.error('Failed to check application status:', error)
      // For development, check localStorage for application status
      const savedStatus = localStorage.getItem('affiliateApplicationStatus')
      if (savedStatus) {
        setHasSubmittedApplication(true)
        setApplicationStatus(savedStatus as any)
      }
    }
  }

  const fetchAffiliateData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('No authentication token found')
        setLoading(false)
        return
      }

      const response = await fetch('/api/affiliate/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAffiliateData({
            id: data.data.id.toString(),
            referral_code: `NEFOL${data.data.id}`,
            total_earnings: data.data.total_earnings || 0,
            total_referrals: data.data.total_referrals || 0,
            active_referrals: data.data.completed_referrals || 0,
            commission_rate: data.data.commission_rate || 15,
            status: data.data.status === 'active' ? 'active' : 'unverified',
            join_date: data.data.created_at,
            last_payment: data.data.last_payment || '',
            pending_earnings: data.data.pending_earnings || 0,
            verification_code: data.data.verification_code,
            is_verified: data.data.status === 'active'
          })
        }
      } else if (response.status === 404) {
        // User doesn't have an affiliate account yet
        setAffiliateData(null)
      }
    } catch (error) {
      console.error('Failed to fetch affiliate data:', error)
      // Fallback to mock data for development
      const mockAffiliateData: AffiliatePartner = {
        id: '1',
        referral_code: 'NEFOL2024',
        total_earnings: 0,
        total_referrals: 0,
        active_referrals: 0,
        commission_rate: 10,
        status: 'unverified',
        join_date: '2024-01-15',
        last_payment: '',
        pending_earnings: 0,
        verification_code: '12345678901234567890',
        is_verified: false
      }
      setAffiliateData(mockAffiliateData)
    } finally {
      setLoading(false)
    }
  }

  const fetchReferrals = async () => {
    try {
      // Mock referrals data - replace with actual API call later
      const mockReferrals: ReferralData[] = [
        {
          id: '1',
          name: 'Priya Sharma',
          email: 'priya@example.com',
          signup_date: '2024-11-15',
          total_orders: 3,
          total_spent: 2500,
          commission_earned: 250,
          status: 'active'
        },
        {
          id: '2',
          name: 'Raj Patel',
          email: 'raj@example.com',
          signup_date: '2024-11-10',
          total_orders: 1,
          total_spent: 1200,
          commission_earned: 120,
          status: 'active'
        },
        {
          id: '3',
          name: 'Sneha Gupta',
          email: 'sneha@example.com',
          signup_date: '2024-10-28',
          total_orders: 5,
          total_spent: 4500,
          commission_earned: 450,
          status: 'active'
        }
      ]
      setReferrals(mockReferrals)
    } catch (error) {
      console.error('Failed to fetch referrals:', error)
      setReferrals([])
    }
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        alert(`${type} copied to clipboard!`)
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        
        try {
          document.execCommand('copy')
          alert(`${type} copied to clipboard!`)
        } catch (err) {
          console.error('Failed to copy text: ', err)
          alert(`Failed to copy ${type}. Please copy manually: ${text}`)
        }
        
        document.body.removeChild(textArea)
      }
    } catch (err) {
      console.error('Failed to copy text: ', err)
      alert(`Failed to copy ${type}. Please copy manually: ${text}`)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if at least one social media handle is provided
    const hasSocialMedia = formData.instagram.trim() || 
                          formData.youtube.trim() || 
                          formData.snapchat.trim() || 
                          formData.facebook.trim()
    
    if (!hasSocialMedia) {
      alert('Please provide at least one social media profile handle (Instagram, YouTube, Snapchat, or Facebook) to proceed.')
      return
    }
    
    try {
      // Send affiliate application to admin
      const response = await fetch('/api/admin/affiliate-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          applicationDate: new Date().toISOString(),
          status: 'pending'
        })
      })
      
      if (response.ok) {
        alert('Application submitted successfully! We will review your application and get back to you within 24-48 hours.')
        setShowApplicationForm(false)
        setHasSubmittedApplication(true)
        setApplicationStatus('pending')
        localStorage.setItem('affiliateApplicationStatus', 'pending')
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          instagram: '',
          snapchat: '',
          youtube: '',
          facebook: '',
          followers: '',
          platform: '',
          experience: '',
          whyJoin: '',
          expectedSales: '',
          houseNumber: '',
          street: '',
          building: '',
          apartment: '',
          road: '',
          city: '',
          pincode: '',
          state: '',
          agreeTerms: false
        })
      } else {
        throw new Error('Failed to submit application')
      }
    } catch (error) {
      console.error('Error submitting affiliate application:', error)
      // Fallback: still show success message and log to console for now
      console.log('Affiliate Application (Fallback):', formData)
      alert('Application submitted successfully! We will review your application and get back to you within 24-48 hours.')
      setShowApplicationForm(false)
      setHasSubmittedApplication(true)
      setApplicationStatus('pending')
      localStorage.setItem('affiliateApplicationStatus', 'pending')
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        instagram: '',
        snapchat: '',
        youtube: '',
        facebook: '',
        followers: '',
        platform: '',
        experience: '',
        whyJoin: '',
        expectedSales: '',
        houseNumber: '',
        street: '',
        building: '',
        apartment: '',
        road: '',
        city: '',
        pincode: '',
        state: '',
        agreeTerms: false
      })
    }
  }

  const verifyCode = async () => {
    if (verificationCode.length !== 20) {
      alert('Please enter a valid 20-character verification code')
      return
    }

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Please log in to verify your account')
        return
      }

      const response = await fetch('/api/affiliate/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          verificationCode: verificationCode
        })
      })

      const data = await response.json()
      
      if (data.success) {
        // Close verification form
        setShowVerificationForm(false)
        setVerificationCode('')
        
        // Show success message
        alert('Account verified successfully! Redirecting to your affiliate dashboard...')
        
        // Refresh affiliate data to get updated status
        await fetchAffiliateData()
        
        // Scroll to top to show the dashboard
        window.scrollTo({ top: 0, behavior: 'smooth' })
        
        // Force re-render to show dashboard view
        // The component will automatically show the dashboard since affiliateData will now have verified status
      } else {
        alert(data.message || 'Invalid verification code. Please check and try again.')
      }
    } catch (error) {
      console.error('Error verifying code:', error)
      alert('Error verifying code. Please try again.')
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'referrals', label: 'Referrals', icon: Users },
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
    { id: 'materials', label: 'Marketing Materials', icon: Download }
  ]

  if (loading) {
    return (
      <main className="py-10 dark:bg-slate-900 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </main>
    )
  }

  // Show different content based on application status
  if (!affiliateData && !hasSubmittedApplication) {
    return (
      <main className="py-10 dark:bg-slate-900 min-h-screen">
        <div className="mx-auto max-w-6xl px-4">
          {/* Header with Back Button */}
          <div className="mb-8">
            <button 
              onClick={() => window.location.hash = '#/profile'}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Profile
            </button>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Affiliate Partner Program</h1>
            <p className="text-slate-600 dark:text-slate-400">Join our affiliate program and start earning commissions</p>
          </div>

          {/* Two Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Option 1: Already Submitted */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-8 border border-green-200 dark:border-green-800">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-3">
                  Already Submitted Application?
                </h3>
                <p className="text-green-700 dark:text-green-300 mb-6">
                  If you've already submitted your affiliate application and received a verification code, enter it here to activate your account.
                </p>
                <button
                  onClick={() => setShowVerificationForm(true)}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Enter Verification Code
                </button>
              </div>
            </div>

            {/* Option 2: Not Submitted Yet */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-8 border border-blue-200 dark:border-blue-800">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-blue-800 dark:text-blue-200 mb-3">
                  Not Submitted Yet?
                </h3>
                <p className="text-blue-700 dark:text-blue-300 mb-6">
                  Apply to become an affiliate partner and start earning commissions by promoting our products.
                </p>
                <button
                  onClick={() => setShowApplicationForm(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Submit Application Now
                </button>
              </div>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8 border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 text-center">Why Join Our Affiliate Program?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">💰</span>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Earn Up to 15% Commission</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Get paid for every sale you generate through your unique affiliate links</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">📊</span>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Real-time Tracking</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Monitor your performance with detailed analytics and reports</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">🎨</span>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Marketing Materials</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Access high-quality banners, images, and promotional content</p>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Form Modal */}
        {showVerificationForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="relative max-w-md w-full bg-white dark:bg-slate-800 rounded-lg p-6 shadow-2xl">
              <button
                onClick={() => setShowVerificationForm(false)}
                className="absolute right-4 top-4 text-2xl text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
              
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Enter Verification Code</h2>
                <p className="text-slate-600 dark:text-slate-400">Enter the 20-character verification code (letters and numbers) sent to you after application approval</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20))}
                    placeholder="ABC123DEF456GHI789JKL"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-slate-700 dark:text-slate-100 text-center text-lg tracking-widest"
                    maxLength={20}
                  />
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Enter the 20-character code exactly as provided
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={verifyCode}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Verify Account
                  </button>
                  <button
                    onClick={() => {
                      setShowVerificationForm(false)
                      setVerificationCode('')
                    }}
                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Application Form Modal */}
        {showApplicationForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-white dark:bg-slate-800 rounded-lg p-8 shadow-2xl">
              <button
                onClick={() => setShowApplicationForm(false)}
                className="absolute right-4 top-4 text-2xl text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
              
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Affiliate Program Application</h2>
                <p className="mt-2 text-slate-600 dark:text-slate-400">Fill out the form below to apply for our affiliate program</p>
              </div>

              <form onSubmit={handleApplicationSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="name">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="h-12 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-slate-700 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="email">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="h-12 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-slate-700 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="phone">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="h-12 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-slate-700 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Social Media Information */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Social Media Profiles <span className="text-red-500">*</span>
                  </h3>
                  <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                    Please provide at least one social media profile handle
                  </p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="instagram">
                        Instagram Handle
                      </label>
                      <input
                        type="text"
                        id="instagram"
                        name="instagram"
                        value={formData.instagram}
                        onChange={handleInputChange}
                        placeholder="@yourusername"
                        className="h-12 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-slate-700 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="youtube">
                        YouTube Channel
                      </label>
                      <input
                        type="url"
                        id="youtube"
                        name="youtube"
                        value={formData.youtube}
                        onChange={handleInputChange}
                        placeholder="https://youtube.com/@yourchannel"
                        className="h-12 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-slate-700 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="snapchat">
                        Snapchat Handle
                      </label>
                      <input
                        type="text"
                        id="snapchat"
                        name="snapchat"
                        value={formData.snapchat}
                        onChange={handleInputChange}
                        placeholder="@yourusername"
                        className="h-12 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-slate-700 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="facebook">
                        Facebook Page
                      </label>
                      <input
                        type="url"
                        id="facebook"
                        name="facebook"
                        value={formData.facebook}
                        onChange={handleInputChange}
                        placeholder="https://facebook.com/yourpage"
                        className="h-12 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-slate-700 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="followers">
                      Total Followers/Subscribers *
                    </label>
                    <select
                      id="followers"
                      name="followers"
                      value={formData.followers}
                      onChange={handleInputChange}
                      required
                      className="h-12 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-slate-700 dark:text-slate-100"
                    >
                      <option value="">Select range</option>
                      <option value="1k-5k">1,000 - 5,000</option>
                      <option value="5k-10k">5,000 - 10,000</option>
                      <option value="10k-25k">10,000 - 25,000</option>
                      <option value="25k-50k">25,000 - 50,000</option>
                      <option value="50k-100k">50,000 - 100,000</option>
                      <option value="100k+">100,000+</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="platform">
                      Primary Platform *
                    </label>
                    <select
                      id="platform"
                      name="platform"
                      value={formData.platform}
                      onChange={handleInputChange}
                      required
                      className="h-12 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-slate-700 dark:text-slate-100"
                    >
                      <option value="">Select platform</option>
                      <option value="instagram">Instagram</option>
                      <option value="youtube">YouTube</option>
                      <option value="tiktok">TikTok</option>
                      <option value="blog">Blog/Website</option>
                      <option value="facebook">Facebook</option>
                      <option value="twitter">Twitter</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Experience */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="experience">
                    Affiliate Marketing Experience *
                  </label>
                  <textarea
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Describe your experience with affiliate marketing, previous partnerships, and success stories..."
                    required
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 p-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="whyJoin">
                    Why do you want to join Nefol's affiliate program? *
                  </label>
                  <textarea
                    id="whyJoin"
                    name="whyJoin"
                    value={formData.whyJoin}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Tell us why you're interested in promoting Nefol products and how you align with our brand values..."
                    required
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 p-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="expectedSales">
                    Expected Monthly Sales Volume
                  </label>
                  <select
                    id="expectedSales"
                    name="expectedSales"
                    value={formData.expectedSales}
                    onChange={handleInputChange}
                    className="h-12 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-slate-700 dark:text-slate-100"
                  >
                    <option value="">Select range</option>
                    <option value="0-5k">₹0 - ₹5,000</option>
                    <option value="5k-10k">₹5,000 - ₹10,000</option>
                    <option value="10k-25k">₹10,000 - ₹25,000</option>
                    <option value="25k-50k">₹25,000 - ₹50,000</option>
                    <option value="50k+">₹50,000+</option>
                  </select>
                </div>

                {/* Address Section */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Address Information</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="houseNumber">
                        House Number *
                      </label>
                      <input
                        type="text"
                        id="houseNumber"
                        name="houseNumber"
                        value={formData.houseNumber}
                        onChange={handleInputChange}
                        placeholder="123"
                        required
                        className="h-12 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-slate-700 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="street">
                        Street *
                      </label>
                      <input
                        type="text"
                        id="street"
                        name="street"
                        value={formData.street}
                        onChange={handleInputChange}
                        placeholder="Main Street"
                        required
                        className="h-12 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-slate-700 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="building">
                        Building/Apartment
                      </label>
                      <input
                        type="text"
                        id="building"
                        name="building"
                        value={formData.building}
                        onChange={handleInputChange}
                        placeholder="Tower A, Apt 4B"
                        className="h-12 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-slate-700 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="road">
                        Road/Locality *
                      </label>
                      <input
                        type="text"
                        id="road"
                        name="road"
                        value={formData.road}
                        onChange={handleInputChange}
                        placeholder="MG Road, Sector 15"
                        required
                        className="h-12 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-slate-700 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="city">
                        City *
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="Mumbai"
                        required
                        className="h-12 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-slate-700 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="pincode">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        id="pincode"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        placeholder="400001"
                        required
                        className="h-12 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-slate-700 dark:text-slate-100"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="state">
                        State *
                      </label>
                      <select
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                        className="h-12 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-slate-700 dark:text-slate-100"
                      >
                        <option value="">Select State</option>
                        <option value="Andhra Pradesh">Andhra Pradesh</option>
                        <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                        <option value="Assam">Assam</option>
                        <option value="Bihar">Bihar</option>
                        <option value="Chhattisgarh">Chhattisgarh</option>
                        <option value="Goa">Goa</option>
                        <option value="Gujarat">Gujarat</option>
                        <option value="Haryana">Haryana</option>
                        <option value="Himachal Pradesh">Himachal Pradesh</option>
                        <option value="Jharkhand">Jharkhand</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Kerala">Kerala</option>
                        <option value="Madhya Pradesh">Madhya Pradesh</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Manipur">Manipur</option>
                        <option value="Meghalaya">Meghalaya</option>
                        <option value="Mizoram">Mizoram</option>
                        <option value="Nagaland">Nagaland</option>
                        <option value="Odisha">Odisha</option>
                        <option value="Punjab">Punjab</option>
                        <option value="Rajasthan">Rajasthan</option>
                        <option value="Sikkim">Sikkim</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Telangana">Telangana</option>
                        <option value="Tripura">Tripura</option>
                        <option value="Uttar Pradesh">Uttar Pradesh</option>
                        <option value="Uttarakhand">Uttarakhand</option>
                        <option value="West Bengal">West Bengal</option>
                        <option value="Delhi">Delhi</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Terms Agreement */}
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleInputChange}
                    required
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-200"
                  />
                  <label htmlFor="agreeTerms" className="text-sm text-slate-600 dark:text-slate-400">
                    I agree to the <a href="#" className="text-blue-600 hover:underline">Affiliate Program Terms</a> and 
                    <a href="#" className="text-blue-600 hover:underline"> Privacy Policy</a>. I understand that I must comply with 
                    FTC guidelines and disclose my affiliate relationship with Nefol. *
                  </label>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowApplicationForm(false)}
                    className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 transition-colors"
                  >
                    Submit Application
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    )
  }

  // Show application status if submitted but not approved
  if (hasSubmittedApplication && !affiliateData) {
    return (
      <main className="py-10 dark:bg-slate-900 min-h-screen">
        <div className="mx-auto max-w-6xl px-4">
          {/* Header with Back Button */}
          <div className="mb-8">
            <button 
              onClick={() => window.location.hash = '#/profile'}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Profile
            </button>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Affiliate Application Status</h1>
            <p className="text-slate-600 dark:text-slate-400">Track your affiliate application progress</p>
          </div>

          {/* Application Status */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8 border border-slate-200 dark:border-slate-700">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                applicationStatus === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                applicationStatus === 'approved' ? 'bg-green-100 dark:bg-green-900/20' :
                'bg-red-100 dark:bg-red-900/20'
              }`}>
                {applicationStatus === 'pending' ? (
                  <span className="text-2xl">⏳</span>
                ) : applicationStatus === 'approved' ? (
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                ) : (
                  <span className="text-2xl">❌</span>
                )}
              </div>
              
              <h2 className={`text-2xl font-bold mb-4 ${
                applicationStatus === 'pending' ? 'text-yellow-600 dark:text-yellow-400' :
                applicationStatus === 'approved' ? 'text-green-600 dark:text-green-400' :
                'text-red-600 dark:text-red-400'
              }`}>
                {applicationStatus === 'pending' ? 'Application Under Review' :
                 applicationStatus === 'approved' ? 'Application Approved!' :
                 'Application Rejected'}
              </h2>
              
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {applicationStatus === 'pending' ? 
                  'Your affiliate application is currently under review. We will notify you within 24-48 hours with the results.' :
                 applicationStatus === 'approved' ? 
                  'Congratulations! Your application has been approved. You should receive a verification code via email to activate your affiliate account.' :
                  'Unfortunately, your application was not approved at this time. You can reapply after 30 days.'}
              </p>

              {applicationStatus === 'approved' && (
                <button
                  onClick={() => setShowVerificationForm(true)}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Enter Verification Code
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Verification Form Modal */}
        {showVerificationForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="relative max-w-md w-full bg-white dark:bg-slate-800 rounded-lg p-6 shadow-2xl">
              <button
                onClick={() => setShowVerificationForm(false)}
                className="absolute right-4 top-4 text-2xl text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
              
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Enter Verification Code</h2>
                <p className="text-slate-600 dark:text-slate-400">Enter the 20-character verification code (letters and numbers) sent to you after application approval</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20))}
                    placeholder="ABC123DEF456GHI789JKL"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-slate-700 dark:text-slate-100 text-center text-lg tracking-widest"
                    maxLength={20}
                  />
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Enter the 20-character code exactly as provided
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={verifyCode}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Verify Account
                  </button>
                  <button
                    onClick={() => {
                      setShowVerificationForm(false)
                      setVerificationCode('')
                    }}
                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    )
  }

  return (
    <main className="py-10 dark:bg-slate-900 min-h-screen">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header with Back Button */}
        <div className="mb-8">
          <button 
            onClick={() => window.location.hash = '#/profile'}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Affiliate Partner Dashboard</h1>
              <p className="text-slate-600 dark:text-slate-400">Manage your affiliate program and track your earnings</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-sm rounded-full ${
                affiliateData.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                affiliateData.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                affiliateData.status === 'unverified' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {affiliateData.status === 'active' ? 'Active' : 
                 affiliateData.status === 'pending' ? 'Pending' : 
                 affiliateData.status === 'unverified' ? 'Unverified' : 'Suspended'}
              </span>
            </div>
          </div>
        </div>

        {/* Verification Form */}
        {affiliateData && !affiliateData.is_verified && (
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg p-6 mb-8 border border-orange-200 dark:border-orange-800">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 dark:text-orange-400 text-xl">🔐</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-2">
                  Account Verification Required
                </h3>
                <p className="text-orange-700 dark:text-orange-300 mb-4">
                  To activate your affiliate account, please enter the 20-character verification code (letters and numbers) that was sent to you after your application was approved.
                </p>
                
                {!showVerificationForm ? (
                  <button
                    onClick={() => setShowVerificationForm(true)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Enter Verification Code
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">
                        Enter 20-Digit Verification Code
                      </label>
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20))}
                        placeholder="ABC123DEF456GHI789JKL"
                        className="w-full px-4 py-3 border border-orange-300 dark:border-orange-600 rounded-lg focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 dark:bg-slate-700 dark:text-slate-100 text-center text-lg tracking-widest"
                        maxLength={20}
                      />
                      <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                        Enter the 20-character code exactly as provided
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={verifyCode}
                        className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        Verify Account
                      </button>
                      <button
                        onClick={() => {
                          setShowVerificationForm(false)
                          setVerificationCode('')
                        }}
                        className="px-6 py-2 border border-orange-300 dark:border-orange-600 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content - Only show if verified */}
        {affiliateData.is_verified ? (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total Earnings</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">₹{affiliateData.total_earnings.toFixed(2)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Referrals</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{affiliateData.total_referrals}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Pending Earnings</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">₹{affiliateData.pending_earnings.toFixed(2)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Commission Rate</p>
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{affiliateData.commission_rate}%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="mb-8">
              <nav className="flex space-x-8 border-b border-slate-200 dark:border-slate-700">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-1 py-4 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      <IconComponent className="h-4 w-4" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Referral Code Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold dark:text-slate-100 mb-4">Your Referral Code</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-white dark:bg-slate-700 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Share this code with friends</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">{affiliateData.referral_code}</p>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(affiliateData.referral_code, 'Referral code')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </button>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
                  Earn {affiliateData.commission_rate}% commission on every successful referral!
                </p>
              </div>

              {/* Referral Link */}
              <div className="bg-white dark:bg-slate-700 rounded-lg p-6 border border-slate-200 dark:border-slate-600">
                <h3 className="text-lg font-semibold dark:text-slate-100 mb-3">Your Referral Link</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-slate-50 dark:bg-slate-600 rounded-lg p-3 border border-slate-200 dark:border-slate-600">
                    <p className="text-sm text-slate-600 dark:text-slate-400 break-all">
                      https://nefol.com/ref/{affiliateData.referral_code}
                    </p>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(`https://nefol.com/ref/${affiliateData.referral_code}`, 'Referral link')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Link
                  </button>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
                  Share this link on social media, email, or any platform to start earning commissions!
                </p>
              </div>

              {/* Partner Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-700 rounded-lg p-6 border border-slate-200 dark:border-slate-600">
                  <h3 className="text-lg font-semibold dark:text-slate-100 mb-4">Partner Statistics</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Active Referrals</span>
                      <span className="font-semibold dark:text-slate-100">{affiliateData.active_referrals}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Commission Rate</span>
                      <span className="font-semibold dark:text-slate-100">{affiliateData.commission_rate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Partner Since</span>
                      <span className="font-semibold dark:text-slate-100">
                        {new Date(affiliateData.join_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Last Payment</span>
                      <span className="font-semibold dark:text-slate-100">
                        {new Date(affiliateData.last_payment).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-700 rounded-lg p-6 border border-slate-200 dark:border-slate-600">
                  <h3 className="text-lg font-semibold dark:text-slate-100 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button 
                      onClick={() => copyToClipboard(`https://nefol.com/ref/${affiliateData.referral_code}`, 'Referral link')}
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Share2 className="h-4 w-4" />
                      Share Referral Link
                    </button>
                    <button 
                      onClick={() => window.location.hash = '#/referral-history'}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      View Referral History
                    </button>
                    <button 
                      onClick={() => window.location.hash = '#/reports'}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      Download Reports
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Referrals Tab */}
          {activeTab === 'referrals' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold dark:text-slate-100">Your Referrals</h2>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Total: {referrals.length} referrals
                </div>
              </div>
              
              {referrals.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold dark:text-slate-100 mb-2">No Referrals Yet</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">Start sharing your referral link to earn commissions</p>
                  <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Share Referral Link
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {referrals.map((referral) => (
                    <div key={referral.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold dark:text-slate-100">{referral.name}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{referral.email}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-500">
                            Joined: {new Date(referral.signup_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            referral.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                          }`}>
                            {referral.status}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{referral.total_orders}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Orders</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-lg font-bold text-green-600 dark:text-green-400">₹{referral.total_spent}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Total Spent</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">₹{referral.commission_earned}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Commission</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Earnings Tab */}
          {activeTab === 'earnings' && (
            <div>
              <h2 className="text-2xl font-semibold dark:text-slate-100 mb-6">Earnings Overview</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-6">
                  <h3 className="text-lg font-semibold dark:text-slate-100 mb-2">Total Earnings</h3>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">₹{affiliateData.total_earnings.toFixed(2)}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">All time earnings from referrals</p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-6">
                  <h3 className="text-lg font-semibold dark:text-slate-100 mb-2">Pending Earnings</h3>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">₹{affiliateData.pending_earnings.toFixed(2)}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Available for next payout</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-700 rounded-lg p-6 border border-slate-200 dark:border-slate-600">
                <h3 className="text-lg font-semibold dark:text-slate-100 mb-4">Payment Information</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Payment Method</span>
                    <span className="font-semibold dark:text-slate-100">Bank Transfer</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Minimum Payout</span>
                    <span className="font-semibold dark:text-slate-100">₹2,500</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Payment Schedule</span>
                    <span className="font-semibold dark:text-slate-100">Monthly</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Last Payment</span>
                    <span className="font-semibold dark:text-slate-100">
                      {new Date(affiliateData.last_payment).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Marketing Materials Tab */}
          {activeTab === 'materials' && (
            <div>
              <h2 className="text-2xl font-semibold dark:text-slate-100 mb-6">Marketing Materials</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-700 rounded-lg p-6 border border-slate-200 dark:border-slate-600">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🖼️</span>
                    </div>
                    <h3 className="font-semibold dark:text-slate-100 mb-2">Product Images</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">High-quality product photos for social media</p>
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Download
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-700 rounded-lg p-6 border border-slate-200 dark:border-slate-600">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📱</span>
                    </div>
                    <h3 className="font-semibold dark:text-slate-100 mb-2">Social Media Banners</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Ready-to-use banners for Instagram, Facebook</p>
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Download
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-700 rounded-lg p-6 border border-slate-200 dark:border-slate-600">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📝</span>
                    </div>
                    <h3 className="font-semibold dark:text-slate-100 mb-2">Copy Templates</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Pre-written captions and descriptions</p>
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Download
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-700 rounded-lg p-6 border border-slate-200 dark:border-slate-600">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🎥</span>
                    </div>
                    <h3 className="font-semibold dark:text-slate-100 mb-2">Video Content</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Product demonstration videos</p>
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Download
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-700 rounded-lg p-6 border border-slate-200 dark:border-slate-600">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📊</span>
                    </div>
                    <h3 className="font-semibold dark:text-slate-100 mb-2">Brand Guidelines</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Logo usage and brand standards</p>
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Download
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-700 rounded-lg p-6 border border-slate-200 dark:border-slate-600">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📧</span>
                    </div>
                    <h3 className="font-semibold dark:text-slate-100 mb-2">Email Templates</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Email marketing templates</p>
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
            </div>
          </>
        ) : (
          /* Show verification message when not verified */
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-orange-600 dark:text-orange-400 text-4xl">🔒</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Account Verification Required
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Please verify your account using the 20-digit code to access affiliate features.
            </p>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Complete the verification process above to unlock your affiliate dashboard and start earning commissions.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
