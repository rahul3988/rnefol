import { useEffect, useState } from 'react'
import type { Product } from '../types'
import { getApiBase } from '../utils/apiBase'

export function useProducts() {
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const apiBase = getApiBase()
        const res = await fetch(`${apiBase}/api/products`, { credentials: 'include' })
        if (!res.ok) throw new Error('Failed to load products')
        const rows = await res.json()
        const toAbs = (u?: string) => {
          if (!u || typeof u !== 'string') return ''
          if (/^https?:\/\//i.test(u)) return u
          const base = apiBase.replace(/\/$/, '')
          const path = u.startsWith('/') ? u : `/${u}`
          return `${base}${path}`
        }
        const mapped: Product[] = (rows || []).map((r: any) => {
          const listImage = toAbs(r.list_image || '')
          const pdpImages = derivePdpImages(r, toAbs)
          return {
            slug: r.slug,
            title: r.title,
            category: r.category,
            price: r.price,
            listImage,
            pdpImages,
            description: r.description || '',
            details: r.details || {}
          }
        }).filter((p: Product) => p.slug && p.title)
        if (!cancelled) setItems(mapped)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load products')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  return { items, loading, error }
}

function derivePdpImages(row: any, toAbs: (u?: string)=>string): string[] {
  if (row.pdp_images && Array.isArray(row.pdp_images) && row.pdp_images.length) return row.pdp_images.map((u: string) => toAbs(u))
  if (row.list_image) return [toAbs(row.list_image)]
  return []
}


