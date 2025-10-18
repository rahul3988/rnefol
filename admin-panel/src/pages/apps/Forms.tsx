import React, { useState } from 'react'

type Form = {
  id: number
  name: string
  type: 'contact' | 'newsletter' | 'feedback' | 'survey'
  submissions: number
  status: 'active' | 'inactive'
  createdAt: string
}

export default function Forms() {
  const [forms, setForms] = useState<Form[]>([
    {
      id: 1,
      name: 'Contact Us',
      type: 'contact',
      submissions: 45,
      status: 'active',
      createdAt: '2024-01-15'
    },
    {
      id: 2,
      name: 'Newsletter Signup',
      type: 'newsletter',
      submissions: 234,
      status: 'active',
      createdAt: '2024-01-10'
    },
    {
      id: 3,
      name: 'Product Feedback',
      type: 'feedback',
      submissions: 89,
      status: 'active',
      createdAt: '2024-01-05'
    },
    {
      id: 4,
      name: 'Customer Survey',
      type: 'survey',
      submissions: 156,
      status: 'inactive',
      createdAt: '2023-12-20'
    }
  ])

  const [activeTab, setActiveTab] = useState<'forms' | 'submissions' | 'create'>('forms')

  const getTypeIcon = (type: Form['type']) => {
    switch (type) {
      case 'contact': return '📞'
      case 'newsletter': return '📧'
      case 'feedback': return '💬'
      case 'survey': return '📋'
      default: return '📝'
    }
  }

  const getStatusColor = (status: Form['status']) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Forms</h1>
        <button className="btn-primary">Create Form</button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'forms', name: 'Forms', count: forms.length },
            { id: 'submissions', name: 'Submissions', count: forms.reduce((sum, f) => sum + f.submissions, 0) },
            { id: 'create', name: 'Create New', count: 0 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Forms Tab */}
      {activeTab === 'forms' && (
        <div className="space-y-6">
          {/* Form Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { title: 'Total Forms', value: forms.length, icon: '📝' },
              { title: 'Active', value: forms.filter(f => f.status === 'active').length, icon: '✅' },
              { title: 'Total Submissions', value: forms.reduce((sum, f) => sum + f.submissions, 0), icon: '📊' },
              { title: 'Avg. Submissions', value: Math.round(forms.reduce((sum, f) => sum + f.submissions, 0) / forms.length), icon: '📈' }
            ].map((stat, index) => (
              <div key={index} className="metric-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className="text-2xl">{stat.icon}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Forms Table */}
          <div className="metric-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="py-3 pr-4">Form</th>
                    <th className="py-3 pr-4">Type</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Submissions</th>
                    <th className="py-3 pr-4">Created</th>
                    <th className="py-3 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {forms.map((form) => (
                    <tr key={form.id} className="border-b border-gray-100">
                      <td className="py-3 pr-4">
                        <div className="flex items-center space-x-2">
                          <span>{getTypeIcon(form.type)}</span>
                          <span className="font-medium text-gray-900">{form.name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="capitalize text-gray-600">{form.type}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(form.status)}`}>
                          {form.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-semibold">{form.submissions}</td>
                      <td className="py-3 pr-4 text-gray-600">
                        {new Date(form.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex space-x-2">
                          <button className="btn-secondary text-xs px-2 py-1">Edit</button>
                          <button className="btn-secondary text-xs px-2 py-1">View</button>
                          <button className="btn-secondary text-xs px-2 py-1">Submissions</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Submissions Tab */}
      {activeTab === 'submissions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Submissions</h2>
            <button className="btn-secondary">Export All</button>
          </div>

          <div className="metric-card">
            <div className="space-y-4">
              {[
                {
                  form: 'Contact Us',
                  name: 'John Doe',
                  email: 'john@example.com',
                  message: 'I love your skincare products!',
                  submittedAt: '2024-01-20T10:30:00Z'
                },
                {
                  form: 'Newsletter Signup',
                  name: 'Jane Smith',
                  email: 'jane@example.com',
                  message: 'Subscribed to newsletter',
                  submittedAt: '2024-01-19T15:45:00Z'
                },
                {
                  form: 'Product Feedback',
                  name: 'Mike Johnson',
                  email: 'mike@example.com',
                  message: 'Great product, will buy again!',
                  submittedAt: '2024-01-18T09:15:00Z'
                }
              ].map((submission, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold text-gray-900">{submission.name}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-sm text-gray-600">{submission.email}</span>
                      </div>
                      <p className="text-gray-700 mb-2">{submission.message}</p>
                      <p className="text-xs text-gray-500">
                        Via {submission.form} • {new Date(submission.submittedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="btn-secondary text-xs px-2 py-1">Reply</button>
                      <button className="btn-secondary text-xs px-2 py-1">View</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Tab */}
      {activeTab === 'create' && (
        <div className="space-y-6">
          <div className="metric-card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Form</h2>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Form Name</label>
                  <input 
                    type="text" 
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-primary focus:outline-none"
                    placeholder="Contact Form"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Form Type</label>
                  <select className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-primary focus:outline-none">
                    <option value="contact">Contact</option>
                    <option value="newsletter">Newsletter</option>
                    <option value="feedback">Feedback</option>
                    <option value="survey">Survey</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Form Fields</label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Name (required)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Email (required)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Message</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Phone Number</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button type="button" className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create Form</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}








