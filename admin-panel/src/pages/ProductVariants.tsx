import React, { useState, useEffect } from 'react'

interface VariantOption {
  name: string
  values: string[]
}

interface Variant {
  id: number
  sku: string
  attributes: Record<string, string>
  price?: string
  mrp?: string
  image_url?: string
  is_active: boolean
}

export default function ProductVariants() {
  const [options, setOptions] = useState<VariantOption[]>([])
  const [variants, setVariants] = useState<Variant[]>([])
  const [productId, setProductId] = useState<string>('')
  const [newOption, setNewOption] = useState({ name: '', values: '' })

  const handleAddOption = () => {
    if (newOption.name && newOption.values) {
      setOptions([...options, {
        name: newOption.name,
        values: newOption.values.split(',').map(v => v.trim())
      }])
      setNewOption({ name: '', values: '' })
    }
  }

  const saveOptions = async () => {
    const resp = await fetch(`/api/products/${productId}/variant-options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ options })
    })
    const data = await resp.json()
    console.log('Options saved:', data)
  }

  const generateVariants = async () => {
    const resp = await fetch(`/api/products/${productId}/variants/generate`, { method: 'POST' })
    const data = await resp.json()
    if (data.success) {
      setVariants(data.data)
      alert(`Generated ${data.data.length} variants`)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Product Variants</h1>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Product ID</label>
        <input
          type="text"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="border p-2 rounded"
          placeholder="Enter product ID"
        />
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Variant Options</h2>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Option name (e.g., Size)"
            value={newOption.name}
            onChange={(e) => setNewOption({ ...newOption, name: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Values (comma-separated, e.g., S, M, L)"
            value={newOption.values}
            onChange={(e) => setNewOption({ ...newOption, values: e.target.value })}
            className="border p-2 rounded"
          />
          <button onClick={handleAddOption} className="px-4 py-2 bg-blue-500 text-white rounded">
            Add Option
          </button>
        </div>
        <button onClick={saveOptions} className="px-4 py-2 bg-green-500 text-white rounded">
          Save Options
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Generated Variants</h2>
        <button onClick={generateVariants} className="px-4 py-2 bg-purple-500 text-white rounded mb-4">
          Generate Variants
        </button>
        <div className="space-y-2">
          {variants.map(v => (
            <div key={v.id} className="border p-3 rounded">
              <p><strong>SKU:</strong> {v.sku}</p>
              <p><strong>Attributes:</strong> {JSON.stringify(v.attributes)}</p>
              <p><strong>Price:</strong> {v.price || 'N/A'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

