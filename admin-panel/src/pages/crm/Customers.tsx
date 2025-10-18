import React from 'react'

export default function Customers() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <button className="btn-primary">
          Add Customer
        </button>
      </div>
      
      <div className="metric-card">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Customer Management</h2>
        <p className="text-gray-600">Customer management features coming soon. This will include customer profiles, order history, and communication tools.</p>
      </div>
    </div>
  )
}


