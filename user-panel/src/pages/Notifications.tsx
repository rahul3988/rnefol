import React, { useState } from 'react'
import { Bell, Mail, Smartphone, CheckCircle, XCircle } from 'lucide-react'

export default function Notifications() {
  const [notifications, setNotifications] = useState({
    email: {
      orderUpdates: true,
      promotions: true,
      newsletters: false,
      securityAlerts: true
    },
    sms: {
      orderUpdates: true,
      promotions: false,
      securityAlerts: true
    },
    push: {
      orderUpdates: true,
      promotions: true,
      reminders: false
    }
  })

  const handleToggle = (category: string, type: string) => {
    setNotifications(prev => {
      const cat = prev[category as keyof typeof prev]
      return {
        ...prev,
        [category]: {
          ...cat,
          [type]: !(cat as any)[type]
        }
      }
    })
  }

  const notificationTypes = [
    {
      category: 'email',
      title: 'Email Notifications',
      icon: Mail,
      description: 'Receive updates via email',
      options: [
        { key: 'orderUpdates', label: 'Order Updates', description: 'Get notified about order status changes' },
        { key: 'promotions', label: 'Promotions & Offers', description: 'Receive exclusive deals and discounts' },
        { key: 'newsletters', label: 'Newsletters', description: 'Get beauty tips and product updates' },
        { key: 'securityAlerts', label: 'Security Alerts', description: 'Important account security notifications' }
      ]
    },
    {
      category: 'sms',
      title: 'SMS Notifications',
      icon: Smartphone,
      description: 'Receive updates via SMS',
      options: [
        { key: 'orderUpdates', label: 'Order Updates', description: 'Get notified about order status changes' },
        { key: 'promotions', label: 'Promotions & Offers', description: 'Receive exclusive deals and discounts' },
        { key: 'securityAlerts', label: 'Security Alerts', description: 'Important account security notifications' }
      ]
    },
    {
      category: 'push',
      title: 'Push Notifications',
      icon: Bell,
      description: 'Receive browser notifications',
      options: [
        { key: 'orderUpdates', label: 'Order Updates', description: 'Get notified about order status changes' },
        { key: 'promotions', label: 'Promotions & Offers', description: 'Receive exclusive deals and discounts' },
        { key: 'reminders', label: 'Reminders', description: 'Get reminders for abandoned carts and reviews' }
      ]
    }
  ]

  return (
    <main className="py-10 dark:bg-slate-900 min-h-screen">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-slate-100 mb-6">
            Notification Settings
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Choose how you want to receive notifications from Nefol.
          </p>
        </div>

        {/* Notification Types */}
        <div className="space-y-8 mb-16">
          {notificationTypes.map((type) => {
            const IconComponent = type.icon
            return (
              <div key={type.category} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-4">
                    <IconComponent className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      {type.title}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">
                      {type.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {type.options.map((option) => (
                    <div key={option.key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                          {option.label}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {option.description}
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggle(type.category, option.key)}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          (notifications as any)[type.category][option.key]
                            ? 'bg-blue-600'
                            : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          (notifications as any)[type.category][option.key]
                            ? 'translate-x-6'
                            : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Notification Preferences */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 rounded-2xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
            Notification Preferences
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Quiet Hours
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Set times when you don't want to receive notifications
              </p>
              <div className="flex items-center space-x-4">
                <input
                  type="time"
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  defaultValue="22:00"
                />
                <span className="text-slate-600 dark:text-slate-400">to</span>
                <input
                  type="time"
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  defaultValue="08:00"
                />
              </div>
            </div>
            <div className="bg-white dark:bg-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Frequency
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                How often you want to receive promotional notifications
              </p>
              <select className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="never">Never</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="text-center">
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Save Notification Settings
          </button>
        </div>
      </div>
    </main>
  )
}
