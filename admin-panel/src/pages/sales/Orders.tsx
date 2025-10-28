import React, { useEffect, useState } from 'react'
import { socketService } from '../../services/socket'

type Order = {
  id: number
  customer: string
  total: number
  status: 'pending' | 'paid' | 'shipped' | 'cancelled'
  createdAt: string
}

export default function Orders() {
  const [items, setItems] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const apiBase = (import.meta as any).env.VITE_API_URL || `http://192.168.1.66:4000`

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await fetch(`${apiBase}/api/orders`)
      const data = await res.json()
      setItems(data)
    } catch (e) {
      setError('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    load()
    
    // Subscribe to real-time order updates
    const unsubscribeOrderCreated = socketService.subscribe('order_created', (newOrder: any) => {
      console.log('New order received:', newOrder)
      setItems(prev => [newOrder, ...prev])
    })
    
    const unsubscribeOrderUpdated = socketService.subscribe('order_updated', (updatedOrder: any) => {
      console.log('Order updated:', updatedOrder)
      setItems(prev => prev.map(order => 
        order.id === updatedOrder.id ? updatedOrder : order
      ))
    })
    
    return () => {
      unsubscribeOrderCreated()
      unsubscribeOrderUpdated()
    }
  }, [])

  const updateStatus = async (id: number, status: Order['status']) => {
    try {
      const res = await fetch(`${apiBase}/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Status update failed')
      }
      
      await load()
    } catch (e: any) {
      console.error('Update failed:', e)
      alert(`Update failed: ${e.message}`)
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <button onClick={load} className="btn-secondary">
            Refresh
          </button>
        </div>
        
        <div className="metric-card">
          {loading ? <p>Loading...</p> : error ? <p className="text-red-600">{error}</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="py-3 pr-4">ID</th>
                    <th className="py-3 pr-4">Customer</th>
                    <th className="py-3 pr-4">Total</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Placed</th>
                    <th className="py-3 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(o => (
                    <tr key={o.id} className="border-b border-gray-100">
                      <td className="py-3 pr-4 font-medium">{o.id}</td>
                      <td className="py-3 pr-4">{o.customer}</td>
                      <td className="py-3 pr-4 font-semibold">₹{Number(o.total).toFixed(2)}</td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          o.status === 'paid' ? 'bg-green-100 text-green-800' :
                          o.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          o.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{new Date(o.createdAt).toLocaleString()}</td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-2">
                          <button onClick={()=>updateStatus(o.id,'paid')} className="btn-secondary text-xs px-2 py-1">Mark Paid</button>
                          <button onClick={()=>updateStatus(o.id,'shipped')} className="btn-secondary text-xs px-2 py-1">Mark Shipped</button>
                          <button onClick={()=>updateStatus(o.id,'cancelled')} className="bg-red-600 text-white px-2 py-1 text-xs rounded hover:bg-red-700">Cancel</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}