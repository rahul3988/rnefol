import React, { useEffect, useState } from 'react'
import { socketService } from '../../services/socket'

type Shipment = {
  id: number
  order_id: string
  shipment_id?: string
  awb_code?: string
  courier_name?: string
  tracking_url?: string
  status: string
  customer_name: string
  customer_email: string
  total: number
  order_status: string
  created_at: string
}

export default function Shipments() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const apiBase = (import.meta as any).env.VITE_API_URL || `http://${window.location.hostname}:4000`

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await fetch(`${apiBase}/api/shiprocket/shipments`)
      const data = await res.json()
      setShipments(data)
    } catch (e) {
      setError('Failed to load shipments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    load()
    
    // Subscribe to real-time shipment updates
    const unsubscribeShipmentCreated = socketService.subscribe('shipment_created', (newShipment: any) => {
      console.log('New shipment created:', newShipment)
      setShipments(prev => [newShipment, ...prev])
    })
    
    const unsubscribeShipmentUpdated = socketService.subscribe('shipment_updated', (updatedShipment: any) => {
      console.log('Shipment updated:', updatedShipment)
      setShipments(prev => prev.map(shipment => 
        shipment.id === updatedShipment.id ? updatedShipment : shipment
      ))
    })
    
    return () => {
      unsubscribeShipmentCreated()
      unsubscribeShipmentUpdated()
    }
  }, [])

  const createShiprocketShipment = async (orderId: string) => {
    try {
      const res = await fetch(`${apiBase}/api/shiprocket/create-shipment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId })
      })
      
      if (res.ok) {
        const data = await res.json()
        console.log('Shiprocket shipment created:', data)
        load() // Reload shipments
      } else {
        setError('Failed to create Shiprocket shipment')
      }
    } catch (e) {
      setError('Failed to create Shiprocket shipment')
    }
  }

  const updateShipmentStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`${apiBase}/api/shiprocket/shipments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status,
          awb_code: `AWB${Date.now()}`,
          courier_name: 'Shiprocket',
          tracking_url: `https://shiprocket.co/tracking/${id}`
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        console.log('Shipment status updated:', data)
        load() // Reload shipments
      } else {
        setError('Failed to update shipment status')
      }
    } catch (e) {
      setError('Failed to update shipment status')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'created': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Shipments</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage Shiprocket deliveries</p>
        </div>
        <button 
          onClick={load}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="text-slate-600 dark:text-slate-400">Loading shipments...</div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    AWB Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Courier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {shipments.map((shipment) => (
                  <tr key={shipment.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                      {shipment.order_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">{shipment.customer_name}</div>
                        <div className="text-slate-500 dark:text-slate-400">{shipment.customer_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                      ₹{Number(shipment.total).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(shipment.status)}`}>
                        {shipment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {shipment.awb_code || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {shipment.courier_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {shipment.status === 'pending' && (
                        <button
                          onClick={() => createShiprocketShipment(shipment.order_id)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Create Shipment
                        </button>
                      )}
                      {shipment.status === 'created' && (
                        <button
                          onClick={() => updateShipmentStatus(shipment.id, 'shipped')}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        >
                          Mark Shipped
                        </button>
                      )}
                      {shipment.status === 'shipped' && (
                        <button
                          onClick={() => updateShipmentStatus(shipment.id, 'delivered')}
                          className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                        >
                          Mark Delivered
                        </button>
                      )}
                      {shipment.tracking_url && (
                        <a
                          href={shipment.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          Track
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}


