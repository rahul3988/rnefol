import React, { useState, useEffect } from 'react'
import { User, CreditCard, MapPin, Phone, Mail, Package, Heart, Settings, LogOut, LogIn } from 'lucide-react'
import { formatCoins, formatCoinsWithValue, calculatePurchaseCoins } from '../utils/points'
import ProfileAvatar from '../components/ProfileAvatar'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'

interface UserProfile {
  name: string
  email: string
  phone: string
  address: {
    street: string
    city: string
    state: string
    zip: string
  }
  loyalty_points: number
  total_orders: number
  member_since: string
  profile_photo?: string
}

interface Order {
  id: string
  order_number: string
  status: string
  total: number
  date: string
  items: Array<{
    name: string
    quantity: number
    price: string
  }>
}

interface SavedCard {
  id: string
  card_number: string
  expiry: string
  type: string
  is_default: boolean
}

export default function Profile() {
  const { refreshUser, isAuthenticated } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [savedCards, setSavedCards] = useState<SavedCard[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [editing, setEditing] = useState(false)
  const [showAddCard, setShowAddCard] = useState(false)
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [newCard, setNewCard] = useState({
    card_number: '',
    expiry: '',
    cvv: '',
    name: '',
    type: 'Visa'
  })
  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    is_default: false
  })
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: ''
    }
  })
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile()
      fetchOrders()
      fetchSavedCards()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated])

  const fetchProfile = async () => {
    try {
      const userData = await api.user.getProfile()
      setProfile(userData)
      setEditForm({
        name: userData.name,
        phone: userData.phone || '',
        address: userData.address || { street: '', city: '', state: '', zip: '' }
      })
    } catch (error: any) {
      console.error('Failed to fetch profile:', error)
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.hash = '#/user/login'
        return
      }
      // Show fallback profile
      setProfile({
        name: 'User',
        email: '',
        phone: '',
        address: { street: '', city: '', state: '', zip: '' },
        loyalty_points: 0,
        total_orders: 0,
        member_since: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchOrders = async () => {
    try {
      const ordersData = await api.orders.getAll()
      // Transform orders data to match our interface
      const transformedOrders = ordersData.map((order: any) => ({
        id: order.id.toString(),
        order_number: order.order_number,
        status: order.status,
        total: parseFloat(order.total),
        date: new Date(order.created_at).toLocaleDateString(),
        items: Array.isArray(order.items) ? order.items : []
      }))
      setOrders(transformedOrders)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    }
  }

  const fetchSavedCards = async () => {
    try {
      const response = await api.user.getSavedCards()
      // Handle both direct array response and wrapped response
      const cardsData = Array.isArray(response) ? response : (response.data || [])
      setSavedCards(cardsData)
    } catch (error) {
      console.error('Failed to fetch saved cards:', error)
      setSavedCards([])
    }
  }

  const handleSaveProfile = async () => {
    try {
      const updatedProfile = await api.user.updateProfile({
        name: editForm.name,
        phone: editForm.phone,
        address: editForm.address
      })
      setProfile(updatedProfile)
      setEditing(false)
      alert('Profile updated successfully!')
    } catch (error: any) {
      console.error('Failed to save profile:', error)
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.hash = '#/user/login'
      } else {
        alert('Failed to update profile')
      }
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.hash = '#/user/login'
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB')
      return
    }

    setUploadingPhoto(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${window.location.protocol}//${window.location.hostname}:4000/api/upload`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        const photoUrl = `${window.location.protocol}//${window.location.hostname}:4000${result.url}`
        
        // Update profile with new photo URL
        const token = localStorage.getItem('token')
        if (!token) {
          window.location.hash = '#/user/login'
          return
        }

        const updateResponse = await fetch(`${window.location.protocol}//${window.location.hostname}:4000/api/users/profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: profile?.name,
            phone: profile?.phone,
            address: profile?.address,
            profile_photo: photoUrl
          })
        })

        if (updateResponse.ok) {
          const updatedProfile = await updateResponse.json()
          setProfile(updatedProfile)
          setPhotoPreview(photoUrl)
          // Refresh user data in AuthContext
          await refreshUser()
          alert('Profile photo updated successfully!')
        } else {
          alert('Failed to update profile photo')
        }
      } else {
        alert('Failed to upload photo')
      }
    } catch (error) {
      console.error('Failed to upload photo:', error)
      alert('Failed to upload photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleAddCard = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        window.location.hash = '#/user/login'
        return
      }

      // For now, add to local state (implement API later)
      const card = {
        id: Date.now().toString(),
        card_number: `**** **** **** ${newCard.card_number.slice(-4)}`,
        expiry: newCard.expiry,
        type: newCard.type,
        is_default: savedCards.length === 0
      }
      
      setSavedCards([...savedCards, card])
      setNewCard({
        card_number: '',
        expiry: '',
        cvv: '',
        name: '',
        type: 'Visa'
      })
      setShowAddCard(false)
      alert('Card added successfully!')
    } catch (error) {
      console.error('Failed to add card:', error)
      alert('Failed to add card')
    }
  }

  const handleAddAddress = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        window.location.hash = '#/user/login'
        return
      }

      // Update profile address
      const updatedProfile = {
        ...profile!,
        address: {
          street: newAddress.street,
          city: newAddress.city,
          state: newAddress.state,
          zip: newAddress.zip
        },
        phone: newAddress.phone || profile!.phone
      }

      const response = await fetch(`${window.location.protocol}//${window.location.hostname}:4000/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: updatedProfile.name,
          phone: updatedProfile.phone,
          address: updatedProfile.address
        })
      })

      if (response.ok) {
        setProfile(updatedProfile)
        setNewAddress({
          street: '',
          city: '',
          state: '',
          zip: '',
          phone: '',
          is_default: false
        })
        setShowAddAddress(false)
        alert('Address updated successfully!')
      } else {
        alert('Failed to update address')
      }
    } catch (error) {
      console.error('Failed to add address:', error)
      alert('Failed to add address')
    }
  }

  if (loading) {
    return (
      <main className="py-10 dark:bg-slate-900 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </main>
    )
  }

  if (!isAuthenticated) {
    return (
      <main className="py-10 dark:bg-slate-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Please Login</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">You need to be logged in to view your profile.</p>
          <a href="#/user/login" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Go to Login</a>
        </div>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="py-10 dark:bg-slate-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Profile Not Found</h1>
          <a href="#/user/login" className="text-blue-600 hover:text-blue-700">Go to Login</a>
        </div>
      </main>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Your Profile', icon: User },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'cash', label: 'Nefol Coins', icon: CreditCard },
    { id: 'affiliate', label: 'Affiliate Partner', icon: Heart },
    { id: 'orders', label: 'Your Orders', icon: Package },
    { id: 'cards', label: 'Saved Cards', icon: CreditCard },
    { id: 'address', label: 'Manage Address', icon: MapPin },
    { id: 'contact', label: 'Contact Us', icon: Phone }
  ]

  return (
    <main className="py-10 dark:bg-slate-900 min-h-screen">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">My Account</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage your profile, orders, and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
              <div className="text-center mb-6">
                <div className="relative mx-auto mb-4">
                  <ProfileAvatar 
                    profilePhoto={profile.profile_photo}
                    name={profile.name}
                    size="xl"
                    className="mx-auto"
                    clickable={isAuthenticated}
                    onClick={() => isAuthenticated && fileInputRef.current?.click()}
                  />
                  {/* Photo Upload Button - Only show when authenticated */}
                  {isAuthenticated && (
                    <div className="mt-3">
                      <label className="cursor-pointer inline-block">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                          disabled={uploadingPhoto}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingPhoto}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
                        </button>
                      </label>
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-semibold dark:text-slate-100">{profile.name}</h3>
                <p className="text-slate-600 dark:text-slate-400">{profile.email}</p>
                <p className="text-sm text-slate-500 dark:text-slate-500">{profile.phone}</p>
              </div>

              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        if (tab.id === 'cash') {
                          window.location.hash = '#/user/nefol-coins'
                        } else if (tab.id === 'affiliate') {
                          window.location.hash = '#/user/affiliate-partner'
                        } else if (tab.id === 'orders') {
                          window.location.hash = '#/user/user-orders'
                        } else if (tab.id === 'cards') {
                          window.location.hash = '#/user/saved-cards'
                        } else if (tab.id === 'address') {
                          window.location.hash = '#/user/manage-address'
                        } else if (tab.id === 'contact') {
                          window.location.hash = '#/user/contact'
                        } else if (tab.id === 'wishlist') {
                          window.location.hash = '#/user/wishlist'
                        } else {
                          setActiveTab(tab.id)
                          // Smooth scroll to content area
                          setTimeout(() => {
                            const contentElement = document.getElementById('profile-content')
                            if (contentElement) {
                              contentElement.scrollIntoView({ 
                                behavior: 'smooth', 
                                block: 'start' 
                              })
                            }
                          }, 100)
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-sm'
                      }`}
                    >
                      <IconComponent className="h-5 w-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  )
                })}
                
                {isAuthenticated ? (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Logout</span>
                  </button>
                ) : (
                  <button
                    onClick={() => window.location.hash = '#/user/login'}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <LogIn className="h-5 w-5" />
                    <span className="font-medium">Login</span>
                  </button>
                )}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3" id="profile-content">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold dark:text-slate-100">Your Profile</h2>
                    {isAuthenticated && (
                      <button
                        onClick={() => setEditing(!editing)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {editing ? 'Cancel' : 'Edit Profile'}
                      </button>
                    )}
                  </div>

                  {editing ? (
                    <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Name</label>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-3 dark:bg-slate-700 dark:text-slate-100"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Phone</label>
                          <input
                            type="tel"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-3 dark:bg-slate-700 dark:text-slate-100"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Address</label>
                        <input
                          type="text"
                          placeholder="Street Address"
                          value={editForm.address.street}
                          onChange={(e) => setEditForm({ ...editForm, address: { ...editForm.address, street: e.target.value } })}
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-3 dark:bg-slate-700 dark:text-slate-100 mb-3"
                          required
                        />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input
                            type="text"
                            placeholder="City"
                            value={editForm.address.city}
                            onChange={(e) => setEditForm({ ...editForm, address: { ...editForm.address, city: e.target.value } })}
                            className="rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-3 dark:bg-slate-700 dark:text-slate-100"
                            required
                          />
                          <input
                            type="text"
                            placeholder="State"
                            value={editForm.address.state}
                            onChange={(e) => setEditForm({ ...editForm, address: { ...editForm.address, state: e.target.value } })}
                            className="rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-3 dark:bg-slate-700 dark:text-slate-100"
                            required
                          />
                          <input
                            type="text"
                            placeholder="ZIP Code"
                            value={editForm.address.zip}
                            onChange={(e) => setEditForm({ ...editForm, address: { ...editForm.address, zip: e.target.value } })}
                            className="rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-3 dark:bg-slate-700 dark:text-slate-100"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button
                          type="submit"
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(false)}
                          className="px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-slate-500" />
                          <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Name</p>
                            <p className="font-medium dark:text-slate-100">{profile.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-slate-500" />
                          <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Phone</p>
                            <p className="font-medium dark:text-slate-100">{profile.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-slate-500" />
                          <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
                            <p className="font-medium dark:text-slate-100">{profile.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-slate-500" />
                          <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Address</p>
                            <p className="font-medium dark:text-slate-100">
                              {profile.address ? `${profile.address.street || ''}, ${profile.address.city || ''}, ${profile.address.state || ''} ${profile.address.zip || ''}`.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '') : 'No address provided'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                        <h3 className="text-lg font-semibold dark:text-slate-100 mb-4">Account Statistics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{profile.loyalty_points}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Loyalty Points</p>
                          </div>
                          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{profile.total_orders}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Total Orders</p>
                          </div>
                          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                              {new Date(profile.member_since).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Member Since</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Nefol Coins Tab */}
              {activeTab === 'cash' && (
                <div>
                  <h2 className="text-2xl font-semibold dark:text-slate-100 mb-6">Nefol Coins</h2>
                  <div className="text-center py-12">
                    <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                      <CreditCard className="h-12 w-12 text-green-600" />
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">{formatCoins(0)}</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">Your Nefol Coins Balance</p>
                    <div className="space-y-4 max-w-md mx-auto">
                      <button className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Earn Coins
                      </button>
                      <button className="w-full px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        Coins History
                      </button>
                    </div>
                  </div>
                </div>
              )}


              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div>
                  <h2 className="text-2xl font-semibold dark:text-slate-100 mb-6">Your Orders</h2>
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold dark:text-slate-100 mb-2">No Orders Yet</h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-6">Start shopping to see your orders here</p>
                      <a href="#/user/shop" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Start Shopping
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-semibold dark:text-slate-100">Order #{order.order_number}</h3>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{order.date}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold dark:text-slate-100">₹{order.total}</p>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="dark:text-slate-100">{item.name} x {item.quantity}</span>
                                <span className="dark:text-slate-100">₹{item.price}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Saved Cards Tab */}
              {activeTab === 'cards' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold dark:text-slate-100">Saved Cards</h2>
                    {isAuthenticated && (
                      <button 
                        onClick={() => setShowAddCard(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add New Card
                      </button>
                    )}
                  </div>
                  
                  {!Array.isArray(savedCards) || savedCards.length === 0 ? (
                    <div className="text-center py-12">
                      <CreditCard className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold dark:text-slate-100 mb-2">No Saved Cards</h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-6">Add a card for faster checkout</p>
                      {isAuthenticated && (
                        <button 
                          onClick={() => setShowAddCard(true)}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Add Card
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(Array.isArray(savedCards) ? savedCards : []).map((card) => (
                        <div key={card.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">{card.type}</span>
                              </div>
                              <div>
                                <p className="font-semibold dark:text-slate-100">{card.card_number}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Expires {card.expiry}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {card.is_default && (
                                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Default</span>
                              )}
                              {isAuthenticated && (
                                <button className="px-3 py-1 text-sm text-red-600 hover:text-red-700">Remove</button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Manage Address Tab */}
              {activeTab === 'address' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold dark:text-slate-100">Manage Address</h2>
                    {isAuthenticated && (
                      <button 
                        onClick={() => setShowAddAddress(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add New Address
                      </button>
                    )}
                  </div>
                  
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold dark:text-slate-100">{profile.name}</h3>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                          {profile.address ? (
                            <>
                              {profile.address.street}<br />
                              {profile.address.city}, {profile.address.state} {profile.address.zip}
                            </>
                          ) : (
                            'No address provided'
                          )}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">{profile.phone}</p>
                      </div>
                      {isAuthenticated && (
                        <div className="flex gap-2">
                          <button className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700">Edit</button>
                          <button className="px-3 py-1 text-sm text-red-600 hover:text-red-700">Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Us Tab */}
              {activeTab === 'contact' && (
                <div>
                  <h2 className="text-2xl font-semibold dark:text-slate-100 mb-6">Contact Us</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-semibold dark:text-slate-100 mb-4">Get in Touch</h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-slate-500" />
                          <div>
                            <p className="font-medium dark:text-slate-100">Phone</p>
                            <p className="text-slate-600 dark:text-slate-400">+91 98765 43210</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-slate-500" />
                          <div>
                            <p className="font-medium dark:text-slate-100">Email</p>
                            <p className="text-slate-600 dark:text-slate-400">support@nefol.com</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-slate-500" />
                          <div>
                            <p className="font-medium dark:text-slate-100">Address</p>
                            <p className="text-slate-600 dark:text-slate-400">
                              123 Beauty Street<br />
                              Mumbai, Maharashtra 400001
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold dark:text-slate-100 mb-4">Send Message</h3>
                      <form className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Subject</label>
                          <input
                            type="text"
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-3 dark:bg-slate-700 dark:text-slate-100"
                            placeholder="What can we help you with?"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Message</label>
                          <textarea
                            rows={4}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-3 dark:bg-slate-700 dark:text-slate-100"
                            placeholder="Tell us more about your inquiry..."
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Send Message
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Card Modal */}
      {showAddCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold dark:text-slate-100 mb-4">Add New Card</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleAddCard(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Card Number</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-3 dark:bg-slate-700 dark:text-slate-100"
                  placeholder="1234 5678 9012 3456"
                  value={newCard.card_number}
                  onChange={(e) => setNewCard({...newCard, card_number: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Expiry</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-3 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="MM/YY"
                    value={newCard.expiry}
                    onChange={(e) => setNewCard({...newCard, expiry: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">CVV</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-3 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="123"
                    value={newCard.cvv}
                    onChange={(e) => setNewCard({...newCard, cvv: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Cardholder Name</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-3 dark:bg-slate-700 dark:text-slate-100"
                  placeholder="John Doe"
                  value={newCard.name}
                  onChange={(e) => setNewCard({...newCard, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Card Type</label>
                <select
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-3 dark:bg-slate-700 dark:text-slate-100"
                  value={newCard.type}
                  onChange={(e) => setNewCard({...newCard, type: e.target.value})}
                >
                  <option value="Visa">Visa</option>
                  <option value="Mastercard">Mastercard</option>
                  <option value="American Express">American Express</option>
                  <option value="Discover">Discover</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddCard(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Address Modal */}
      {showAddAddress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold dark:text-slate-100 mb-4">Add New Address</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleAddAddress(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Street Address</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-3 dark:bg-slate-700 dark:text-slate-100"
                  placeholder="123 Main Street"
                  value={newAddress.street}
                  onChange={(e) => setNewAddress({...newAddress, street: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">City</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-3 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="Mumbai"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">State</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-3 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="Maharashtra"
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">ZIP Code</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-3 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="400001"
                    value={newAddress.zip}
                    onChange={(e) => setNewAddress({...newAddress, zip: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-3 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="+91 98765 43210"
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddAddress(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}