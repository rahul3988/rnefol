import React, { useState, useEffect } from 'react'
import { Settings, Save, Eye, Palette, FileText, Building2, Users, Receipt } from 'lucide-react'

interface CompanyDetails {
  companyName: string
  companyAddress: string
  companyPhone: string
  companyEmail: string
  gstNumber: string
  panNumber: string
  bankName: string
  accountNumber: string
  ifscCode: string
}

interface InvoiceSettings {
  companyDetails: CompanyDetails
  colors: {
    primaryStart: string
    primaryEnd: string
    accentStart: string
    accentEnd: string
  }
  tax: {
    rate: number
    type: 'IGST' | 'CGST+SGST'
  }
  terms: string
  signatureText: string
  currency: string
}

const InvoiceSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<InvoiceSettings>({
    companyDetails: {
      companyName: 'Nefol',
      companyAddress: '',
      companyPhone: '7355384939',
      companyEmail: 'info@nefol.com',
      gstNumber: '',
      panNumber: '',
      bankName: '',
      accountNumber: '',
      ifscCode: ''
    },
    colors: {
      primaryStart: '#667eea',
      primaryEnd: '#764ba2',
      accentStart: '#667eea',
      accentEnd: '#764ba2'
    },
    tax: {
      rate: 18,
      type: 'IGST'
    },
    terms: 'Thank you for doing business with us.',
    signatureText: 'Authorized Signatory',
    currency: '₹'
  })

  const [loading, setLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [showPreview, setShowPreview] = useState(false)
  const [activeTab, setActiveTab] = useState<'company' | 'design' | 'tax' | 'terms'>('company')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const apiBase = (import.meta as any).env.VITE_API_URL || `http://192.168.1.66:4000`
      
      // Load company details
      const detailsResponse = await fetch(`${apiBase}/api/invoice-settings/company-details`)
      if (detailsResponse.ok) {
        const data = await detailsResponse.json()
        if (data && Object.keys(data).length > 0) {
          setSettings(prev => ({
            ...prev,
            companyDetails: { ...prev.companyDetails, ...data }
          }))
        }
      }

      // Load other settings
      const settingsResponse = await fetch(`${apiBase}/api/invoice-settings/all`)
      if (settingsResponse.ok) {
        const data = await settingsResponse.json()
        if (data) {
          setSettings(prev => ({ ...prev, ...data }))
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setSaveStatus('idle')

    try {
      const apiBase = (import.meta as any).env.VITE_API_URL || `http://192.168.1.66:4000`
      
      // Save company details
      await fetch(`${apiBase}/api/invoice-settings/company-details`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings.companyDetails)
      })

      // Save all settings
      await fetch(`${apiBase}/api/invoice-settings/all`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      console.error('Failed to save settings:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setLoading(false)
    }
  }

  const updateNestedState = (section: string, field: string, value: any) => {
    setSettings(prev => {
      const newState = { ...prev }
      
      if (section === 'companyDetails' || section === 'colors' || section === 'tax') {
        newState[section as keyof InvoiceSettings] = {
          ...(prev[section as keyof InvoiceSettings] as any),
          [field]: value
        } as any
      } else {
        // Handle other fields like 'terms', 'signatureText', 'currency'
        newState[field as keyof InvoiceSettings] = value as any
      }
      
      return newState
    })
  }
  
  const updateSettings = (field: keyof InvoiceSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const generatePreviewStyle = () => {
    return {
      background: `linear-gradient(135deg, ${settings.colors.primaryStart} 0%, ${settings.colors.primaryEnd} 100%)`,
      color: 'white',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '20px'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brand-primary">Invoice Settings</h1>
          <p className="text-gray-600 mt-1">Customize your invoice design and details</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Eye className="w-5 h-5" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      </div>

      {/* Save Status */}
      {saveStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          ✓ All settings saved successfully!
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          ✗ Failed to save settings. Please try again.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {['Company', 'Design', 'Tax', 'Terms'].map((tab, idx) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase().replace('tax', 'tax').replace('terms', 'terms').replace('company', 'company').replace('design', 'design') as any)}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === (tab === 'Company' ? 'company' : tab === 'Design' ? 'design' : tab === 'Tax' ? 'tax' : 'terms')
                ? 'border-b-2 border-brand-primary text-brand-primary'
                : 'text-gray-600 hover:text-brand-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        
        {/* Company Details Tab */}
        {activeTab === 'company' && (
          <div className="metric-card">
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="w-6 h-6 text-brand-primary" />
              <h2 className="text-xl font-bold text-brand-primary">Company Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={settings.companyDetails.companyName}
                  onChange={(e) => updateNestedState('companyDetails', 'companyName', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={settings.companyDetails.companyPhone}
                  onChange={(e) => updateNestedState('companyDetails', 'companyPhone', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={settings.companyDetails.companyEmail}
                  onChange={(e) => updateNestedState('companyDetails', 'companyEmail', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
                <input
                  type="text"
                  value={settings.companyDetails.gstNumber}
                  onChange={(e) => updateNestedState('companyDetails', 'gstNumber', e.target.value)}
                  placeholder="29ABCDE1234F1Z5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">PAN Number</label>
                <input
                  type="text"
                  value={settings.companyDetails.panNumber}
                  onChange={(e) => updateNestedState('companyDetails', 'panNumber', e.target.value)}
                  placeholder="ABCDE1234F"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Complete Address <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={settings.companyDetails.companyAddress}
                onChange={(e) => updateNestedState('companyDetails', 'companyAddress', e.target.value)}
                placeholder="Enter complete company address"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary"
              />
            </div>

            {/* Banking Info */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Banking Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                  <input
                    type="text"
                    value={settings.companyDetails.bankName}
                    onChange={(e) => updateNestedState('companyDetails', 'bankName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                  <input
                    type="text"
                    value={settings.companyDetails.accountNumber}
                    onChange={(e) => updateNestedState('companyDetails', 'accountNumber', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">IFSC Code</label>
                  <input
                    type="text"
                    value={settings.companyDetails.ifscCode}
                    onChange={(e) => updateNestedState('companyDetails', 'ifscCode', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Design Tab */}
        {activeTab === 'design' && (
          <div className="space-y-6">
            <div className="metric-card">
              <div className="flex items-center gap-2 mb-6">
                <Palette className="w-6 h-6 text-brand-primary" />
                <h2 className="text-xl font-bold text-brand-primary">Color Customization</h2>
              </div>

              {/* Preview */}
              <div style={generatePreviewStyle()} className="mb-6">
                <h3 className="text-xl font-bold mb-2">Invoice Header Preview</h3>
                <p>This is how your invoice header will look</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Gradient Start
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={settings.colors.primaryStart}
                      onChange={(e) => updateNestedState('colors', 'primaryStart', e.target.value)}
                      className="w-20 h-10 rounded border border-gray-300"
                    />
                    <input
                      type="text"
                      value={settings.colors.primaryStart}
                      onChange={(e) => updateNestedState('colors', 'primaryStart', e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Gradient End
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={settings.colors.primaryEnd}
                      onChange={(e) => updateNestedState('colors', 'primaryEnd', e.target.value)}
                      className="w-20 h-10 rounded border border-gray-300"
                    />
                    <input
                      type="text"
                      value={settings.colors.primaryEnd}
                      onChange={(e) => updateNestedState('colors', 'primaryEnd', e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    value={settings.currency}
                    onChange={(e) => updateSettings('currency', e.target.value)}
                    placeholder="₹"
                    maxLength={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                  />
                </div>
              </div>

              {/* Preset Colors */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Color Presets</h3>
                <div className="flex gap-3 flex-wrap">
                  {[
                    { name: 'Arctic Blue', start: '#667eea', end: '#764ba2' },
                    { name: 'Ocean Blue', start: '#2193b0', end: '#6dd5ed' },
                    { name: 'Purple', start: '#9b59b6', end: '#e74c3c' },
                    { name: 'Green', start: '#11998e', end: '#38ef7d' },
                    { name: 'Orange', start: '#f12711', end: '#f5af19' },
                    { name: 'Pink', start: '#ec008c', end: '#fc6767' }
                  ].map(preset => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        updateNestedState('colors', 'primaryStart', preset.start)
                        updateNestedState('colors', 'primaryEnd', preset.end)
                      }}
                      className="px-4 py-2 rounded-lg border border-gray-300 hover:border-brand-primary transition-colors"
                      style={{ background: `linear-gradient(135deg, ${preset.start} 0%, ${preset.end} 100%)`, color: 'white' }}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tax Tab */}
        {activeTab === 'tax' && (
          <div className="metric-card">
            <div className="flex items-center gap-2 mb-6">
              <Receipt className="w-6 h-6 text-brand-primary" />
              <h2 className="text-xl font-bold text-brand-primary">Tax Settings</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Rate (%)
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="range"
                    min="0"
                    max="28"
                    step="0.5"
                    value={settings.tax.rate}
                    onChange={(e) => updateNestedState('tax', 'rate', parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="font-bold text-brand-primary text-lg w-20 text-right">
                    {settings.tax.rate}%
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Type
                </label>
                <select
                  value={settings.tax.type}
                  onChange={(e) => updateNestedState('tax', 'type', e.target.value as 'IGST' | 'CGST+SGST')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                >
                  <option value="IGST">IGST (Inter-State)</option>
                  <option value="CGST+SGST">CGST + SGST (Intra-State)</option>
                </select>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Tax Calculation:</h4>
              <p className="text-sm text-blue-700">
                {settings.tax.type === 'IGST' 
                  ? `Your invoices will show ${settings.tax.rate}% IGST (Integrated GST) for inter-state sales.`
                  : `Your invoices will show ${settings.tax.rate / 2}% CGST and ${settings.tax.rate / 2}% SGST for intra-state sales.`
                }
              </p>
            </div>
          </div>
        )}

        {/* Terms Tab */}
        {activeTab === 'terms' && (
          <div className="metric-card">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-6 h-6 text-brand-primary" />
              <h2 className="text-xl font-bold text-brand-primary">Terms & Signature</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Terms and Conditions
                </label>
                <textarea
                  rows={6}
                  value={settings.terms}
                  onChange={(e) => updateSettings('terms', e.target.value)}
                  placeholder="Enter your terms and conditions..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Signature Text
                </label>
                <input
                  type="text"
                  value={settings.signatureText}
                  onChange={(e) => updateSettings('signatureText', e.target.value)}
                  placeholder="Authorized Signatory"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                />
              </div>

              {/* Preview */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Preview:</h4>
                <p className="text-gray-700 mb-4">{settings.terms}</p>
                <div className="text-gray-600">
                  <div>For: {settings.companyDetails.companyName || 'Your Company'}</div>
                  <div className="mt-2">{settings.signatureText}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Final Save Button */}
      <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn-primary px-6 py-3 flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>
    </div>
  )
}

export default InvoiceSettingsPage
