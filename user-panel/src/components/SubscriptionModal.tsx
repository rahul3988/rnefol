import React, { useState } from 'react'
import { X } from 'lucide-react'

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!whatsappNumber) return

    setIsSubmitting(true)
    try {
      // Here you would typically send the WhatsApp number to your backend
      console.log('Subscribing WhatsApp number:', whatsappNumber)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Close modal after successful subscription
      onClose()
    } catch (error) {
      console.error('Subscription failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>
      
      {/* Modal centered */}
      <div 
        className={`relative w-full max-w-4xl bg-white rounded-lg overflow-hidden shadow-2xl transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-10 h-10 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-lg"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>

        {/* Mobile Back Button */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-4 left-4 z-50 w-10 h-10 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-lg"
          aria-label="Go back"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex flex-col lg:flex-row min-h-[400px] lg:min-h-[500px]">
            {/* Left Section - Product Image */}
            <div className="lg:w-1/2 relative overflow-hidden h-64 lg:h-auto" style={{ backgroundColor: '#F4F9F9' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100"></div>
              
              {/* Product Image */}
              <div className="relative h-full flex items-center justify-center p-4 lg:p-8">
                <div className="relative z-10">
                  {/* Main Product Bottle */}
                  <div className="relative mb-4 lg:mb-8">
                    <img 
                      src="/IMAGES/BANNER (1).jpg" 
                      alt="Nefol Product"
                      className="w-32 h-40 lg:w-64 lg:h-80 object-contain mx-auto"
                    />
                    
                    {/* Product Details Overlay */}
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-lg p-2 lg:p-4 w-40 lg:w-56">
                      <div className="text-center">
                        <h3 className="text-sm lg:text-lg font-bold mb-1 lg:mb-2" style={{ color: '#1B4965' }}>
                          NEFÖL
                        </h3>
                        <p className="text-xs lg:text-sm mb-1" style={{ color: '#9DB4C0' }}>
                          NATURAL AS THE MORNING DEW
                        </p>
                        <p className="text-xs lg:text-sm font-semibold" style={{ color: '#4B97C9' }}>
                          Blue Tea HAIR MASK
                        </p>
                        <p className="text-xs mt-1 lg:mt-2" style={{ color: '#9DB4C0' }}>
                          ARGAN, OLIVE SQUALANE, QUINOA PROTEIN
                        </p>
                        <p className="text-xs" style={{ color: '#9DB4C0' }}>
                          ALL TYPES OF HAIR
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Decorative Elements - Hidden on mobile */}
                  <div className="hidden lg:block absolute top-20 left-8 opacity-20">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                      <span className="text-2xl">🌿</span>
                    </div>
                  </div>
                  
                  <div className="hidden lg:block absolute top-32 right-8 opacity-20">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                      <span className="text-xl">🦋</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Subscription Form */}
            <div className="lg:w-1/2 p-4 lg:p-8 flex flex-col justify-center" style={{ backgroundColor: '#1B4965' }}>
              <div className="max-w-md mx-auto w-full">
                {/* Logo */}
                <div className="flex items-center mb-4 lg:mb-6">
                  <div className="w-6 h-6 lg:w-8 lg:h-8 bg-green-500 rounded-full flex items-center justify-center mr-2 lg:mr-3">
                    <span className="text-white text-xs lg:text-sm font-bold">N</span>
                  </div>
                  <span className="text-xl lg:text-2xl font-bold text-white">NEFÖL</span>
                </div>

                {/* Heading */}
                <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3 lg:mb-4">
                  Join The Nefol Circle
                </h2>

                {/* Description */}
                <p className="text-white/90 mb-6 lg:mb-8 text-base lg:text-lg">
                  Stay ahead with exclusive style drops, member-only offers, and insider fashion updates.
                </p>

                {/* Subscription Form */}
                <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-4">
                  <div>
                    <input
                      type="tel"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="WhatsApp Number*"
                      required
                      className="w-full px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-sm lg:text-base"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting || !whatsappNumber}
                    className="w-full bg-white text-gray-900 py-2.5 lg:py-3 px-4 lg:px-6 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base"
                  >
                    {isSubmitting ? 'Subscribing...' : 'Subscribe Now'}
                  </button>
                </form>

                {/* Additional Info */}
                <p className="text-white/70 text-xs lg:text-sm mt-4 lg:mt-6 text-center">
                  By subscribing, you agree to receive WhatsApp messages from Nefol.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}