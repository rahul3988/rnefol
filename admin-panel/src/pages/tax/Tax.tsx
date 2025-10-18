import React, { useState, useEffect } from 'react'

interface TaxRate {
  id: string
  name: string
  rate: number
  type: 'percentage' | 'fixed'
  region: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface TaxReport {
  period: string
  totalSales: number
  totalTax: number
  taxByRegion: { region: string; amount: number }[]
}

const Tax = () => {
  const [taxRates, setTaxRates] = useState<TaxRate[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedTaxRate, setSelectedTaxRate] = useState<TaxRate | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [regionFilter, setRegionFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [taxReport, setTaxReport] = useState<TaxReport | null>(null)

  // Load tax data from API
  useEffect(() => {
    loadTaxData();
  }, []);

  const loadTaxData = async () => {
    try {
      setLoading(true);
      const apiBase = (import.meta as any).env.VITE_API_URL || `http://${window.location.hostname}:4000`;
      const [ratesRes, reportRes] = await Promise.all([
        fetch(`${apiBase}/api/tax-rates`),
        fetch(`${apiBase}/api/tax-report`)
      ]);
      
      if (ratesRes.ok) {
        const ratesData = await ratesRes.json();
        setTaxRates(ratesData);
      }
      
      if (reportRes.ok) {
        const reportData = await reportRes.json();
        setTaxReport(reportData);
      }
    } catch (error) {
      console.error('Failed to load tax data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTaxRates = taxRates.filter(rate => {
    const matchesSearch = rate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rate.region.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRegion = regionFilter === 'all' || rate.region === regionFilter
    return matchesSearch && matchesRegion
  })

  const handleCreateTaxRate = async (taxData: Partial<TaxRate>) => {
    setLoading(true)
    try {
      const response = await fetch('/api/tax-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taxData)
      })
      
      if (response.ok) {
        const newTaxRate = await response.json()
        setTaxRates([...taxRates, newTaxRate])
        setShowCreateModal(false)
      }
    } catch (error) {
      console.error('Error creating tax rate:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTaxRate = async (taxData: Partial<TaxRate>) => {
    if (!selectedTaxRate) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/tax-rates/${selectedTaxRate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taxData)
      })
      
      if (response.ok) {
        const updatedTaxRate = await response.json()
        setTaxRates(taxRates.map(rate => rate.id === selectedTaxRate.id ? updatedTaxRate : rate))
        setShowEditModal(false)
        setSelectedTaxRate(null)
      }
    } catch (error) {
      console.error('Error updating tax rate:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTaxRate = async (taxRateId: string) => {
    if (!confirm('Are you sure you want to delete this tax rate?')) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/tax-rates/${taxRateId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setTaxRates(taxRates.filter(rate => rate.id !== taxRateId))
      }
    } catch (error) {
      console.error('Error deleting tax rate:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (taxRateId: string) => {
    setLoading(true)
    try {
      const taxRate = taxRates.find(rate => rate.id === taxRateId)
      if (!taxRate) return

      const response = await fetch(`/api/tax-rates/${taxRateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !taxRate.isActive })
      })
      
      if (response.ok) {
        setTaxRates(taxRates.map(rate => 
          rate.id === taxRateId ? { ...rate, isActive: !rate.isActive } : rate
        ))
      }
    } catch (error) {
      console.error('Error toggling tax rate:', error)
    } finally {
      setLoading(false)
    }
  }

  const activeTaxRates = taxRates.filter(rate => rate.isActive)
  const totalTaxCollected = taxReport?.totalTax || 0
  const averageTaxRate = activeTaxRates.length > 0 
    ? activeTaxRates.reduce((sum, rate) => sum + rate.rate, 0) / activeTaxRates.length 
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brand-primary">Tax Management</h1>
          <p className="text-gray-600 mt-1">Configure tax rates and view tax reports</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          <span className="text-lg mr-2">💰</span>
          Add Tax Rate
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Tax Rates</p>
              <p className="text-2xl font-bold text-brand-primary">{activeTaxRates.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tax Collected</p>
              <p className="text-2xl font-bold text-brand-primary">${totalTaxCollected.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💵</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Tax Rate</p>
              <p className="text-2xl font-bold text-brand-primary">{averageTaxRate.toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Regions Covered</p>
              <p className="text-2xl font-bold text-brand-primary">
                {new Set(taxRates.map(rate => rate.region)).size}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🌍</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tax Report */}
      {taxReport && (
        <div className="metric-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax Report - {taxReport.period}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Total Sales</span>
                <span className="font-semibold">${taxReport.totalSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Total Tax Collected</span>
                <span className="font-semibold text-green-600">${taxReport.totalTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tax Rate</span>
                <span className="font-semibold">{((taxReport.totalTax / taxReport.totalSales) * 100).toFixed(2)}%</span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Tax by Region</h4>
              {taxReport.taxByRegion.map((region, index) => (
                <div key={index} className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">{region.region}</span>
                  <span className="text-sm font-medium">${region.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="metric-card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search tax rates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary"
            />
          </div>
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary"
          >
            <option value="all">All Regions</option>
            {Array.from(new Set(taxRates.map(rate => rate.region))).map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tax Rates Table */}
      <div className="metric-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Rate</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Region</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTaxRates.map((rate) => (
                <tr key={rate.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{rate.name}</td>
                  <td className="py-3 px-4">
                    <span className="font-medium">
                      {rate.type === 'percentage' ? `${rate.rate}%` : `$${rate.rate}`}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      rate.type === 'percentage' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {rate.type.charAt(0).toUpperCase() + rate.type.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{rate.region}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      rate.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {rate.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{rate.createdAt}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTaxRate(rate)
                          setShowEditModal(true)
                        }}
                        className="text-brand-secondary hover:text-brand-primary"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleToggleActive(rate.id)}
                        className={`${rate.isActive ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}`}
                        title={rate.isActive ? 'Deactivate' : 'Activate'}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteTaxRate(rate.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Tax Rate Modal */}
      {showCreateModal && (
        <CreateTaxRateModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateTaxRate}
          loading={loading}
        />
      )}

      {/* Edit Tax Rate Modal */}
      {showEditModal && selectedTaxRate && (
        <EditTaxRateModal
          taxRate={selectedTaxRate}
          onClose={() => {
            setShowEditModal(false)
            setSelectedTaxRate(null)
          }}
          onSubmit={handleUpdateTaxRate}
          loading={loading}
        />
      )}
    </div>
  )
}

// Create Tax Rate Modal Component
const CreateTaxRateModal = ({ onClose, onSubmit, loading }: {
  onClose: () => void
  onSubmit: (data: Partial<TaxRate>) => void
  loading: boolean
}) => {
  const [formData, setFormData] = useState({
    name: '',
    rate: 0,
    type: 'percentage' as 'percentage' | 'fixed',
    region: '',
    isActive: true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const taxData = {
      ...formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    onSubmit(taxData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-brand-primary">Add Tax Rate</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rate</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.rate}
              onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'percentage' | 'fixed' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
            <input
              type="text"
              required
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-brand-secondary focus:ring-brand-secondary border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Active
            </label>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Creating...' : 'Create Tax Rate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Edit Tax Rate Modal Component
const EditTaxRateModal = ({ taxRate, onClose, onSubmit, loading }: {
  taxRate: TaxRate
  onClose: () => void
  onSubmit: (data: Partial<TaxRate>) => void
  loading: boolean
}) => {
  const [formData, setFormData] = useState({
    name: taxRate.name,
    rate: taxRate.rate,
    type: taxRate.type,
    region: taxRate.region,
    isActive: taxRate.isActive
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const taxData = {
      ...formData,
      updatedAt: new Date().toISOString()
    }
    onSubmit(taxData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-brand-primary">Edit Tax Rate</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rate</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.rate}
              onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'percentage' | 'fixed' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
            <input
              type="text"
              required
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-brand-secondary focus:ring-brand-secondary border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Active
            </label>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Updating...' : 'Update Tax Rate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Tax




