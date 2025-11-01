import React, { useEffect, useState } from 'react'

export default function AlertSettings() {
  const [cfg, setCfg] = useState<any>({ whatsapp_token: '', whatsapp_phone_id: '', notify_phone: '', smtp_provider: 'gmail', smtp_host: '', smtp_port: 587, smtp_user: '', smtp_pass: '', notify_email: '', from_email: '' })
  const [testPhone, setTestPhone] = useState('')
  const [testMsg, setTestMsg] = useState('Hello from Nefol Admin!')
  const [testTo, setTestTo] = useState('')
  const [testSubject, setTestSubject] = useState('Test Email from Nefol')
  const [testBody, setTestBody] = useState('This is a test email.')

  const load = async () => {
    try {
      const res = await fetch('/api/alerts/config')
      const data = await res.json()
      if (data?.data) setCfg({ ...cfg, ...data.data })
    } catch {}
  }
  useEffect(()=>{ load() }, [])

  const save = async () => {
    const res = await fetch('/api/alerts/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cfg) })
    const data = await res.json()
    if (!res.ok) return alert(data?.error || 'Failed to save')
    alert('Saved')
  }

  const testWhatsApp = async () => {
    const res = await fetch('/api/alerts/test/whatsapp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone_number: testPhone, message: testMsg }) })
    const data = await res.json()
    if (!res.ok) return alert(data?.error || 'Failed')
    alert('WhatsApp message queued')
  }

  const testEmail = async () => {
    const res = await fetch('/api/alerts/test/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: testTo, subject: testSubject, text: testBody }) })
    const data = await res.json()
    if (!res.ok) return alert(data?.error || 'Failed')
    alert('Email sent')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Alert Settings (WhatsApp + SMTP)</h1>
      <div className="metric-card">
        <h2 className="font-semibold mb-3">WhatsApp (Meta Cloud API)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className="input" placeholder="WhatsApp Phone ID" value={cfg.whatsapp_phone_id||''} onChange={e=>setCfg({ ...cfg, whatsapp_phone_id: e.target.value })} />
          <input className="input" placeholder="Access Token" value={cfg.whatsapp_token||''} onChange={e=>setCfg({ ...cfg, whatsapp_token: e.target.value })} />
          <input className="input" placeholder="Default Notify Phone (with country code)" value={cfg.notify_phone||''} onChange={e=>setCfg({ ...cfg, notify_phone: e.target.value })} />
        </div>
      </div>
      <div className="metric-card">
        <h2 className="font-semibold mb-3">SMTP</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select className="input" value={cfg.smtp_provider||'gmail'} onChange={e=>setCfg({ ...cfg, smtp_provider: e.target.value })}>
            <option value="gmail">Gmail</option>
            <option value="hostinger">Hostinger</option>
            <option value="godaddy">GoDaddy</option>
            <option value="custom">Custom</option>
          </select>
          <input className="input" placeholder="SMTP Host" value={cfg.smtp_host||''} onChange={e=>setCfg({ ...cfg, smtp_host: e.target.value })} />
          <input className="input" placeholder="SMTP Port" type="number" value={cfg.smtp_port||587} onChange={e=>setCfg({ ...cfg, smtp_port: Number(e.target.value) })} />
          <input className="input" placeholder="SMTP User" value={cfg.smtp_user||''} onChange={e=>setCfg({ ...cfg, smtp_user: e.target.value })} />
          <input className="input" placeholder="SMTP Pass" type="password" value={cfg.smtp_pass||''} onChange={e=>setCfg({ ...cfg, smtp_pass: e.target.value })} />
          <input className="input" placeholder="From Email" value={cfg.from_email||''} onChange={e=>setCfg({ ...cfg, from_email: e.target.value })} />
          <input className="input" placeholder="Default Notify Email" value={cfg.notify_email||''} onChange={e=>setCfg({ ...cfg, notify_email: e.target.value })} />
        </div>
      </div>
      <div className="flex gap-2">
        <button className="btn-primary" onClick={save}>Save Settings</button>
      </div>

      <div className="metric-card">
        <h2 className="font-semibold mb-3">Test WhatsApp</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="input" placeholder="Phone with country code" value={testPhone} onChange={e=>setTestPhone(e.target.value)} />
          <input className="input" placeholder="Message" value={testMsg} onChange={e=>setTestMsg(e.target.value)} />
          <button className="btn-secondary" onClick={testWhatsApp}>Send Test</button>
        </div>
      </div>

      <div className="metric-card">
        <h2 className="font-semibold mb-3">Test Email</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="input" placeholder="To" value={testTo} onChange={e=>setTestTo(e.target.value)} />
          <input className="input" placeholder="Subject" value={testSubject} onChange={e=>setTestSubject(e.target.value)} />
          <input className="input" placeholder="Body" value={testBody} onChange={e=>setTestBody(e.target.value)} />
          <button className="btn-secondary" onClick={testEmail}>Send Test</button>
        </div>
      </div>
    </div>
  )
}


