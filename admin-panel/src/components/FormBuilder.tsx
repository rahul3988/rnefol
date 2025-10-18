import React, { useState } from 'react'
import { Plus, Trash2, Edit, Save, Eye, Copy, Settings, Type, Mail, Phone, Calendar, MapPin, Star, CheckSquare, FileText, Image, Link } from 'lucide-react'

interface FormField {
  id: string
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'number' | 'file' | 'rating'
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: string
    min?: number
    max?: number
  }
  settings?: {
    multiple?: boolean
    accept?: string
    maxSize?: number
  }
}

interface Form {
  id: string
  title: string
  description: string
  fields: FormField[]
  settings: {
    theme: 'light' | 'dark' | 'custom'
    submitText: string
    successMessage: string
    redirectUrl?: string
    emailNotification?: boolean
    emailTo?: string
  }
  submissions: number
  createdAt: string
  isPublished: boolean
}

export default function FormBuilder() {
  const [forms] = useState<Form[]>([
    {
      id: '1',
      title: 'Customer Feedback Form',
      description: 'Collect customer feedback and reviews',
      fields: [
        { id: '1', type: 'text', label: 'Customer Name', placeholder: 'Enter your name', required: true },
        { id: '2', type: 'email', label: 'Email Address', placeholder: 'Enter your email', required: true },
        { id: '3', type: 'rating', label: 'Overall Rating', required: true },
        { id: '4', type: 'textarea', label: 'Feedback', placeholder: 'Share your thoughts...', required: true },
        { id: '5', type: 'checkbox', label: 'Subscribe to Newsletter', required: false }
      ],
      settings: {
        theme: 'light',
        submitText: 'Submit Feedback',
        successMessage: 'Thank you for your feedback!',
        emailNotification: true,
        emailTo: 'feedback@nefol.com'
      },
      submissions: 45,
      createdAt: '2024-01-15',
      isPublished: true
    },
    {
      id: '2',
      title: 'Product Inquiry Form',
      description: 'Handle product-related inquiries',
      fields: [
        { id: '1', type: 'text', label: 'Full Name', placeholder: 'Enter your full name', required: true },
        { id: '2', type: 'email', label: 'Email', placeholder: 'Enter your email', required: true },
        { id: '3', type: 'phone', label: 'Phone Number', placeholder: 'Enter your phone', required: false },
        { id: '4', type: 'select', label: 'Product Category', options: ['Skincare', 'Hair Care', 'Body Care'], required: true },
        { id: '5', type: 'textarea', label: 'Inquiry Details', placeholder: 'Describe your inquiry...', required: true }
      ],
      settings: {
        theme: 'light',
        submitText: 'Send Inquiry',
        successMessage: 'Your inquiry has been sent successfully!',
        emailNotification: true,
        emailTo: 'inquiries@nefol.com'
      },
      submissions: 23,
      createdAt: '2024-01-10',
      isPublished: true
    },
    {
      id: '3',
      title: 'Newsletter Signup',
      description: 'Simple newsletter subscription form',
      fields: [
        { id: '1', type: 'email', label: 'Email Address', placeholder: 'Enter your email', required: true },
        { id: '2', type: 'checkbox', label: 'I agree to receive marketing emails', required: true }
      ],
      settings: {
        theme: 'light',
        submitText: 'Subscribe',
        successMessage: 'Successfully subscribed to our newsletter!',
        emailNotification: false
      },
      submissions: 156,
      createdAt: '2024-01-05',
      isPublished: true
    }
  ])

  const [selectedForm, setSelectedForm] = useState<Form | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showFormPreview, setShowFormPreview] = useState(false)
  const [editingField, setEditingField] = useState<FormField | null>(null)

  const fieldTypes = [
    { type: 'text', label: 'Text Input', icon: Type },
    { type: 'email', label: 'Email', icon: Mail },
    { type: 'phone', label: 'Phone', icon: Phone },
    { type: 'textarea', label: 'Text Area', icon: FileText },
    { type: 'select', label: 'Dropdown', icon: Settings },
    { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
    { type: 'radio', label: 'Radio Button', icon: Settings },
    { type: 'date', label: 'Date Picker', icon: Calendar },
    { type: 'number', label: 'Number', icon: Type },
    { type: 'file', label: 'File Upload', icon: Image },
    { type: 'rating', label: 'Rating', icon: Star }
  ]

  const getFieldIcon = (type: string) => {
    const fieldType = fieldTypes.find(ft => ft.type === type)
    return fieldType ? fieldType.icon : Type
  }

  const handleAddField = (type: string) => {
    if (!selectedForm) return
    
    const newField: FormField = {
      id: Date.now().toString(),
      type: type as any,
      label: `New ${type} Field`,
      required: false,
      options: type === 'select' || type === 'radio' ? ['Option 1', 'Option 2'] : undefined
    }
    
    // In a real app, this would update the form state
    console.log('Adding field:', newField)
  }

  const handleDeleteField = (fieldId: string) => {
    if (!selectedForm) return
    console.log('Deleting field:', fieldId)
  }

  const handleEditField = (field: FormField) => {
    setEditingField(field)
  }

  const handleSaveField = () => {
    setEditingField(null)
    // In a real app, this would save the field changes
  }

  const handlePublishForm = (formId: string) => {
    console.log('Publishing form:', formId)
    alert('Form published successfully!')
  }

  const handleCopyForm = (formId: string) => {
    console.log('Copying form:', formId)
    alert('Form copied successfully!')
  }

  const handleDeleteForm = (formId: string) => {
    console.log('Deleting form:', formId)
    alert('Form deleted successfully!')
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Form Builder
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Create custom forms to collect customer data and feedback
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Form</span>
        </button>
      </div>

      {/* Forms List */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Your Forms
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <div key={form.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {form.title}
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  form.isPublished 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {form.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                {form.description}
              </p>
              
              <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-500 mb-4">
                <span>{form.submissions} submissions</span>
                <span>{form.createdAt}</span>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedForm(form)}
                  className="flex-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => setShowFormPreview(true)}
                  className="px-3 py-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm rounded hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleCopyForm(form.id)}
                  className="px-3 py-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm rounded hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteForm(form.id)}
                  className="px-3 py-1 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 text-sm rounded hover:bg-red-50 dark:hover:bg-red-900 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form Builder */}
      {selectedForm && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Field Types */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Field Types
            </h3>
            <div className="space-y-2">
              {fieldTypes.map((fieldType) => {
                const IconComponent = fieldType.icon
                return (
                  <button
                    key={fieldType.type}
                    onClick={() => handleAddField(fieldType.type)}
                    className="w-full flex items-center space-x-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <IconComponent className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {fieldType.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Form Fields */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Form Fields
              </h3>
              <button
                onClick={() => handlePublishForm(selectedForm.id)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Publish Form
              </button>
            </div>
            
            <div className="space-y-4">
              {selectedForm.fields.map((field) => {
                const IconComponent = getFieldIcon(field.type)
                return (
                  <div key={field.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <IconComponent className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {field.label}
                        </span>
                        {field.required && (
                          <span className="text-red-500 text-sm">*</span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditField(field)}
                          className="p-1 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteField(field.id)}
                          className="p-1 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Type: {field.type}
                      {field.placeholder && (
                        <span className="ml-2">Placeholder: {field.placeholder}</span>
                      )}
                    </div>
                    
                    {field.options && (
                      <div className="mt-2">
                        <p className="text-sm text-slate-600 dark:text-slate-400">Options:</p>
                        <ul className="text-sm text-slate-500 dark:text-slate-500">
                          {field.options.map((option, index) => (
                            <li key={index}>• {option}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Form Preview Modal */}
      {showFormPreview && selectedForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Form Preview: {selectedForm.title}
              </h3>
              <button
                onClick={() => setShowFormPreview(false)}
                className="text-2xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-slate-600 dark:text-slate-400">
                {selectedForm.description}
              </p>
              
              {selectedForm.fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  {field.type === 'text' && (
                    <input
                      type="text"
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  )}
                  
                  {field.type === 'email' && (
                    <input
                      type="email"
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  )}
                  
                  {field.type === 'phone' && (
                    <input
                      type="tel"
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  )}
                  
                  {field.type === 'textarea' && (
                    <textarea
                      rows={4}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  )}
                  
                  {field.type === 'select' && (
                    <select className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100">
                      <option>Select an option</option>
                      {field.options?.map((option, index) => (
                        <option key={index} value={option}>{option}</option>
                      ))}
                    </select>
                  )}
                  
                  {field.type === 'checkbox' && (
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {field.label}
                      </span>
                    </div>
                  )}
                  
                  {field.type === 'radio' && (
                    <div className="space-y-2">
                      {field.options?.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input type="radio" name={field.id} className="rounded" />
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {option}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {field.type === 'date' && (
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  )}
                  
                  {field.type === 'number' && (
                    <input
                      type="number"
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  )}
                  
                  {field.type === 'file' && (
                    <input
                      type="file"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  )}
                  
                  {field.type === 'rating' && (
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} className="text-yellow-400 hover:text-yellow-500">
                          <Star className="h-6 w-6" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                {selectedForm.settings.submitText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Create New Form
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Form Title
                </label>
                <input
                  type="text"
                  placeholder="Enter form title"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter form description"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Theme
                </label>
                <select className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100">
                  <option>Light</option>
                  <option>Dark</option>
                  <option>Custom</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  alert('Form created successfully!')
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Form
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Builder Best Practices */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-4">Form Builder Best Practices</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold">1</span>
            </div>
            <h3 className="font-semibold mb-2">Keep It Simple</h3>
            <p className="text-sm opacity-90">
              Use only necessary fields to avoid form abandonment and improve completion rates.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold">2</span>
            </div>
            <h3 className="font-semibold mb-2">Clear Labels</h3>
            <p className="text-sm opacity-90">
              Use descriptive labels and helpful placeholder text to guide users.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold">3</span>
            </div>
            <h3 className="font-semibold mb-2">Mobile Friendly</h3>
            <p className="text-sm opacity-90">
              Ensure forms work well on mobile devices with touch-friendly inputs.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
