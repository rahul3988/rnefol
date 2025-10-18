import React, { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { parseCSV, slugify } from '../../utils/csv'
import { uploadFile } from '../../utils/upload'


type Product = {
  id: number
  slug: string
  title: string
  category: string
  price: string
  list_image: string
  description: string
  details?: any
}

export default function Products() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button className="btn-primary">
          Add Product
        </button>
      </div>
      <ProductsManager />
    </div>
  )
}

function ProductsManager() {
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sortKey, setSortKey] = useState<'title' | 'price' | 'category'>('title')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [editing, setEditing] = useState<Partial<Product> & { id?: number } | null>(null)
  const [bulkRows, setBulkRows] = useState<Record<string, string>[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)
  const [selected, setSelected] = useState<Product | null>(null)
  const [pdpImages, setPdpImages] = useState<string[]>([])
  const [form, setForm] = useState<Partial<Product>>({
    slug: '', title: '', category: '', price: '', list_image: '', description: '',     details: {
      sku: '', hsn: '', mrp: '', websitePrice: '', discountPercent: '', brand: '', subtitle: '',
      skinHairType: '', netQuantity: '', unitCount: '', packageContent: '',
      innerPackaging: '', outerPackaging: '', netWeight: '', deadWeight: '',
      gstPercent: '', countryOfOrigin: '', manufacturer: '', keyIngredients: '',
      ingredientBenefits: '', howToUse: '', longDescription: '', bulletHighlights: '',
      imageLinks: '', videoLinks: '', platformCategoryMapping: '', hazardous: '', badges: ''
    }
  })
  const [formMainImage, setFormMainImage] = useState<File | null>(null)
  const [formPdpImages, setFormPdpImages] = useState<File[]>([])

  const apiBase = (import.meta as any).env.VITE_API_URL || `http://${window.location.hostname}:4000`
  const toAbs = (u?: string) => {
    if (!u) return ''
    if (/^https?:\/\//i.test(u)) return u
    const base = apiBase.replace(/\/$/, '')
    const path = u.startsWith('/') ? u : `/${u}`
    return `${base}${path}`
  }

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await fetch(`${apiBase}/api/products`)
      const data = await res.json()
      setItems(data)
    } catch (e) {
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let listImageUrl = form.list_image || ''
      if (formMainImage) {
        try {
          listImageUrl = await uploadFile(formMainImage, apiBase)
        } catch (_) {
          alert('Main image upload failed')
          return
        }
      }
      const res = await fetch(`${apiBase}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: form.slug,
          title: form.title,
          category: form.category,
          price: form.price,
          listImage: listImageUrl,
          description: form.description,
          details: form.details
        })
      })
      if (!res.ok) throw new Error('create failed')
      const created = await res.json()
      if (formPdpImages.length) {
        try {
          const uploaded: string[] = []
          for (const f of formPdpImages) {
            const url = await uploadFile(f, apiBase)
            uploaded.push(url)
          }
          await fetch(`${apiBase}/api/products/${created.id}/images`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ images: uploaded })
          })
        } catch (_) {
          // ignore PDP upload errors for now
        }
      }
      await load()
      setForm({ slug: '', title: '', category: '', price: '', list_image: '', description: '', details: { ...form.details, sku: '', hsn: '', mrp: '', websitePrice: '', discountPercent: '' } })
      setFormMainImage(null)
      setFormPdpImages([])
    } catch (e) {
      alert('Create failed')
    }
  }

  const remove = async (id: number) => {
    if (!confirm('Delete product?')) return
    try {
      const res = await fetch(`${apiBase}/api/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('delete failed')
      await load()
    } catch (e) {
      alert('Delete failed')
    }
  }

  const startEdit = (product: Product) => {
    setEditing({ 
      ...product, 
      details: product.details || {
        sku: '', hsn: '', mrp: '', websitePrice: '', discountPercent: '', brand: '', subtitle: '',
        skinHairType: '', netQuantity: '', unitCount: '', packageContent: '',
        innerPackaging: '', outerPackaging: '', netWeight: '', deadWeight: '',
        gstPercent: '', countryOfOrigin: '', manufacturer: '', keyIngredients: '',
        ingredientBenefits: '', howToUse: '', longDescription: '', bulletHighlights: '',
        imageLinks: '', videoLinks: '', platformCategoryMapping: '', hazardous: '', badges: ''
      }
    })
  }

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing || !editing.id) return
    if (!editing.title || !editing.slug) {
      alert('Slug and Title are required')
      return
    }
    try {
      const res = await fetch(`${apiBase}/api/products/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: editing.slug,
          title: editing.title,
          category: editing.category,
          price: editing.price,
          listImage: editing.list_image,
          description: editing.description,
          details: editing.details
        })
      })
      if (!res.ok) throw new Error('update failed')
      await load()
      setEditing(null)
    } catch (e) {
      alert('Update failed')
    }
  }

  const filtered = useMemo(() => {
    let next = items
    if (query) {
      const q = query.toLowerCase()
      next = next.filter(p => (
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.category||'').toLowerCase().includes(q)
      ))
    }
    if (categoryFilter) {
      next = next.filter(p => (p.category||'') === categoryFilter)
    }
    next = [...next].sort((a,b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const av = sortKey === 'price' ? Number(a.price) || 0 : (a as any)[sortKey] || ''
      const bv = sortKey === 'price' ? Number(b.price) || 0 : (b as any)[sortKey] || ''
      if (av < bv) return -1 * dir
      if (av > bv) return 1 * dir
      return 0
    })
    return next
  }, [items, query, categoryFilter, sortKey, sortDir])

  return (
    <div className="space-y-6">
      <div className="metric-card">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Bulk Import</h2>
        <div className="mb-3 rounded bg-blue-50 p-3 text-sm text-blue-800">
          <strong>Note:</strong> CSV import will only import text fields (title, category, price, description). Images need to be uploaded manually after import.
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={async (e)=>{
            const file = e.target.files?.[0]
            if (!file) return
            const buf = await file.arrayBuffer()
            if (file.name.endsWith('.csv')) {
              let text = new TextDecoder().decode(new Uint8Array(buf))
              // strip UTF-8 BOM if present
              if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1)
              setBulkRows(parseCSV(text))
            } else {
              const wb = XLSX.read(buf, { type: 'array' })
              const ws = wb.Sheets[wb.SheetNames[0]]
              const arr = XLSX.utils.sheet_to_json(ws) as Record<string, any>[]
              setBulkRows(arr)
            }
          }} />
          <button disabled={!bulkRows.length || bulkLoading} onClick={async()=>{
            setBulkLoading(true)
            try {
              const tryGet = (row: Record<string, any>, keys: string[]): string => {
                const entries = Object.entries(row)
                const found = keys.find(k => entries.some(([rk]) => rk.toLowerCase().replace(/\s+|_/g,'') === k))
                if (!found) return ''
                const matchKey = entries.find(([rk]) => rk.toLowerCase().replace(/\s+|_/g,'') === found)![0]
                const v = row[matchKey]
                if (v == null) return ''
                return String(v).trim()
              }
              let success = 0
              let failed = 0
              const errors: string[] = []
              for (let i = 0; i < bulkRows.length; i++) {
                const r = bulkRows[i]
                const title = tryGet(r, ['title','producttitle','name'])
                const slugVal = tryGet(r, ['slug']) || slugify(title)
                const category = tryGet(r, ['category','cat'])
                const priceRaw = tryGet(r, ['price','mrp','amount'])
                // Skip image import from CSV - will be uploaded manually later
                // const listImg = tryGet(r, ['listimage','image','mainimage','thumbnail'])
                const description = tryGet(r, ['description','desc'])
                const price = priceRaw ? String(priceRaw) : ''
                const payload = { slug: slugVal, title, category, price, listImage: '', description, details: {} }
                if (!payload.title || !payload.slug) { failed++; errors.push(`Row ${i+1}: missing title/slug`); continue }
                const res = await fetch(`${apiBase}/api/products`, {
                  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
                })
                if (res.ok) success++; else { failed++; errors.push(`Row ${i+1}: ${res.status}`) }
              }
              await load()
              setBulkRows([])
              alert(`Import complete. Success: ${success}, Failed: ${failed}${failed? `\n${errors.slice(0,5).join('\n')}${errors.length>5? '\n...':''}`:''}`)
            } catch (e) {
              alert('Import failed')
            } finally {
              setBulkLoading(false)
            }
          }} className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">{bulkLoading? 'Importing...' : `Import ${bulkRows.length||''}`}</button>
        </div>
        {!!bulkRows.length && (
          <div className="mt-4 max-h-64 overflow-auto rounded border border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 border-b border-white/10 bg-slate-900 text-white/70">
                <tr>
                  <th className="py-2 pr-3">title</th>
                  <th className="py-2 pr-3">slug</th>
                  <th className="py-2 pr-3">category</th>
                  <th className="py-2 pr-3">price</th>
                  <th className="py-2 pr-3">description</th>
                </tr>
              </thead>
              <tbody>
                {bulkRows.slice(0,50).map((r,idx)=> (
                  <tr key={idx} className="border-b border-white/5">
                    <td className="py-1 pr-3">{r.title}</td>
                    <td className="py-1 pr-3">{r.slug || slugify(r.title||'')}</td>
                    <td className="py-1 pr-3">{r.category}</td>
                    <td className="py-1 pr-3">{r.price}</td>
                    <td className="py-1 pr-3">{r.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bulkRows.length>50 && <div className="p-2 text-center text-xs text-white/60">Showing first 50 of {bulkRows.length}</div>}
          </div>
        )}
      </div>
      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 text-lg font-semibold">Add Product</h2>
        <form onSubmit={submit} className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input className="rounded bg-white/10 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Slug" value={form.slug||''} onChange={e=>setForm(prev=>({...prev, slug:e.target.value}))} required />
          <input className="rounded bg-white/10 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Title" value={form.title||''} onChange={e=>setForm(prev=>({...prev, title:e.target.value}))} required />
          <select 
            className="rounded bg-white/10 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
            value={form.category||''} 
            onChange={e=>setForm(prev=>({...prev, category:e.target.value}))}
            required
          >
            <option value="">Select Category</option>
            <option value="Face Care">Face Care</option>
            <option value="Hair Care">Hair Care</option>
            <option value="Body Care">Body Care</option>
            <option value="Combo">Combo</option>
          </select>
              <input className="rounded bg-white/10 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Price (display)" value={form.price||''} onChange={e=>setForm(prev=>({...prev, price:e.target.value}))} />
              <input className="rounded bg-white/10 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="SKU" value={form.details?.sku||''} onChange={e=>setForm(prev=>({...prev, details: { ...(prev.details||{}), sku:e.target.value }}))} />
              <input className="rounded bg-white/10 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="HSN Code" value={form.details?.hsn||''} onChange={e=>setForm(prev=>({...prev, details: { ...(prev.details||{}), hsn:e.target.value }}))} />
              <input className="rounded bg-white/10 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="MRP" value={form.details?.mrp||''} onChange={e=>{
                const mrp = e.target.value;
                const discountPercent = form.details?.discountPercent;
                if (mrp && discountPercent) {
                  const discountedPrice = parseFloat(mrp) - (parseFloat(mrp) * parseFloat(discountPercent) / 100);
                  setForm(prev=>({...prev, details: { 
                    ...(prev.details||{}), 
                    mrp: mrp,
                    websitePrice: discountedPrice.toFixed(2)
                  }}));
                } else {
                  setForm(prev=>({...prev, details: { ...(prev.details||{}), mrp: mrp }}));
                }
              }} />
              <input className="rounded bg-white/10 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Discount %" type="number" min="0" max="100" value={form.details?.discountPercent||''} onChange={e=>{
                const discountPercent = e.target.value;
                const mrp = form.details?.mrp;
                if (discountPercent && mrp) {
                  const discountedPrice = parseFloat(mrp) - (parseFloat(mrp) * parseFloat(discountPercent) / 100);
                  setForm(prev=>({...prev, details: { 
                    ...(prev.details||{}), 
                    discountPercent: discountPercent,
                    websitePrice: discountedPrice.toFixed(2)
                  }}));
                } else {
                  setForm(prev=>({...prev, details: { ...(prev.details||{}), discountPercent: discountPercent }}));
                }
              }} />
              <input className="rounded bg-white/10 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Website Price (Discounted)" value={form.details?.websitePrice||''} onChange={e=>{
                const discountedPrice = e.target.value;
                const mrp = form.details?.mrp;
                if (discountedPrice && mrp) {
                  const discountPercent = ((parseFloat(mrp) - parseFloat(discountedPrice)) / parseFloat(mrp) * 100).toFixed(1);
                  setForm(prev=>({...prev, details: { 
                    ...(prev.details||{}), 
                    websitePrice: discountedPrice,
                    discountPercent: discountPercent
                  }}));
                } else {
                  setForm(prev=>({...prev, details: { ...(prev.details||{}), websitePrice: discountedPrice }}));
                }
              }} />
          <div className="md:col-span-2">
            <div className="mb-1 text-xs text-white/70">Main Image (upload or fallback URL)</div>
            <div className="flex items-center gap-2">
              <input type="file" accept="image/*" onChange={e=>setFormMainImage(e.target.files?.[0]||null)} className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              <span className="text-xs text-white/50">or</span>
              <input className="flex-1 rounded bg-white/10 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="List Image URL (optional)" value={form.list_image||''} onChange={e=>setForm(prev=>({...prev, list_image:e.target.value}))} />
            </div>
            <div className="mt-2 text-xs text-white/50">Add additional video in PDP Media below.</div>
          </div>
          <input className="rounded bg-white/10 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 md:col-span-3" placeholder="Description" value={form.description||''} onChange={e=>setForm(prev=>({...prev, description:e.target.value}))} />
          <textarea className="rounded bg-white/10 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 md:col-span-3" placeholder="How to Use" value={form.details?.howToUse||''} onChange={e=>setForm(prev=>({...prev, details: { ...(prev.details||{}), howToUse:e.target.value }}))} />
          <textarea className="rounded bg-white/10 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 md:col-span-3" placeholder="Key Ingredients" value={form.details?.keyIngredients||''} onChange={e=>setForm(prev=>({...prev, details: { ...(prev.details||{}), keyIngredients:e.target.value }}))} />
          <textarea className="rounded bg-white/10 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 md:col-span-3" placeholder="Ingredient Benefits" value={form.details?.ingredientBenefits||''} onChange={e=>setForm(prev=>({...prev, details: { ...(prev.details||{}), ingredientBenefits:e.target.value }}))} />
          <textarea className="rounded bg-white/10 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 md:col-span-3" placeholder="Bullet Highlights" value={form.details?.bulletHighlights||''} onChange={e=>setForm(prev=>({...prev, details: { ...(prev.details||{}), bulletHighlights:e.target.value }}))} />
          <div className="md:col-span-3">
            <div className="mb-1 text-xs text-white/70">PDP Media (images or 1 video)</div>
            <input multiple type="file" accept="image/*,video/*" onChange={e=>setFormPdpImages(Array.from(e.target.files||[]))} className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            <div className="mt-2 text-xs text-white/50">Tip: Upload up to 7 images and 1 short video (mp4/webm).</div>
          </div>
          <div className="md:col-span-3">
            <button className="rounded bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-700">Save</button>
          </div>
        </form>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold">Products</h2>
          <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center md:justify-end">
            <input className="rounded bg-white/10 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Search..." value={query} onChange={e=>setQuery(e.target.value)} />
            <select className="rounded bg-white/10 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}>
              <option value="">All categories</option>
              <option value="Face Care">Face Care</option>
              <option value="Hair Care">Hair Care</option>
              <option value="Body Care">Body Care</option>
              <option value="Combo">Combo</option>
            </select>
            <div className="flex items-center gap-2">
              <select className="rounded bg-white/10 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={sortKey} onChange={e=>setSortKey(e.target.value as any)}>
                <option value="title">Title</option>
                <option value="price">Price</option>
                <option value="category">Category</option>
              </select>
              <button className="rounded bg-white/10 px-3 py-2 text-sm hover:bg-white/15" onClick={()=>setSortDir(d=>d==='asc'?'desc':'asc')}>{sortDir==='asc'?'Asc':'Desc'}</button>
            </div>
              <button onClick={load} className="rounded bg-white/10 px-3 py-2 text-sm hover:bg-white/15">Refresh</button>
              <form onSubmit={async (e)=>{e.preventDefault(); const input=(e.currentTarget.elements.namedItem('csv') as HTMLInputElement); const file=input.files?.[0]; if(!file) return; const fd=new FormData(); fd.append('file', file); const r=await fetch(`${apiBase}/api/products-csv/upload`,{method:'POST', body: fd}); if(r.ok){alert('CSV uploaded');} else {alert('CSV upload failed')}}} className="flex items-center gap-2">
                <input name="csv" type="file" accept=".csv" className="rounded border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                <button className="rounded bg-white/10 px-3 py-2 text-sm hover:bg-white/15">Upload CSV</button>
              </form>
          </div>
        </div>
        {loading ? <p>Loading...</p> : error ? <p className="text-red-400">{error}</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase text-white/70">
                <tr>
                  <th className="py-2 pr-4">ID</th>
                  <th className="py-2 pr-4">Slug</th>
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Price</th>
                  <th className="py-2 pr-4">Image</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-white/5">
                    <td className="py-2 pr-4">{p.id}</td>
                    <td className="py-2 pr-4">{p.slug}</td>
                    <td className="py-2 pr-4">{p.title}</td>
                    <td className="py-2 pr-4">{p.category}</td>
                    <td className="py-2 pr-4">
                      <div className="text-sm">
                        {p.details?.mrp && p.details?.websitePrice ? (
                          <div>
                            <div className="text-gray-500 line-through text-xs">₹{p.details.mrp}</div>
                            <div className="font-semibold text-green-600">₹{p.details.websitePrice}</div>
                            <div className="text-xs text-green-500">
                              {((parseFloat(p.details.mrp) - parseFloat(p.details.websitePrice)) / parseFloat(p.details.mrp) * 100).toFixed(0)}% OFF
                            </div>
                          </div>
                        ) : (
                          <div className="font-semibold">₹{p.price}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-2 pr-4">
                      {p.list_image ? <img src={toAbs(p.list_image)} className="h-10 w-10 rounded object-cover" /> : <span className="opacity-50">—</span>}
                    </td>
                    <td className="py-2 pr-4">
                      <div className="flex gap-2">
                        <button onClick={()=>{setSelected(p); setPdpImages([])}} className="rounded bg-white/10 px-3 py-1 text-xs hover:bg-white/15">Images</button>
                        <button onClick={()=>startEdit(p)} className="rounded bg-white/10 px-3 py-1 text-xs hover:bg-white/15">Edit</button>
                        <button onClick={()=>remove(p.id)} className="rounded bg-red-600 px-3 py-1 text-xs hover:bg-red-700">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-2xl rounded-lg border border-gray-300 bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Manage Images — {selected.title}</h3>
                <button onClick={()=>setSelected(null)} className="rounded bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300">Close</button>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="mb-2 text-sm text-gray-700">Main image</div>
                  <div className="flex items-center gap-3">
                    {selected.list_image ? <img src={toAbs(selected.list_image)} className="h-16 w-16 rounded object-cover" /> : <div className="h-16 w-16 rounded border border-gray-300 bg-gray-50" />}
                    <input type="file" accept="image/*" className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" onChange={async e=>{
                      const file = e.target.files?.[0]
                      if (!file) return
                      try {
                        const url = await uploadFile(file, apiBase)
                        const res = await fetch(`${apiBase}/api/products/${selected.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ listImage: url })
                        })
                        if (!res.ok) {
                          const txt = await res.text().catch(()=> '')
                          throw new Error(txt || 'Update failed')
                        }
                        // optimistic: update table state and selected modal
                        setItems(prev => prev.map(p => p.id === selected.id ? { ...p, list_image: url } : p))
                        setSelected(prev => prev ? { ...prev, list_image: url } as Product : prev)
                        // also refresh from server to ensure DB persisted
                        await load()
                      } catch (_) {
                        alert('Upload failed')
                      }
                    }} />
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-sm text-gray-700">PDP images</div>
                  <div className="flex flex-wrap gap-2">
                    {pdpImages.map((u,idx)=>{
                      const abs = toAbs(u)
                      const isVid = /\.(mp4|webm|ogg)(\?|$)/i.test(abs)
                      return isVid ? (
                        <video key={idx} src={abs} className="h-16 w-16 rounded object-cover" />
                      ) : (
                        <img key={idx} src={abs} className="h-16 w-16 rounded object-cover" />
                      )
                    })}
                  </div>
                  <div className="mt-2">
                    <input multiple type="file" accept="image/*,video/*" className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" onChange={async e=>{
                      const files = Array.from(e.target.files || [])
                      if (!files.length) return
                      try {
                        const uploaded: string[] = []
                        for (const f of files) {
                          const url = await uploadFile(f, apiBase)
                          uploaded.push(url)
                        }
                        setPdpImages(prev => [...prev, ...uploaded])
                        await fetch(`${apiBase}/api/products/${selected.id}/images`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ images: uploaded })
                        })
                      } catch (_) {
                        alert('Upload failed')
                      }
                    }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-2xl rounded-lg border border-gray-300 bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Edit Product</h3>
                <button onClick={()=>setEditing(null)} className="rounded bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300">Close</button>
              </div>
              <form onSubmit={saveEdit} className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <input className="rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Slug" value={editing.slug||''} onChange={e=>setEditing(prev=>({...(prev as any), slug:e.target.value}))} required />
                <input className="rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Title" value={editing.title||''} onChange={e=>setEditing(prev=>({...(prev as any), title:e.target.value}))} required />
                <select 
                  className="rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                  value={editing.category||''} 
                  onChange={e=>setEditing(prev=>({...(prev as any), category:e.target.value}))}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Face Care">Face Care</option>
                  <option value="Hair Care">Hair Care</option>
                  <option value="Body Care">Body Care</option>
                  <option value="Combo">Combo</option>
                </select>
                <input className="rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Price" value={editing.price||''} onChange={e=>setEditing(prev=>({...(prev as any), price:e.target.value}))} />
                
                {/* Discounted Price Section */}
                <div className="md:col-span-2 space-y-2">
                  <div className="text-sm font-medium text-gray-700">Pricing Details</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">MRP (₹)</label>
                      <input 
                        className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                        placeholder="MRP" 
                        type="number"
                        value={editing.details?.mrp||''} 
                        onChange={e=>{
                          const mrp = e.target.value;
                          const discountPercent = editing.details?.discountPercent;
                          if (mrp && discountPercent) {
                            const discountedPrice = parseFloat(mrp) - (parseFloat(mrp) * parseFloat(discountPercent) / 100);
                            setEditing(prev=>({...(prev as any), details: { 
                              ...(prev.details||{}), 
                              mrp: mrp,
                              websitePrice: discountedPrice.toFixed(2)
                            }}));
                          } else {
                            setEditing(prev=>({...(prev as any), details: { ...(prev.details||{}), mrp: mrp }}));
                          }
                        }} 
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Discount %</label>
                      <input 
                        className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                        placeholder="Discount %" 
                        type="number"
                        min="0"
                        max="100"
                        value={editing.details?.discountPercent||''} 
                        onChange={e=>{
                          const discountPercent = e.target.value;
                          const mrp = editing.details?.mrp;
                          if (discountPercent && mrp) {
                            const discountedPrice = parseFloat(mrp) - (parseFloat(mrp) * parseFloat(discountPercent) / 100);
                            setEditing(prev=>({...(prev as any), details: { 
                              ...(prev.details||{}), 
                              discountPercent: discountPercent,
                              websitePrice: discountedPrice.toFixed(2)
                            }}));
                          } else {
                            setEditing(prev=>({...(prev as any), details: { 
                              ...(prev.details||{}), 
                              discountPercent: discountPercent
                            }}));
                          }
                        }} 
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Discounted Price (₹)</label>
                      <input 
                        className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                        placeholder="Discounted Price" 
                        type="number"
                        value={editing.details?.websitePrice||''} 
                        onChange={e=>{
                          const discountedPrice = e.target.value;
                          const mrp = editing.details?.mrp;
                          if (discountedPrice && mrp) {
                            const discountPercent = ((parseFloat(mrp) - parseFloat(discountedPrice)) / parseFloat(mrp) * 100).toFixed(1);
                            setEditing(prev=>({...(prev as any), details: { 
                              ...(prev.details||{}), 
                              websitePrice: discountedPrice,
                              discountPercent: discountPercent
                            }}));
                          } else {
                            setEditing(prev=>({...(prev as any), details: { 
                              ...(prev.details||{}), 
                              websitePrice: discountedPrice
                            }}));
                          }
                        }} 
                      />
                    </div>
                  </div>
                  
                  {/* Real-time Discount Display */}
                  {editing.details?.mrp && editing.details?.websitePrice && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-gray-600">Discount Amount</div>
                          <div className="text-lg font-semibold text-green-600">
                            ₹{(parseFloat(editing.details.mrp) - parseFloat(editing.details.websitePrice)).toFixed(2)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Discount %</div>
                          <div className="text-lg font-semibold text-green-600">
                            {((parseFloat(editing.details.mrp) - parseFloat(editing.details.websitePrice)) / parseFloat(editing.details.mrp) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        MRP: ₹{editing.details.mrp} → Sale Price: ₹{editing.details.websitePrice}
                      </div>
                    </div>
                  )}
                </div>
                
                <input className="rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="List Image URL" value={editing.list_image||''} onChange={e=>setEditing(prev=>({...(prev as any), list_image:e.target.value}))} />
                <input className="rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 md:col-span-3" placeholder="Description" value={editing.description||''} onChange={e=>setEditing(prev=>({...(prev as any), description:e.target.value}))} />
                <div className="md:col-span-3">
                  <button className="rounded bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-700">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
