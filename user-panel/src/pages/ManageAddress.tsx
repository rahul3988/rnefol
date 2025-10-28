import React, { useState, useEffect } from 'react'
import { MapPin, Plus, Trash2, Edit, Check } from 'lucide-react'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

interface Address {
  id: string
  street: string
  city: string
  state: string
  zip: string
  phone: string
  is_default: boolean
}

export default function ManageAddress() {
  const { isAuthenticated } = useAuth()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editAddress, setEditAddress] = useState<Address | null>(null)
  const [addressForm, setAddressForm] = useState({
    street: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    is_default: false
  })

  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated])

  const fetchAddresses = async () => {
    try {
      setLoading(true)
      const userData = await api.user.getProfile()
      
      // Create address from user profile
      if (userData.address) {
        setAddresses([{
          id: '1',
          street: userData.address.street || '',
          city: userData.address.city || '',
          state: userData.address.state || '',
          zip: userData.address.zip || '',
          phone: userData.phone || '',
          is_default: true
        }])
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error)
      setAddresses([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const updatedProfile = await api.user.updateProfile({
        address: {
          street: addressForm.street,
          city: addressForm.city,
          state: addressForm.state,
          zip: addressForm.zip
        },
        phone: addressForm.phone
      })
      
      await fetchAddresses()
      setShowAddForm(false)
      setAddressForm({
        street: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        is_default: false
      })
      alert('Address added successfully!')
    } catch (error) {
      console.error('Failed to add address:', error)
      alert('Failed to add address. Please try again.')
    }
  }

  const handleEditAddress = () => {
    setEditAddress(null)
    setAddressForm({
      street: '',
      city: '',
      state: '',
      zip: '',
      phone: '',
      is_default: false
    })
  }

  const handleDelete = async (addressId: string) => {
    if (confirm('Are you sure you want to delete this address?')) {
      // TODO: Implement address deletion logic
      alert('Address deletion functionality coming soon!')
    }
  }

  if (loading) {
    return (
      <main className="py-10 dark:bg-slate-900 min-h-screen">
        <div className="mx-auto max-w-4xl px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading your addresses...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="py-10 dark:bg-slate-900 min-h-screen">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mb-4">
            <MapPin className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Manage Address
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Manage your delivery addresses
          </p>
        </div>

        {/* Add Address Button */}
        <div className="mb-8">
          <button
            onClick={() => {
              setShowAddForm(!showAddForm)
              setEditAddress(null)
              setAddressForm({
                street: '',
                city: '',
                state: '',
                zip: '',
                phone: '',
                is_default: false
              })
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add New Address
          </button>
        </div>

        {/* Add/Edit Address Form */}
        {(showAddForm || editAddress) && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              {editAddress ? 'Edit Address' : 'Add New Address'}
            </h3>
            <form onSubmit={editAddress ? handleEditAddress : handleAddAddress} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  value={addressForm.street}
                  onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700"
                  placeholder="123 Main Street"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700"
                    placeholder="City"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700"
                    placeholder="State"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={addressForm.zip}
                    onChange={(e) => setAddressForm({ ...addressForm, zip: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700"
                    placeholder="12345"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={addressForm.is_default}
                  onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Set as default address
                </label>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editAddress ? 'Update' : 'Save'} Address
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditAddress(null)
                  }}
                  className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-6 py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Addresses List */}
        {addresses.length === 0 ? (
          <div className="text-center py-16">
            <MapPin className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              No Addresses Saved
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Add an address to make checkout faster
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Add Your First Address
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {address.is_default && (
                      <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full mb-3">
                        <Check className="w-4 h-4" />
                        <span className="text-sm font-medium">Default</span>
                      </div>
                    )}
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                      {address.street}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      {address.city}, {address.state} {address.zip}
                    </p>
                    {address.phone && (
                      <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Phone: {address.phone}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditAddress(address)
                        setAddressForm({
                          street: address.street,
                          city: address.city,
                          state: address.state,
                          zip: address.zip,
                          phone: address.phone,
                          is_default: address.is_default
                        })
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    {!address.is_default && (
                      <button
                        onClick={() => handleDelete(address.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

