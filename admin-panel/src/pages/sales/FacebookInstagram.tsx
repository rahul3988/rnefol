import React, { useState } from 'react'

export default function FacebookInstagram() {
  const [isConnected, setIsConnected] = useState(false)
  const [posts, setPosts] = useState([
    {
      id: 1,
      platform: 'facebook',
      content: 'Introducing our new skincare range! 🌟',
      image: '/IMAGES/PDP IMAGES/FACE SERUM (1).jpg',
      scheduledFor: '2024-01-25T10:00:00Z',
      status: 'scheduled'
    },
    {
      id: 2,
      platform: 'instagram',
      content: 'Behind the scenes of our product photoshoot 📸',
      image: '/IMAGES/PDP IMAGES/FACE MASK (1).jpg',
      scheduledFor: '2024-01-24T15:30:00Z',
      status: 'published'
    }
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Facebook & Instagram</h1>
        <button 
          onClick={() => setIsConnected(!isConnected)}
          className={isConnected ? "btn-secondary" : "btn-primary"}
        >
          {isConnected ? 'Disconnect' : 'Connect Account'}
        </button>
      </div>

      {!isConnected ? (
        <div className="metric-card text-center py-12">
          <div className="text-6xl mb-4">📘</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Social Media</h2>
          <p className="text-gray-600 mb-6">Connect your Facebook and Instagram accounts to manage posts, stories, and ads from one place.</p>
          <button 
            onClick={() => setIsConnected(true)}
            className="btn-primary"
          >
            Connect Facebook & Instagram
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Connection Status */}
          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">f</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Facebook Page</h3>
                  <p className="text-sm text-gray-600">Nefol Skincare</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">Connected</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { title: 'Total Posts', value: '24', icon: '📝' },
              { title: 'Scheduled', value: '3', icon: '⏰' },
              { title: 'Engagement', value: '2.4K', icon: '❤️' },
              { title: 'Reach', value: '8.7K', icon: '👁️' }
            ].map((stat, index) => (
              <div key={index} className="metric-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className="text-2xl">{stat.icon}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Posts */}
          <div className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Posts</h2>
              <button className="btn-primary">Create Post</button>
            </div>

            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-4">
                    <img 
                      src={post.image} 
                      alt="Post" 
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          post.platform === 'facebook' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                        }`}>
                          {post.platform === 'facebook' ? '📘 Facebook' : '📷 Instagram'}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          post.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {post.status}
                        </span>
                      </div>
                      <p className="text-gray-900 mb-2">{post.content}</p>
                      <p className="text-sm text-gray-500">
                        {post.status === 'scheduled' ? 'Scheduled for' : 'Published on'} {new Date(post.scheduledFor).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="btn-secondary text-xs px-2 py-1">Edit</button>
                      <button className="btn-secondary text-xs px-2 py-1">View</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}








