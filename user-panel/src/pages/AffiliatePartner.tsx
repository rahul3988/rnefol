import React, { useState, useEffect } from 'react'
import { ArrowLeft, BarChart3, Copy, CheckCircle, Clock, AlertCircle, UserPlus, Key, Percent } from 'lucide-react'
import { getApiBase } from '../utils/apiBase'
import { useAuth } from '../contexts/AuthContext'

interface AffiliateData {
  id: string
  user_id: string
  referral_code: string
  referral_link: string
  commission_rate: number
  total_referrals: number
  total_earnings: number
  conversion_rate: number
  is_verified: boolean
  created_at: string
  last_payment: string
}

interface Referral {
  id: string
  affiliate_id: string
  referred_user_id: string
  referred_user_name: string
  commission_amount: number
  status: string
  created_at: string
}

interface ApplicationStatus {
  status: 'not_submitted' | 'pending' | 'approved' | 'rejected'
  message?: string
}

const AffiliatePartner: React.FC = () => {
  // Force refresh - timestamp: 1761382000000
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [affiliateData, setAffiliateData] = useState<AffiliateData | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [hasSubmittedApplication, setHasSubmittedApplication] = useState(false)
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus['status']>('not_submitted')
  const [verificationCode, setVerificationCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationMessage, setVerificationMessage] = useState('')
  const [isAlreadyVerified, setIsAlreadyVerified] = useState(false)
  const [showCodeForm, setShowCodeForm] = useState(false)
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [commissionSettings, setCommissionSettings] = useState({ commission_percentage: 15.0, is_active: true })
  const [marketingMaterials, setMarketingMaterials] = useState<any>(null)
  const [nefolCoins, setNefolCoins] = useState(0)
  const [copySuccess, setCopySuccess] = useState(false)
  const [applicationForm, setApplicationForm] = useState({
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

  // Populate form with user data when user is available
  useEffect(() => {
    if (user) {
      setApplicationForm(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      }))
    }
  }, [user])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }

    const initializeData = async () => {
      try {
        // Run all initialization tasks in parallel for better performance
        await Promise.allSettled([
          checkApplicationStatus(),
          fetchCommissionSettings(),
          fetchMarketingMaterials(),
          fetchNefolCoins()
        ])
        console.log('All affiliate data initialized successfully')
      } catch (error) {
        console.error('Failed to initialize affiliate data:', error)
      } finally {
        setLoading(false)
      }
    }
    initializeData()

    // Set up socket listener for commission updates
    const setupSocketListener = () => {
      if ((window as any).io) {
        (window as any).io.on('commission_settings_updated', (data: any) => {
          console.log('Commission settings updated:', data)
          setCommissionSettings(data)
          // Show notification to user
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Commission Rate Updated', {
              body: `New commission rate: ${data.commission_percentage}%`,
              icon: '/favicon.ico'
            })
          }
        })
      }
    }
    setupSocketListener()

    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Affiliate data loading timeout - setting loading to false')
        setLoading(false)
        // Show a helpful message to the user
        console.log('If you continue to experience issues, please refresh the page or contact support.')
      }
    }, 10000) // Increased timeout to 10 seconds
    return () => clearTimeout(timeout)
  }, [])

  const checkApplicationStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.log('No token found, setting loading to false')
        setLoading(false)
        return
      }

      console.log('Checking application status...')
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // Increased timeout

      const response = await fetch(`${getApiBase()}/api/affiliate/application-status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      console.log('Application status response:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Application status data:', data)
        // Backend returns data directly, not wrapped in success property
        const status = data.status || 'not_submitted'
        setHasSubmittedApplication(status !== 'not_submitted')
        setApplicationStatus(status)
        
        if (status === 'approved') {
          await fetchAffiliateData(false)
          await fetchReferrals()
          setLoading(false)
        } else {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Failed to check application status:', error)
      
      // Handle different types of errors
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.warn('Application status check timed out')
        } else {
          console.error('Network or other error:', error.message)
        }
      }
      
      // Try to use saved status as fallback
      const savedStatus = localStorage.getItem('affiliateApplicationStatus')
      if (savedStatus) {
        console.log('Using saved application status:', savedStatus)
        setHasSubmittedApplication(true)
        setApplicationStatus(savedStatus as any)
      } else {
        console.log('No saved status found, showing application form')
      }
      
      setLoading(false)
    }
  }

  const fetchCommissionSettings = async () => {
    try {
      const response = await fetch(`${getApiBase()}/api/affiliate/commission-settings`)
      const data = await response.json()
      
      if (response.ok && data.commission_percentage !== undefined) {
        setCommissionSettings(data)
      }
    } catch (error) {
      console.error('Failed to fetch commission settings:', error)
    }
  }

  const fetchMarketingMaterials = async () => {
    try {
      const response = await fetch(`${getApiBase()}/api/affiliate/marketing-materials`)
      const data = await response.json()
      
      if (response.ok) {
        setMarketingMaterials(data)
      }
    } catch (error) {
      console.error('Failed to fetch marketing materials:', error)
    }
  }

  const fetchNefolCoins = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.log('No token found, skipping Nefol coins fetch')
        return
      }

      const response = await fetch(`${getApiBase()}/api/nefol-coins`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setNefolCoins(data.nefol_coins || 0)
        console.log('Nefol coins fetched successfully:', data.nefol_coins)
      } else {
        console.log('Nefol coins API returned:', response.status, response.statusText)
        // Don't throw error, just log it and continue
      }
    } catch (error) {
      console.error('Failed to fetch Nefol coins:', error)
      // Don't throw error, just log it and continue
    }
  }

  const fetchAffiliateData = async (shouldSetLoading = true) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('No authentication token found')
        if (shouldSetLoading) setLoading(false)
        return
      }

      console.log('Fetching affiliate dashboard data...')
      const response = await fetch(`${getApiBase()}/api/affiliate/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('Dashboard API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Dashboard API response data:', data)
        
        // Backend returns data directly, not wrapped in success property
        setAffiliateData(data)
        console.log('Affiliate data fetched successfully:', data)
        console.log('Referral link in response:', data.referral_link)
        
        // Check if user is already verified
        if (data.status === 'active' || data.is_verified) {
          setIsAlreadyVerified(true)
          console.log('User is verified, showing dashboard')
        } else {
          setIsAlreadyVerified(false)
          console.log('User is not verified, showing verification form')
        }
      } else if (response.status === 404) {
        console.log('No affiliate account found - this is normal for new users')
        setIsAlreadyVerified(false)
      } else {
        console.error('Failed to fetch affiliate data:', response.status)
        const errorData = await response.json().catch(() => ({}))
        console.error('Error response:', errorData)
        setIsAlreadyVerified(false)
      }
    } catch (error) {
      console.error('Failed to fetch affiliate data:', error)
    } finally {
      if (shouldSetLoading) setLoading(false)
    }
  }

  const fetchReferrals = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('No authentication token found')
        return
      }

      const response = await fetch(`${getApiBase()}/api/affiliate/referrals`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Backend returns data directly, not wrapped in success property
        setReferrals(data.referrals || data)
        console.log('Referrals fetched successfully:', data.referrals || data)
      } else if (response.status === 404) {
        console.log('No referrals found - this is normal for new affiliates')
      } else {
        console.error('Failed to fetch referrals:', response.status)
      }
    } catch (error) {
      console.error('Failed to fetch referrals:', error)
    }
  }

  const handleCodeVerification = async () => {
    if (!verificationCode.trim()) {
      setVerificationMessage('Please enter a verification code')
      return
    }

    setIsVerifying(true)
    setVerificationMessage('')

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setVerificationMessage('No authentication token found')
        setIsVerifying(false)
        return
      }

      const response = await fetch(`${getApiBase()}/api/affiliate/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ verificationCode: verificationCode.trim() })
      })

      const data = await response.json()

      if (response.ok) {
        if (data.message === 'Account already verified') {
          setVerificationMessage('✅ Code already verified! Loading dashboard...')
        } else {
          setVerificationMessage('✅ Verification successful! Loading dashboard...')
        }
        
        // Fetch updated affiliate data to show dashboard
        setTimeout(async () => {
          try {
            await fetchAffiliateData(false)
            await fetchReferrals()
            setIsAlreadyVerified(true)
            setVerificationMessage('')
            setVerificationCode('')
            setShowCodeForm(false)
          } catch (error) {
            console.error('Failed to load dashboard after verification:', error)
            setVerificationMessage('Verification successful! Please refresh the page to see your dashboard.')
          }
        }, 1500)
      } else {
        if (data.message === 'This verification code has already been used by another account') {
          setVerificationMessage('❌ This verification code has already been used by another account')
        } else {
          setVerificationMessage(data.message || 'Invalid verification code')
        }
      }
    } catch (error) {
      console.error('Verification error:', error)
      setVerificationMessage('Failed to verify code. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('No authentication token found')
        return
      }

      const response = await fetch(`${getApiBase()}/api/affiliate/application`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(applicationForm)
      })

      const data = await response.json()

      if (response.ok) {
        alert('Application submitted successfully! You will receive your verification code via email.')
        setHasSubmittedApplication(true)
        setApplicationStatus('pending')
        setShowApplicationForm(false)
        localStorage.setItem('affiliateApplicationStatus', 'pending')
      } else if (response.status === 409) {
        // Handle duplicate application - check if user already has an application
        const errorMessage = data.message || 'You have already submitted an application'
        alert(`${errorMessage}. Please check your email for the verification code or contact support if you need assistance.`)
        
        // Update UI to reflect existing application
        setHasSubmittedApplication(true)
        setApplicationStatus('pending')
        setShowApplicationForm(false)
        
        // Refresh application status to get current state
        setTimeout(() => {
          checkApplicationStatus()
        }, 1000)
      } else {
        alert(data.message || 'Failed to submit application. Please try again or contact support.')
      }
    } catch (error) {
      console.error('Application submission error:', error)
      alert('Failed to submit application. Please try again.')
    }
  }

  const copyReferralLink = () => {
    if (affiliateData?.referral_link) {
      // Check if clipboard API is available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(affiliateData.referral_link)
          .then(() => {
            setCopySuccess(true)
            setTimeout(() => setCopySuccess(false), 2000)
          })
          .catch((error) => {
            console.warn('Clipboard API failed, using fallback:', error)
            // Fallback for when clipboard API fails
            fallbackCopyToClipboard(affiliateData.referral_link)
          })
      } else {
        // Fallback for browsers that don't support clipboard API
        fallbackCopyToClipboard(affiliateData.referral_link)
      }
    }
  }

  const fallbackCopyToClipboard = (text: string) => {
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      
      if (successful) {
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
      } else {
        console.error('Fallback copy failed')
        // Show user-friendly message
        alert('Unable to copy to clipboard. Please copy the link manually.')
      }
    } catch (error) {
      console.error('Copy failed:', error)
      alert('Unable to copy to clipboard. Please copy the link manually.')
    }
  }

  const downloadMaterial = (file: any) => {
    if (file.type === 'folder') {
      // For folders, we'll show a modal with all files in that folder
      // For now, just open the folder URL
      window.open(`${getApiBase()}${file.url}`, '_blank')
    } else {
      // For individual files, download them
      const link = document.createElement('a')
      link.href = `${getApiBase()}${file.url}`
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (loading) {
    return (
      <main className="py-10 dark:bg-slate-900 min-h-screen">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400 mb-2">Loading affiliate data...</p>
              <p className="text-sm text-slate-500 dark:text-slate-500">This may take a few moments</p>
              <div className="mt-4">
                <button 
                  onClick={() => setLoading(false)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Skip loading and continue
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // If user is verified and has affiliate data, show dashboard
  if (isAlreadyVerified && affiliateData) {
    return (
      <main className="py-10 dark:bg-slate-900 min-h-screen">
        <div className="mx-auto max-w-6xl px-4">
          {/* Header with Back Button */}
          <div className="mb-8">
            <button 
              onClick={() => window.location.hash = '#/user/profile'}
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
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const dashboardContent = document.getElementById('dashboard-content')
                    if (dashboardContent) {
                      dashboardContent.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </button>
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                  <CheckCircle className="h-4 w-4" />
                  Verified
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          <div id="dashboard-content">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total Earnings</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">₹{(affiliateData?.total_earnings || 0).toFixed(2)}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xl">💰</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Referrals</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{affiliateData?.total_referrals || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xl">👥</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Conversion Rate</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{(affiliateData?.conversion_rate || 0).toFixed(1)}%</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xl">📈</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Commission Rate</p>
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{affiliateData?.commission_rate || 0}%</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xl">💎</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Nefol Coins</p>
                    <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{nefolCoins}</p>
                    <p className="text-xs text-yellow-500 dark:text-yellow-400 mt-1">Earned from referrals</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xl">🪙</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Referral Link Section */}
            <div className="bg-white dark:bg-slate-700 rounded-lg p-6 border border-slate-200 dark:border-slate-600 mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Your Referral Link</h2>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-600">
                  <code className="text-sm text-slate-700 dark:text-slate-300 break-all">
                    {affiliateData?.referral_link || 'Loading...'}
                  </code>
                </div>
                <button
                  onClick={copyReferralLink}
                  className={`px-4 py-2 rounded-lg transition-colors font-semibold flex items-center gap-2 ${
                    copySuccess 
                      ? 'bg-green-600 text-white' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Copy className="h-4 w-4" />
                  {copySuccess ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>

            {/* Recent Referrals */}
            <div className="bg-white dark:bg-slate-700 rounded-lg p-6 border border-slate-200 dark:border-slate-600 mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Recent Referrals</h2>
              {referrals.length > 0 ? (
                <div className="space-y-4">
                  {referrals.slice(0, 5).map((referral) => (
                    <div key={referral.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400 font-semibold">
                            {referral.referred_user_name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {referral.referred_user_name || 'Anonymous User'}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {new Date(referral.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600 dark:text-green-400">
                          ₹{(referral.commission_amount || 0).toFixed(2)}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                          {referral.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-slate-400 text-2xl">👥</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">No referrals yet</p>
                  <p className="text-sm text-slate-500 dark:text-slate-500">Start sharing your referral link to earn commissions!</p>
                </div>
              )}
            </div>

            {/* Marketing Materials */}
            <div className="bg-white dark:bg-slate-700 rounded-lg p-6 border border-slate-200 dark:border-slate-600">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Marketing Materials</h2>
              {marketingMaterials ? (
                <div className="space-y-8">
                  {/* Social Media Posts */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                      <span className="text-2xl">📱</span>
                      Social Media Posts
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {marketingMaterials.socialMediaPosts?.map((category: any) => (
                        <div key={category.id} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">{category.name}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{category.description}</p>
                          <div className="space-y-2">
                            {category.files.map((file: any, index: number) => (
                              <button
                                key={index}
                                onClick={() => downloadMaterial(file)}
                                className="w-full text-left px-3 py-2 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-sm"
                              >
                                📄 {file.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Product Images */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                      <span className="text-2xl">📄</span>
                      Product Images
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {marketingMaterials.productImages?.map((category: any) => (
                        <div key={category.id} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">{category.name}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{category.description}</p>
                          <div className="space-y-2">
                            {category.files.map((file: any, index: number) => (
                              <button
                                key={index}
                                onClick={() => downloadMaterial(file)}
                                className="w-full text-left px-3 py-2 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-sm"
                              >
                                📁 {file.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Email Templates */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                      <span className="text-2xl">📧</span>
                      Email Templates
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {marketingMaterials.emailTemplates?.map((category: any) => (
                        <div key={category.id} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">{category.name}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{category.description}</p>
                          <div className="space-y-2">
                            {category.files.map((file: any, index: number) => (
                              <button
                                key={index}
                                onClick={() => downloadMaterial(file)}
                                className="w-full text-left px-3 py-2 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-sm"
                              >
                                📄 {file.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Videos */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                      <span className="text-2xl">🎥</span>
                      Product Videos
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {marketingMaterials.videos?.map((category: any) => (
                        <div key={category.id} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">{category.name}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{category.description}</p>
                          <div className="space-y-2">
                            {category.files.map((file: any, index: number) => (
                              <button
                                key={index}
                                onClick={() => downloadMaterial(file)}
                                className="w-full text-left px-3 py-2 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-sm"
                              >
                                🎬 {file.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-slate-600 dark:text-slate-400">Loading marketing materials...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Main affiliate partner page - show options for code entry or application
  return (
    <main className="py-10 dark:bg-slate-900 min-h-screen">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => window.location.hash = '#/user/profile'}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Affiliate Partner Program</h1>
            <p className="text-slate-600 dark:text-slate-400">Join our affiliate program and start earning commissions</p>
          </div>
        </div>

        {/* Application Status Display */}
        {hasSubmittedApplication && (
          <div className="mb-8">
            <div className={`rounded-lg p-6 border ${
              applicationStatus === 'approved' 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                : applicationStatus === 'pending'
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-3 mb-2">
                {applicationStatus === 'approved' ? (
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                ) : applicationStatus === 'pending' ? (
                  <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                )}
                <h3 className={`text-lg font-semibold ${
                  applicationStatus === 'approved' 
                    ? 'text-green-800 dark:text-green-200' 
                    : applicationStatus === 'pending'
                    ? 'text-yellow-800 dark:text-yellow-200'
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {applicationStatus === 'approved' 
                    ? (isAlreadyVerified ? 'Application Approved & Verified!' : 'Application Approved!')
                    : applicationStatus === 'pending'
                    ? 'Application Under Review'
                    : 'Application Rejected'
                  }
                </h3>
              </div>
              <p className={`${
                applicationStatus === 'approved' 
                  ? 'text-green-700 dark:text-green-300' 
                  : applicationStatus === 'pending'
                  ? 'text-yellow-700 dark:text-yellow-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {applicationStatus === 'approved' 
                  ? (isAlreadyVerified 
                      ? 'Your application has been approved and your account is verified! You can access your affiliate dashboard.'
                      : 'Your application has been approved! You can now verify your account with the code sent to your email.'
                    )
                  : applicationStatus === 'pending'
                  ? 'Your application is being reviewed. You will receive an email with your verification code once approved. If you haven\'t received an email, please check your spam folder or contact support.'
                  : 'Your application was not approved. Please contact support for more information.'
                }
              </p>
              
              {applicationStatus === 'pending' && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Need help?</strong> If you're having trouble finding your verification code or have questions about your application, please contact our support team.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Code Verification Option */}
          <div className="bg-white dark:bg-slate-700 rounded-lg p-6 border border-slate-200 dark:border-slate-600">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                {isAlreadyVerified ? (
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                ) : (
                  <Key className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {isAlreadyVerified ? 'Account Already Verified' : 'Verify Your Account'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {isAlreadyVerified 
                  ? 'Your account is already verified! Click below to access your affiliate dashboard.'
                  : 'Enter your 20-digit verification code to access your affiliate dashboard'
                }
              </p>
            </div>

            {!showCodeForm ? (
              <button
                onClick={() => {
                  if (isAlreadyVerified) {
                    // If already verified, redirect to dashboard
                    window.location.reload()
                  } else {
                    setShowCodeForm(true)
                  }
                }}
                className={`w-full px-4 py-3 text-white rounded-lg transition-colors font-semibold ${
                  isAlreadyVerified 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isAlreadyVerified ? 'Already Verified - View Dashboard' : 'Enter Verification Code'}
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter your 20-digit code"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-slate-100"
                    maxLength={20}
                  />
                </div>
                
                {verificationMessage && (
                  <div className={`p-3 rounded-lg text-sm ${
                    verificationMessage.includes('successful') 
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                  }`}>
                    {verificationMessage}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleCodeVerification}
                    disabled={isVerifying || !verificationCode.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isVerifying ? 'Verifying...' : 'Verify Code'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCodeForm(false)
                      setVerificationCode('')
                      setVerificationMessage('')
                    }}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Application Form Option */}
          <div className="bg-white dark:bg-slate-700 rounded-lg p-6 border border-slate-200 dark:border-slate-600">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Apply for Partnership</h3>
              <p className="text-slate-600 dark:text-slate-400">Submit your application to become an affiliate partner</p>
            </div>

            {!showApplicationForm ? (
              <button
                onClick={() => setShowApplicationForm(true)}
                disabled={hasSubmittedApplication}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {hasSubmittedApplication ? 'Application Submitted' : 'Submit Application'}
              </button>
            ) : (
              <form onSubmit={handleApplicationSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={applicationForm.name}
                    onChange={(e) => setApplicationForm({...applicationForm, name: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={applicationForm.email}
                    onChange={(e) => setApplicationForm({...applicationForm, email: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={applicationForm.phone}
                    onChange={(e) => setApplicationForm({...applicationForm, phone: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Instagram
                    </label>
                    <input
                      type="text"
                      value={applicationForm.instagram}
                      onChange={(e) => setApplicationForm({...applicationForm, instagram: e.target.value})}
                      placeholder="@username"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      YouTube
                    </label>
                    <input
                      type="text"
                      value={applicationForm.youtube}
                      onChange={(e) => setApplicationForm({...applicationForm, youtube: e.target.value})}
                      placeholder="Channel name"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Total Followers
                  </label>
                  <select
                    value={applicationForm.followers}
                    onChange={(e) => setApplicationForm({...applicationForm, followers: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">Select follower count</option>
                    <option value="1000-5000">1,000 - 5,000</option>
                    <option value="5000-10000">5,000 - 10,000</option>
                    <option value="10000-50000">10,000 - 50,000</option>
                    <option value="50000-100000">50,000 - 100,000</option>
                    <option value="100000+">100,000+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Why do you want to join our affiliate program?
                  </label>
                  <textarea
                    value={applicationForm.whyJoin}
                    onChange={(e) => setApplicationForm({...applicationForm, whyJoin: e.target.value})}
                    rows={3}
                    placeholder="Tell us why you want to become an affiliate partner..."
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    checked={applicationForm.agreeTerms}
                    onChange={(e) => setApplicationForm({...applicationForm, agreeTerms: e.target.checked})}
                    required
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-slate-300 rounded"
                  />
                  <label htmlFor="agreeTerms" className="ml-2 block text-sm text-slate-700 dark:text-slate-300">
                    I agree to the terms and conditions *
                  </label>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                  >
                    Submit Application
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowApplicationForm(false)}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-white dark:bg-slate-700 rounded-lg p-6 border border-slate-200 dark:border-slate-600">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Why Join Our Affiliate Program?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">💰</span>
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">High Commissions</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">Earn up to 30% commission on every sale you refer</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📈</span>
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Real-time Tracking</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">Track your referrals and earnings in real-time</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🎁</span>
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Marketing Support</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">Get access to marketing materials and support</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default AffiliatePartner