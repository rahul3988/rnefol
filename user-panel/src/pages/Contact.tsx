export default function Contact() {
  return (
    <main className="min-h-screen py-10" style={{backgroundColor: '#F4F9F9'}}>
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-serif mb-4" style={{color: '#1B4965'}}>CONTACT US</h1>
          <p className="mx-auto max-w-3xl text-lg font-light" style={{color: '#9DB4C0'}}>
            Have a question or comment? Use the form below to send us a message, or contact us by mail.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-serif mb-6" style={{color: '#1B4965'}}>Get In Touch!</h2>
            <p className="mb-6 font-light" style={{color: '#9DB4C0'}}>
              We'd love to hear from you - please use the form to send us your message or ideas. 
              Or simply pop in for a cup of fresh tea and a cookie:
            </p>
            
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium" style={{color: '#1B4965'}} htmlFor="name">Name</label>
                <input 
                  id="name" 
                  className="h-12 w-full rounded-lg border border-gray-300 px-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" 
                  required 
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium" style={{color: '#1B4965'}} htmlFor="phone">Phone number</label>
                <input 
                  id="phone" 
                  type="tel" 
                  className="h-12 w-full rounded-lg border border-gray-300 px-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" 
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium" style={{color: '#1B4965'}} htmlFor="email">Email *</label>
                <input 
                  id="email" 
                  type="email" 
                  className="h-12 w-full rounded-lg border border-gray-300 px-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" 
                  required 
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium" style={{color: '#1B4965'}} htmlFor="message">Comment *</label>
                <textarea 
                  id="message" 
                  rows={6} 
                  className="w-full rounded-lg border border-gray-300 p-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" 
                  required 
                />
              </div>
              <button 
                type="submit"
                className="w-full px-8 py-4 text-white font-medium transition-all duration-300 text-sm tracking-wide uppercase shadow-lg"
                style={{backgroundColor: '#1B4965'}}
              >
                SEND MESSAGE
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-serif mb-6" style={{color: '#1B4965'}}>Contact Information</h2>
            
            <div className="space-y-8">
              {/* Office Addresses */}
              <div>
                <h3 className="mb-4 text-lg font-medium" style={{color: '#1B4965'}}>Office Addresses</h3>
                <div className="space-y-4">
                  <div className="rounded-lg border border-gray-200 p-4" style={{backgroundColor: '#D0E8F2'}}>
                    <h4 className="font-medium" style={{color: '#1B4965'}}>Lucknow Office</h4>
                    <p className="font-light" style={{color: '#9DB4C0'}}>
                      703, BCC Tower, Sultanpur Road,<br />
                      Arjunganj, Lucknow,<br />
                      Uttar Pradesh – 226002, India
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4" style={{backgroundColor: '#D0E8F2'}}>
                    <h4 className="font-medium" style={{color: '#1B4965'}}>Greater Noida Office</h4>
                    <p className="font-light" style={{color: '#9DB4C0'}}>
                      D-2627, 12th Avenue, Gaur City-2,<br />
                      Sector 16C, Greater Noida West,<br />
                      Ghaziabad, Uttar Pradesh – 201009, India
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div>
                <h3 className="mb-4 text-lg font-medium" style={{color: '#1B4965'}}>Contact Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{backgroundColor: '#D0E8F2'}}>
                      <span style={{color: '#4B97C9'}}>📞</span>
                    </div>
                    <div>
                      <p className="font-medium" style={{color: '#1B4965'}}>Phone</p>
                      <p className="font-light" style={{color: '#9DB4C0'}}>+91-8887847213</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{backgroundColor: '#D0E8F2'}}>
                      <span style={{color: '#4B97C9'}}>✉️</span>
                    </div>
                    <div>
                      <p className="font-medium" style={{color: '#1B4965'}}>Email</p>
                      <p className="font-light" style={{color: '#9DB4C0'}}>support@thenefol.com</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{backgroundColor: '#D0E8F2'}}>
                      <span style={{color: '#4B97C9'}}>💬</span>
                    </div>
                    <div>
                      <p className="font-medium" style={{color: '#1B4965'}}>WhatsApp</p>
                      <p className="font-light" style={{color: '#9DB4C0'}}>Chat with us on WhatsApp</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Sections */}
        <div className="mt-16">
          {/* Affiliate Program */}
          <div className="rounded-xl border border-gray-200 p-8" style={{backgroundColor: '#D0E8F2'}}>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{backgroundColor: '#4B97C9'}}>
              <span className="text-xl text-white">🤝</span>
            </div>
            <h3 className="mb-4 text-2xl font-serif" style={{color: '#1B4965'}}>Affiliate Program</h3>
            <p className="mb-6 font-light" style={{color: '#9DB4C0'}}>
              Join our affiliate program and earn commissions by promoting Nefol products. 
              Share our natural skincare solutions with your audience and get rewarded for every sale.
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-2">
                <span style={{color: '#4B97C9'}}>✓</span>
                <span className="text-sm font-light" style={{color: '#1B4965'}}>Competitive commission rates</span>
              </div>
              <div className="flex items-center space-x-2">
                <span style={{color: '#4B97C9'}}>✓</span>
                <span className="text-sm font-light" style={{color: '#1B4965'}}>Marketing materials provided</span>
              </div>
              <div className="flex items-center space-x-2">
                <span style={{color: '#4B97C9'}}>✓</span>
                <span className="text-sm font-light" style={{color: '#1B4965'}}>Real-time tracking dashboard</span>
              </div>
              <div className="flex items-center space-x-2">
                <span style={{color: '#4B97C9'}}>✓</span>
                <span className="text-sm font-light" style={{color: '#1B4965'}}>Dedicated support team</span>
              </div>
            </div>
            <a 
              href="#/affiliate" 
              className="inline-block px-8 py-4 text-white font-medium transition-all duration-300 text-sm tracking-wide uppercase shadow-lg rounded-lg"
              style={{backgroundColor: '#1B4965'}}
            >
              JOIN AFFILIATE PROGRAM
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}