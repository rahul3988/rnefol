import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/blog')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`
    cb(null, uniqueName)
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  }
})

// In-memory storage for blog requests (in production, use a database)
let blogRequests: any[] = []
let blogPosts: any[] = []

// Submit blog request
router.post('/request', upload.array('images', 5), async (req, res) => {
  try {
    const { title, content, excerpt, author_name, author_email } = req.body
    const images = req.files as Express.Multer.File[]

    if (!title || !content || !excerpt || !author_name || !author_email) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    const blogRequest = {
      id: uuidv4(),
      title,
      content,
      excerpt,
      author_name,
      author_email,
      images: images.map(img => `/uploads/blog/${img.filename}`),
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    blogRequests.push(blogRequest)

    // Send email notification to admin (placeholder)
    console.log(`📧 New blog request from ${author_name}: ${title}`)

    res.json({
      message: 'Blog request submitted successfully',
      requestId: blogRequest.id
    })
  } catch (error) {
    console.error('Error submitting blog request:', error)
    res.status(500).json({ message: 'Failed to submit blog request' })
  }
})

// Get all blog posts (approved only for public)
router.get('/posts', (req, res) => {
  try {
    const approvedPosts = blogPosts.filter(post => post.status === 'approved')
    res.json(approvedPosts)
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    res.status(500).json({ message: 'Failed to fetch blog posts' })
  }
})

// Get single blog post
router.get('/posts/:id', (req, res) => {
  try {
    const post = blogPosts.find(p => p.id === req.params.id)
    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' })
    }
    res.json(post)
  } catch (error) {
    console.error('Error fetching blog post:', error)
    res.status(500).json({ message: 'Failed to fetch blog post' })
  }
})

// Admin routes (protected)
// Get all blog requests (admin only)
router.get('/admin/requests', (req, res) => {
  try {
    res.json(blogRequests)
  } catch (error) {
    console.error('Error fetching blog requests:', error)
    res.status(500).json({ message: 'Failed to fetch blog requests' })
  }
})

// Get all blog posts (admin only)
router.get('/admin/posts', (req, res) => {
  try {
    res.json(blogPosts)
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    res.status(500).json({ message: 'Failed to fetch blog posts' })
  }
})

// Approve blog request
router.post('/admin/approve/:id', (req, res) => {
  try {
    const requestId = req.params.id
    const { featured = false } = req.body

    const requestIndex = blogRequests.findIndex(req => req.id === requestId)
    if (requestIndex === -1) {
      return res.status(404).json({ message: 'Blog request not found' })
    }

    const request = blogRequests[requestIndex]
    
    // Create blog post from request
    const blogPost = {
      ...request,
      status: 'approved',
      featured,
      updated_at: new Date().toISOString()
    }

    // Add to blog posts
    blogPosts.push(blogPost)

    // Remove from requests
    blogRequests.splice(requestIndex, 1)

    // Send email notification to author (placeholder)
    console.log(`📧 Blog post approved for ${request.author_name}: ${request.title}`)

    res.json({
      message: 'Blog request approved successfully',
      post: blogPost
    })
  } catch (error) {
    console.error('Error approving blog request:', error)
    res.status(500).json({ message: 'Failed to approve blog request' })
  }
})

// Reject blog request
router.post('/admin/reject/:id', (req, res) => {
  try {
    const requestId = req.params.id
    const { reason } = req.body

    const requestIndex = blogRequests.findIndex(req => req.id === requestId)
    if (requestIndex === -1) {
      return res.status(404).json({ message: 'Blog request not found' })
    }

    const request = blogRequests[requestIndex]
    
    // Update request status
    blogRequests[requestIndex] = {
      ...request,
      status: 'rejected',
      rejection_reason: reason,
      updated_at: new Date().toISOString()
    }

    // Send email notification to author (placeholder)
    console.log(`📧 Blog post rejected for ${request.author_name}: ${request.title}. Reason: ${reason}`)

    res.json({
      message: 'Blog request rejected successfully'
    })
  } catch (error) {
    console.error('Error rejecting blog request:', error)
    res.status(500).json({ message: 'Failed to reject blog request' })
  }
})

// Update blog post
router.put('/admin/posts/:id', (req, res) => {
  try {
    const postId = req.params.id
    const updates = req.body

    const postIndex = blogPosts.findIndex(post => post.id === postId)
    if (postIndex === -1) {
      return res.status(404).json({ message: 'Blog post not found' })
    }

    blogPosts[postIndex] = {
      ...blogPosts[postIndex],
      ...updates,
      updated_at: new Date().toISOString()
    }

    res.json({
      message: 'Blog post updated successfully',
      post: blogPosts[postIndex]
    })
  } catch (error) {
    console.error('Error updating blog post:', error)
    res.status(500).json({ message: 'Failed to update blog post' })
  }
})

// Delete blog post
router.delete('/admin/posts/:id', (req, res) => {
  try {
    const postId = req.params.id

    const postIndex = blogPosts.findIndex(post => post.id === postId)
    if (postIndex === -1) {
      return res.status(404).json({ message: 'Blog post not found' })
    }

    const post = blogPosts[postIndex]
    
    // Delete associated images
    post.images.forEach((imagePath: string) => {
      const fullPath = path.join(__dirname, '../../uploads/blog', path.basename(imagePath))
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath)
      }
    })

    // Remove from blog posts
    blogPosts.splice(postIndex, 1)

    res.json({
      message: 'Blog post deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting blog post:', error)
    res.status(500).json({ message: 'Failed to delete blog post' })
  }
})

export default router
