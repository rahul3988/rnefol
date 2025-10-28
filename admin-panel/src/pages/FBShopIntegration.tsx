import React, { useState } from 'react'

export default function FBShopIntegration() {
  const [config, setConfig] = useState({ page_id: '', access_token: '' })

  const saveConfig = async () => {
    const resp = await fetch('/api/fb-shop/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    })
    const data = await resp.json()
    if (data.success) alert('Configuration saved')
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Facebook/Instagram Shop Integration</h1>

      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-yellow-800">
          <strong>Note:</strong> This is a stub implementation. 
          Full integration requires Facebook Business API setup and OAuth flow.
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Page ID</label>
        <input
          type="text"
          value={config.page_id}
          onChange={(e) => setConfig({ ...config, page_id: e.target.value })}
          className="border p-2 rounded w-full"
          placeholder="Your Facebook Page ID"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Access Token</label>
        <input
          type="text"
          value={config.access_token}
          onChange={(e) => setConfig({ ...config, access_token: e.target.value })}
          className="border p-2 rounded w-full"
          placeholder="Long-lived access token"
        />
      </div>

      <button
        onClick={saveConfig}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Save Configuration
      </button>

      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">Integration Status: Not Connected</h3>
        <p className="text-sm text-gray-600">
          To complete integration, you need to:
        </p>
        <ul className="list-disc list-inside text-sm text-gray-600 mt-2">
          <li>Create a Facebook Business Account</li>
          <li>Set up Meta Commerce Manager</li>
          <li>Generate a long-lived access token</li>
          <li>Configure catalog sync</li>
        </ul>
      </div>
    </div>
  )
}

