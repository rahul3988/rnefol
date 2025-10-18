import React, { useState, useEffect } from 'react'

interface Video {
  id: number
  title: string
  description: string
  video_url: string
  redirect_url: string
  views: number
  likes: number
  price: string
  size: 'small' | 'medium' | 'large'
  thumbnail_url: string
  is_active: boolean
  video_type: 'local' | 'instagram' | 'facebook' | 'youtube' | 'url'
  created_at: string
}

const VideoManager: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingVideo, setEditingVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    redirect_url: '',
    price: '',
    size: 'medium' as 'small' | 'medium' | 'large',
    thumbnail_url: '',
    is_active: true,
    video_type: 'local' as 'local' | 'instagram' | 'facebook' | 'youtube' | 'url'
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null)

  const uploadFile = async (file: File, type: 'video' | 'thumbnail'): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    const response = await fetch(`${window.location.protocol}//${window.location.hostname}:4000/api/upload`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    const data = await response.json()
    return data.filename
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'thumbnail') => {
    const file = e.target.files?.[0]
    if (file) {
      if (type === 'video') {
        setSelectedFile(file)
        // Auto-generate thumbnail from video if no thumbnail selected
        if (!selectedThumbnail) {
          const video = document.createElement('video')
          video.src = URL.createObjectURL(file)
          video.onloadedmetadata = () => {
            const canvas = document.createElement('canvas')
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.drawImage(video, 0, 0)
              canvas.toBlob((blob) => {
                if (blob) {
                  const thumbnailFile = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' })
                  setSelectedThumbnail(thumbnailFile)
                }
              }, 'image/jpeg')
            }
          }
        }
      } else {
        setSelectedThumbnail(file)
      }
    }
  }

  const getVideoTypeFromUrl = (url: string): 'local' | 'instagram' | 'facebook' | 'youtube' | 'url' => {
    if (url.includes('instagram.com')) return 'instagram'
    if (url.includes('facebook.com') || url.includes('fb.com')) return 'facebook'
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
    if (url.startsWith('/') || url.includes('localhost')) return 'local'
    return 'url'
  }

  const fetchVideos = async () => {
    try {
      const response = await fetch(`${window.location.protocol}//${window.location.hostname}:4000/api/videos`)
      if (response.ok) {
        const data = await response.json()
        setVideos(data)
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.title.trim()) {
      alert('Please enter a title')
      return
    }
    if (!formData.description.trim()) {
      alert('Please enter a description')
      return
    }
    if (!formData.price.trim()) {
      alert('Please enter a price')
      return
    }
    if (!formData.redirect_url.trim()) {
      alert('Please enter a redirect URL')
      return
    }
    
    // Video URL validation based on type
    if (formData.video_type === 'local' && !selectedFile) {
      alert('Please select a video file for local upload')
      return
    }
    if (formData.video_type !== 'local' && !formData.video_url.trim()) {
      alert('Please enter a video URL')
      return
    }
    
    setLoading(true)
    setUploadingFile(true)

    try {
      let videoUrl = formData.video_url
      let thumbnailUrl = formData.thumbnail_url

      // Upload files if selected
      if (selectedFile) {
        videoUrl = await uploadFile(selectedFile, 'video')
      }
      if (selectedThumbnail) {
        thumbnailUrl = await uploadFile(selectedThumbnail, 'thumbnail')
      }

      // Ensure video_url is not null
      if (!videoUrl && formData.video_type === 'local') {
        videoUrl = 'local-upload-pending'
      }

      // Auto-detect video type if not local
      const videoType = selectedFile ? 'local' : getVideoTypeFromUrl(formData.video_url)

      const url = editingVideo 
        ? `${window.location.protocol}//${window.location.hostname}:4000/api/videos/${editingVideo.id}`
        : `${window.location.protocol}//${window.location.hostname}:4000/api/videos`
      
      const method = editingVideo ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          video_url: videoUrl || formData.video_url,
          thumbnail_url: thumbnailUrl || formData.thumbnail_url,
          video_type: videoType
        })
      })

      if (response.ok) {
        await fetchVideos()
        setShowAddModal(false)
        setEditingVideo(null)
        setSelectedFile(null)
        setSelectedThumbnail(null)
        setFormData({
          title: '',
          description: '',
          video_url: '',
          redirect_url: '',
          price: '',
          size: 'medium',
          thumbnail_url: '',
          is_active: true,
          video_type: 'local'
        })
      } else {
        const errorData = await response.json()
        console.error('Server error:', errorData)
        alert(`Failed to save video: ${errorData.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to save video:', error)
      alert('Failed to save video. Please try again.')
    } finally {
      setLoading(false)
      setUploadingFile(false)
    }
  }

  const handleEdit = (video: Video) => {
    setEditingVideo(video)
    setFormData({
      title: video.title,
      description: video.description,
      video_url: video.video_url,
      redirect_url: video.redirect_url,
      price: video.price,
      size: video.size,
      thumbnail_url: video.thumbnail_url,
      is_active: video.is_active,
      video_type: video.video_type
    })
    setShowAddModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this video?')) return

    try {
      const response = await fetch(`${window.location.protocol}//${window.location.hostname}:4000/api/videos/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchVideos()
      }
    } catch (error) {
      console.error('Failed to delete video:', error)
    }
  }

  const toggleActive = async (video: Video) => {
    try {
      const response = await fetch(`${window.location.protocol}//${window.location.hostname}:4000/api/videos/${video.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...video, is_active: !video.is_active })
      })

      if (response.ok) {
        await fetchVideos()
      }
    } catch (error) {
      console.error('Failed to toggle video status:', error)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Video Manager</h1>
        <button
          onClick={() => {
            setEditingVideo(null)
            setFormData({
              title: '',
              description: '',
              video_url: '',
              redirect_url: '',
              price: '',
              size: 'medium',
              thumbnail_url: '',
              is_active: true,
              video_type: 'local'
            })
            setShowAddModal(true)
          }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
        >
          Add New Video
        </button>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <div key={video.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="relative">
              <img 
                src={video.thumbnail_url || '/placeholder-video.jpg'} 
                alt={video.title}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 left-2">
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  video.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {video.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="absolute top-2 right-2">
                <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                  {video.size.toUpperCase()}
                </span>
              </div>
              <div className="absolute top-2 left-12">
                <span className="px-2 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                  {video.video_type?.toUpperCase() || 'URL'}
                </span>
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{video.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{video.description}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
                <span>👁️ {video.views} views</span>
                <span>❤️ {video.likes} likes</span>
                <span className="font-bold text-green-600">{video.price}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(video)}
                  className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleActive(video)}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm text-white transition-colors ${
                    video.is_active ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {video.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDelete(video.id)}
                  className="rounded-lg bg-gray-600 px-3 py-2 text-sm text-white hover:bg-gray-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {editingVideo ? 'Edit Video' : 'Add New Video'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price
                  </label>
                  <input
                    type="text"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="₹1899"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                  required
                />
              </div>

              {/* Video Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Video Source Type
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {[
                    { value: 'local', label: 'Local Upload', icon: '📁' },
                    { value: 'instagram', label: 'Instagram', icon: '📷' },
                    { value: 'facebook', label: 'Facebook', icon: '👥' },
                    { value: 'youtube', label: 'YouTube', icon: '📺' },
                    { value: 'url', label: 'Direct URL', icon: '🔗' }
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, video_type: type.value as any })}
                      className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                        formData.video_type === type.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="text-lg mb-1">{type.icon}</div>
                      <div>{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Video Input based on type */}
              {formData.video_type === 'local' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload Video File
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileChange(e, 'video')}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required={!editingVideo}
                  />
                  {selectedFile && (
                    <div className="mt-2 text-sm text-green-600">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}
                  {/* Hidden input to ensure video_url is set for local uploads */}
                  <input
                    type="hidden"
                    value={selectedFile ? 'local-upload' : ''}
                    onChange={() => {}}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Video URL
                  </label>
                  <input
                    type="url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={
                      formData.video_type === 'instagram' ? 'https://www.instagram.com/p/...' :
                      formData.video_type === 'facebook' ? 'https://www.facebook.com/watch/?v=...' :
                      formData.video_type === 'youtube' ? 'https://www.youtube.com/watch?v=...' :
                      'https://example.com/video.mp4'
                    }
                    required
                  />
                  <div className="mt-1 text-xs text-gray-500">
                    {formData.video_type === 'instagram' && 'Paste Instagram post URL'}
                    {formData.video_type === 'facebook' && 'Paste Facebook video URL'}
                    {formData.video_type === 'youtube' && 'Paste YouTube video URL'}
                    {formData.video_type === 'url' && 'Paste direct video URL'}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Redirect URL
                </label>
                <input
                  type="url"
                  value={formData.redirect_url}
                  onChange={(e) => setFormData({ ...formData, redirect_url: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="https://example.com/product"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Thumbnail
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'thumbnail')}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    {selectedThumbnail && (
                      <div className="text-sm text-green-600">
                        Selected: {selectedThumbnail.name}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      Or enter URL manually below
                    </div>
                    <input
                      type="url"
                      value={formData.thumbnail_url}
                      onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="https://example.com/thumbnail.jpg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Size
                  </label>
                  <select
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value as 'small' | 'medium' | 'large' })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="small">Small (w-48 h-64)</option>
                    <option value="medium">Medium (w-56 h-72)</option>
                    <option value="large">Large (w-64 h-80)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Active
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading || uploadingFile}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading || uploadingFile ? 'Saving...' : (editingVideo ? 'Update Video' : 'Add Video')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default VideoManager


