import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useToast } from '../../components/ToastProvider'

type OrderItem = {
  product_id?: number
  title?: string
  sku?: string
  qty?: number
  price?: number
}

type Order = {
  id: number
  order_number: string
  customer_name: string
  customer_email: string
  shipping_address: any
  items: OrderItem[]
  subtotal: number
  shipping: number
  tax: number
  total: number
  status: string
  created_at: string
  history?: Array<{ id: number; old_status: string | null; new_status: string; note?: string | null; created_at: string }>
}

export default function OrderDetails() {
  const { orderNumber } = useParams()
  const navigate = useNavigate()
  const { notify } = useToast()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [note, setNote] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [splitIndexes, setSplitIndexes] = useState<string>('')
  const apiBase = (import.meta as any).env.VITE_API_URL || `http://192.168.1.66:4000`

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem('auth_token')
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'x-user-permissions': 'orders:read,orders:update,shipping:read',
      'x-user-role': 'admin'
    } as Record<string, string>
  }, [])

  const load = async () => {
    if (!orderNumber) return
    try {
      setLoading(true)
      setError('')
      const res = await fetch(`${apiBase}/api/orders/${encodeURIComponent(orderNumber)}`, { headers: authHeaders })
      if (!res.ok) throw new Error('Failed to fetch order')
      const data = await res.json()
      setOrder(data)
      setNewStatus(data.status)
    } catch (e: any) {
      setError(e?.message || 'Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [orderNumber])

  const updateStatus = async () => {
    if (!order) return
    try {
      setLoading(true)
      const res = await fetch(`${apiBase}/api/orders/${order.id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ status: newStatus, note })
      })
      if (!res.ok) throw new Error('Failed to update status')
      await load()
      setNote('')
      notify('success','Order status updated')
    } catch (e: any) {
      notify('error', e?.message || 'Failed to update')
    } finally {
      setLoading(false)
    }
  }

  const updateTags = async () => {
    if (!order) return
    const tags = tagsInput.split(',').map(s=>s.trim()).filter(Boolean)
    const res = await fetch(`${apiBase}/api/orders/${order.id}/tags`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ tags })
    })
    if (!res.ok) { notify('error','Failed to update tags'); return }
    await load()
    notify('success','Tags updated')
  }

  const createAwb = async () => {
    if (!order) return
    try {
      const res = await fetch(`${apiBase}/api/shiprocket/orders/${order.id}/awb`, {
        method: 'POST',
        headers: authHeaders,
      })
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Failed to create AWB')
      notify('success','AWB created')
    } catch (e: any) {
      notify('error', e?.message || 'Failed to create AWB')
    }
  }

  const viewTracking = async () => {
    if (!order) return
    try {
      const res = await fetch(`${apiBase}/api/shiprocket/orders/${order.id}/track`, { headers: authHeaders })
      const data = await res.json()
      if (!res.ok || !data) throw new Error('Failed to fetch tracking')
      notify('info','Tracking fetched (see console)')
      console.log('Tracking:', data)
    } catch (e: any) {
      notify('error', e?.message || 'Failed to fetch tracking')
    }
  }

  const splitOrder = async () => {
    if (!order) return
    const indexes = splitIndexes.split(',').map(s=>parseInt(s.trim(),10)).filter(n=>!isNaN(n))
    if (indexes.length===0) return alert('Provide item indexes like 0,2')
    const res = await fetch(`${apiBase}/api/orders/${order.id}/split`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ itemIndexes: indexes })
    })
    if (!res.ok) { notify('error','Failed to split order'); return }
    const data = await res.json()
    notify('success', `Split created: ${data.split?.order_number || data.split?.id}`)
    await load()
  }

  if (loading && !order) return <div className="p-6">Loading...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (!order) return <div className="p-6">Not found</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order #{order.order_number}</h1>
          <p className="text-gray-600">Placed on {new Date(order.created_at).toLocaleString()}</p>
        </div>
        <button onClick={() => navigate(-1)} className="btn-secondary">Back</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="metric-card md:col-span-2">
          <h2 className="font-semibold mb-3">Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-gray-500 border-b">
                <tr>
                  <th className="py-2 pr-4">Product</th>
                  <th className="py-2 pr-4">SKU</th>
                  <th className="py-2 pr-4">Qty</th>
                  <th className="py-2 pr-4">Price</th>
                  <th className="py-2 pr-4">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((it, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2 pr-4">{it.title || it.product_id}</td>
                    <td className="py-2 pr-4">{it.sku || '-'}</td>
                    <td className="py-2 pr-4">{it.qty || 1}</td>
                    <td className="py-2 pr-4">₹{Number(it.price || 0).toFixed(2)}</td>
                    <td className="py-2 pr-4 font-medium">₹{Number((it.qty || 1) * (it.price || 0)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="metric-card">
          <h2 className="font-semibold mb-3">Summary</h2>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>₹{Number(order.subtotal||0).toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>₹{Number(order.shipping||0).toFixed(2)}</span></div>
            <div className="flex justify-between"><span>GST</span><span>₹{Number(order.tax||0).toFixed(2)}</span></div>
            <div className="flex justify-between font-semibold"><span>Total</span><span>₹{Number(order.total||0).toFixed(2)}</span></div>
          </div>
          <div className="mt-4 space-y-2">
            <label className="block text-sm font-medium">Status</label>
            <select value={newStatus} onChange={e=>setNewStatus(e.target.value)} className="input w-full">
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="shipped">Shipped</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input className="input w-full" placeholder="Add note (optional)" value={note} onChange={e=>setNote(e.target.value)} />
            <button onClick={updateStatus} className="btn-primary w-full">Update Status</button>
            <div className="pt-4 border-t mt-4">
              <label className="block text-sm font-medium">Tags (comma-separated)</label>
              <input className="input w-full" placeholder="e.g. priority,vip" value={tagsInput} onChange={e=>setTagsInput(e.target.value)} />
              <button onClick={updateTags} className="btn-secondary w-full mt-2">Update Tags</button>
            </div>
            <div className="pt-4 border-t mt-4">
              <label className="block text-sm font-medium">Split Items (indexes)</label>
              <input className="input w-full" placeholder="e.g. 0,2" value={splitIndexes} onChange={e=>setSplitIndexes(e.target.value)} />
              <button onClick={splitOrder} className="btn-secondary w-full mt-2">Split Order</button>
            </div>
            <div className="pt-4 border-t mt-4">
              <label className="block text-sm font-medium">Shipping</label>
              <div className="flex gap-2">
                <button onClick={createAwb} className="btn-secondary w-full">Create AWB</button>
                <button onClick={viewTracking} className="btn-secondary w-full">View Tracking</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="metric-card">
        <h2 className="font-semibold mb-3">Timeline</h2>
        <div className="space-y-3">
          {(order.history || []).length === 0 ? (
            <p className="text-sm text-gray-600">No history.</p>
          ) : (
            (order.history || []).map(h => (
              <div key={h.id} className="text-sm">
                <span className="font-medium">{h.new_status}</span>
                {h.old_status ? <span className="text-gray-500"> (from {h.old_status})</span> : null}
                {h.note ? <span className="text-gray-600"> — {h.note}</span> : null}
                <div className="text-xs text-gray-500">{new Date(h.created_at).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}


