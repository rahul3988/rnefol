import React, { useState, useEffect } from 'react'
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  RefreshCw,
  DollarSign,
  TrendingUp,
  Mail,
  Phone,
  MapPin,
  Instagram,
  Youtube,
  Facebook,
  MessageSquare,
  Search,
  Filter,
  Download,
  Copy,
  AlertCircle,
  Calendar,
  User,
  Globe,
  BarChart3
} from 'lucide-react'

interface AffiliateApplication {
  id: number
  name: string
  email: string
  phone: string
  instagram?: string
  snapchat?: string
  youtube?: string
  facebook?: string
  followers: string
  platform: string
  experience: string
  why_join: string
  expected_sales: string
  house_number: string
  street: string
  building?: string
  apartment?: string
  road: string
  city: string
  pincode: string
  state: string
  agree_terms: boolean
  status: 'pending' | 'approved' | 'rejected'
  verification_code?: string
  admin_notes?: string
  rejection_reason?: string
  application_date: string
  approved_at?: string
  rejected_at?: string
}

export default function AffiliateManagement() {
  const [applications, setApplications] = useState<AffiliateApplication[]>([])
  const [selectedApplication, setSelectedApplication] = useState<AffiliateApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [adminNotes, setAdminNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'approve' | 'reject' | 'view'>('view')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'status'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  })

  useEffect(() => {
    fetchApplications()
  }, [statusFilter, currentPage, sortBy, sortOrder])

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery !== '') {
        fetchApplications()
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        sort: sortBy,
        order: sortOrder
      })
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim())
      }

      const response = await fetch(`/api/admin/affiliate-applications?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setApplications(data.data.applications)
        setTotalPages(data.data.pagination.pages)
        
        // Update stats
        setStats({
          total: data.data.pagination.total,
          pending: data.data.applications.filter((app: AffiliateApplication) => app.status === 'pending').length,
          approved: data.data.applications.filter((app: AffiliateApplication) => app.status === 'approved').length,
          rejected: data.data.applications.filter((app: AffiliateApplication) => app.status === 'rejected').length
        })
      } else {
        console.error('Failed to fetch applications:', data.message)
        // Fallback to mock data for development
        const mockApplications: AffiliateApplication[] = [
          {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+1234567890',
            instagram: '@johndoe',
            youtube: 'https://youtube.com/@johndoe',
            followers: '10k-25k',
            platform: 'instagram',
            experience: '2 years of affiliate marketing experience with skincare brands',
            why_join: 'I love promoting natural skincare products and have a dedicated audience',
            expected_sales: '10k-25k',
            house_number: '123',
            street: 'Main Street',
            road: 'MG Road',
            city: 'Mumbai',
            pincode: '400001',
            state: 'Maharashtra',
            agree_terms: true,
            status: 'pending',
            application_date: new Date().toISOString()
          },
          {
            id: 2,
            name: 'Priya Sharma',
            email: 'priya@example.com',
            phone: '+9876543210',
            instagram: '@priyasharma',
            followers: '25k-50k',
            platform: 'instagram',
            experience: '3 years of beauty influencer experience',
            why_join: 'Passionate about natural skincare and have built trust with my audience',
            expected_sales: '25k-50k',
            house_number: '456',
            street: 'Park Street',
            road: 'Park Street',
            city: 'Delhi',
            pincode: '110001',
            state: 'Delhi',
            agree_terms: true,
            status: 'approved',
            verification_code: 'a1b2c3d4e5f6g7h8i9j0',
            application_date: new Date(Date.now() - 86400000).toISOString()
          }
        ]
        setApplications(mockApplications)
        setTotalPages(1)
        setStats({
          total: mockApplications.length,
          pending: mockApplications.filter(app => app.status === 'pending').length,
          approved: mockApplications.filter(app => app.status === 'approved').length,
          rejected: mockApplications.filter(app => app.status === 'rejected').length
        })
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
      // Show error message to user
      alert('Failed to load applications. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!selectedApplication) return

    try {
      const response = await fetch(`/api/admin/affiliate-applications/${selectedApplication.id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminNotes: adminNotes
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert(`Application approved! Verification code: ${data.data.verificationCode}`)
        setShowModal(false)
        setAdminNotes('')
        fetchApplications()
      } else {
        alert('Failed to approve application')
      }
    } catch (error) {
      console.error('Error approving application:', error)
      alert('Error approving application')
    }
  }

  const handleReject = async () => {
    if (!selectedApplication || !rejectionReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }

    try {
      const response = await fetch(`/api/admin/affiliate-applications/${selectedApplication.id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rejectionReason: rejectionReason
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Application rejected')
        setShowModal(false)
        setRejectionReason('')
        fetchApplications()
      } else {
        alert('Failed to reject application')
      }
    } catch (error) {
      console.error('Error rejecting application:', error)
      alert('Error rejecting application')
    }
  }

  const openModal = (application: AffiliateApplication, type: 'approve' | 'reject' | 'view') => {
    setSelectedApplication(application)
    setModalType(type)
    setShowModal(true)
    setAdminNotes('')
    setRejectionReason('')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Affiliate Program Management
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage affiliate applications, approvals, and partner accounts
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchApplications}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  All time applications
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {stats.pending}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Awaiting approval
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.approved}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Active partners
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rejected</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.rejected}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Not approved
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or platform..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="date">Sort by Date</option>
                  <option value="name">Sort by Name</option>
                  <option value="status">Sort by Status</option>
                </select>
              </div>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Platform
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Followers
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Applied
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Loading applications...
                    </div>
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="h-8 w-8 text-gray-400" />
                      No applications found
                      {searchQuery && (
                        <p className="text-sm">Try adjusting your search criteria</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                applications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {application.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {application.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {application.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {application.platform}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {application.followers}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                        {getStatusIcon(application.status)}
                        {application.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(application.application_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openModal(application, 'view')}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {application.status === 'pending' && (
                          <>
                            <button
                              onClick={() => openModal(application, 'approve')}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openModal(application, 'reject')}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-700 dark:text-slate-300">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {modalType === 'view' && 'Application Details'}
                  {modalType === 'approve' && 'Approve Application'}
                  {modalType === 'reject' && 'Reject Application'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {/* Application Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                    Personal Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-slate-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Name:</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {selectedApplication.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-slate-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Email:</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {selectedApplication.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-slate-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Phone:</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {selectedApplication.phone}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                    Social Media Profiles
                  </h3>
                  <div className="space-y-3">
                    {selectedApplication.instagram && (
                      <div className="flex items-center gap-3">
                        <Instagram className="h-4 w-4 text-pink-500" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">Instagram:</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {selectedApplication.instagram}
                        </span>
                      </div>
                    )}
                    {selectedApplication.youtube && (
                      <div className="flex items-center gap-3">
                        <Youtube className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">YouTube:</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {selectedApplication.youtube}
                        </span>
                      </div>
                    )}
                    {selectedApplication.facebook && (
                      <div className="flex items-center gap-3">
                        <Facebook className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">Facebook:</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {selectedApplication.facebook}
                        </span>
                      </div>
                    )}
                    {selectedApplication.snapchat && (
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">Snapchat:</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {selectedApplication.snapchat}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  Address
                </h3>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  <span className="text-sm text-slate-900 dark:text-slate-100">
                    {selectedApplication.house_number}, {selectedApplication.street}
                    {selectedApplication.building && `, ${selectedApplication.building}`}
                    {selectedApplication.apartment && `, ${selectedApplication.apartment}`}
                    <br />
                    {selectedApplication.road}, {selectedApplication.city}
                    <br />
                    {selectedApplication.pincode}, {selectedApplication.state}
                  </span>
                </div>
              </div>

              {/* Experience and Motivation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Experience
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
                    {selectedApplication.experience}
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Why Join Nefol?
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
                    {selectedApplication.why_join}
                  </p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Platform:</span>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {selectedApplication.platform}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Followers:</span>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {selectedApplication.followers}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Expected Sales:</span>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {selectedApplication.expected_sales}
                  </p>
                </div>
              </div>

              {/* Action Forms */}
              {modalType === 'approve' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="Add any notes for the affiliate partner..."
                  />
                </div>
              )}

              {modalType === 'reject' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="Please provide a reason for rejection..."
                    required
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                
                {modalType === 'approve' && (
                  <button
                    onClick={handleApprove}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Approve Application
                  </button>
                )}
                
                {modalType === 'reject' && (
                  <button
                    onClick={handleReject}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Reject Application
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
