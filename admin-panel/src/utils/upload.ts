export async function uploadFile(file: File, apiBase: string): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${apiBase}/api/upload`, { method: 'POST', body: form })
  if (!res.ok) throw new Error('upload failed')
  const data = await res.json()
  // expect { url: string }
  const url: string = data.url
  if (!url) throw new Error('upload failed')
  // normalize to absolute URL for consistent previews across origins
  if (/^https?:\/\//i.test(url)) return url
  const base = apiBase.replace(/\/$/, '')
  const path = url.startsWith('/') ? url : `/${url}`
  return `${base}${path}`
}


