import React, { useState, useEffect } from 'react'
import { X, MessageCircle, Gift } from 'lucide-react'
import { getApiBase } from '../utils/apiBase'

interface NewsletterPopupProps {
  onClose?: () => void
}

export default function NewsletterPopup({ onClose }: NewsletterPopupProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Check if user has already dismissed
    const dismissed = localStorage.getItem('whatsapp-popup-dismissed')
    if (dismissed) return

    // Show after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 5000)

    // Exit intent detection
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !isVisible && !localStorage.getItem('whatsapp-popup-dismissed')) {
        setIsVisible(true)
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    localStorage.setItem('whatsapp-popup-dismissed', 'true')
    if (onClose) onClose()
  }

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '')
    
    // Format as Indian phone number (10 digits)
    if (digits.length <= 10) {
      if (digits.length <= 5) {
        return digits
      } else {
        return `${digits.slice(0, 5)} ${digits.slice(5)}`
      }
    }
    return digits.slice(0, 10)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhone(formatted)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const phoneDigits = phone.replace(/\D/g, '')
    
    if (!phoneDigits || phoneDigits.length !== 10) {
      alert('Please enter a valid 10-digit phone number')
      return
    }

    setLoading(true)
    try {
      const apiBase = getApiBase()
      const response = await fetch(`${apiBase}/api/whatsapp/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: phoneDigits,
          source: 'popup'
        })
      })

      if (response.ok) {
        setSuccess(true)
        localStorage.setItem('whatsapp-popup-dismissed', 'true')
        setTimeout(() => {
          setIsVisible(false)
          if (onClose) onClose()
        }, 3000)
      } else {
        const data = await response.json()
        if (data.message && data.message.includes('Already subscribed')) {
          setSuccess(true)
          localStorage.setItem('whatsapp-popup-dismissed', 'true')
          setTimeout(() => {
            setIsVisible(false)
            if (onClose) onClose()
          }, 2000)
        } else {
          alert('Failed to subscribe. Please try again.')
        }
      }
    } catch (error) {
      console.error('WhatsApp subscription error:', error)
      alert('Failed to subscribe. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isVisible) return null

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-[100] transition-opacity"
        onClick={handleClose}
      />
      <div 
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[101] bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-serif mb-2" style={{color: '#1B4965'}}>
                Thank You!
              </h3>
              <p className="text-gray-600">
                You've successfully joined The Nefol Circle!
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-4xl">🌿</span>
                  <span className="text-4xl">🦋</span>
                </div>
                <div className="mb-3">
                  <h1 className="text-3xl font-serif font-bold mb-2" style={{color: '#1B4965'}}>
                    NEFÖL
                  </h1>
                  <p className="text-sm text-gray-600 italic">
                    NATURAL AS THE MORNING DEW
                  </p>
                </div>
                <h3 className="text-2xl font-serif mb-2" style={{color: '#1B4965'}}>
                  Join The Nefol Circle
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  Stay ahead with exclusive style drops, member-only offers, and insider fashion updates.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 px-3 py-2 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50">
                      +91
                    </span>
                    <input
                      type="tel"
                      placeholder="98765 43210"
                      value={phone}
                      onChange={handlePhoneChange}
                      required
                      maxLength={12}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter your 10-digit mobile number
                  </p>
                </div>
                
                <button
                  type="submit"
                  disabled={loading || !phone || phone.replace(/\D/g, '').length !== 10}
                  className="w-full py-3 text-white font-medium rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{backgroundColor: '#4B97C9'}}
                >
                  {loading ? 'Subscribing...' : 'Subscribe Now'}
                </button>
              </form>

              <p className="text-xs text-gray-500 text-center mt-4">
                By subscribing, you agree to receive WhatsApp messages from Nefol.
              </p>
            </>
          )}
        </div>
      </div>
    </>
  )
}
