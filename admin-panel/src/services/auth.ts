// Authentication service for admin panel
import apiService from './api'

interface User {
  id: number
  email: string
  name: string
  role: string
  permissions: string[]
}

interface LoginCredentials {
  email: string
  password: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

class AuthService {
  private authState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true, // Start with loading true
    error: null
  }

  private listeners: Set<(state: AuthState) => void> = new Set()

  constructor() {
    // Initialize auth state from localStorage on service creation
    this.initializeFromStorage()
  }

  // Initialize auth state from localStorage
  private initializeFromStorage() {
    try {
      const token = localStorage.getItem('auth_token')
      const userStr = localStorage.getItem('user')

      if (token && userStr) {
        const user = JSON.parse(userStr)
        this.authState = {
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        }
      } else {
        // Initialize empty state for production
        this.initializeEmptyState()
      }
    } catch (error) {
      console.error('Failed to initialize auth from storage:', error)
      this.authState = {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Failed to restore authentication'
      }
    }
  }

  // Initialize empty state for production
  private initializeEmptyState() {
    this.authState = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    }
  }

  // Subscribe to auth state changes
  subscribe(listener: (state: AuthState) => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  // Notify all listeners of state changes
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.authState))
  }

  // Update auth state
  private setAuthState(updates: Partial<AuthState>) {
    this.authState = { ...this.authState, ...updates }
    this.notifyListeners()
  }

  // Get current auth state
  getAuthState(): AuthState {
    return { ...this.authState }
  }

  // Login user
  async login(credentials: LoginCredentials): Promise<boolean> {
    try {
      this.setAuthState({ isLoading: true, error: null })

      // In a real app, you would call your authentication API
      // For now, we'll simulate a successful login
      const mockUser: User = {
        id: 1,
        email: credentials.email,
        name: 'Admin User',
        role: 'admin',
        permissions: ['read', 'write', 'delete', 'manage']
      }

      // Store token in localStorage (in real app, handle this securely)
      localStorage.setItem('auth_token', 'mock_jwt_token')
      localStorage.setItem('user', JSON.stringify(mockUser))

      this.setAuthState({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        error: null
      })

      return true
    } catch (error) {
      this.setAuthState({
        isLoading: false,
        error: 'Login failed. Please check your credentials.'
      })
      return false
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      // Clear stored data
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')

      this.setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Check if user is authenticated
  async checkAuth(): Promise<boolean> {
    try {
      this.setAuthState({ isLoading: true })
      
      const token = localStorage.getItem('auth_token')
      const userStr = localStorage.getItem('user')

      if (!token || !userStr) {
        this.setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        })
        return false
      }

      const user = JSON.parse(userStr)
      
      // Validate token format (basic check)
      if (token === 'mock_jwt_token' && user.id) {
        this.setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        })
        return true
      } else {
        // Invalid token, clear storage
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
        this.setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        })
        return false
      }
    } catch (error) {
      console.error('Auth check error:', error)
      // Clear invalid data
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      this.setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Authentication check failed'
      })
      return false
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.authState.user
  }

  // Check if user has permission
  hasPermission(permission: string): boolean {
    if (!this.authState.user) return false
    return this.authState.user.permissions.includes(permission)
  }

  // Check if user has role
  hasRole(role: string): boolean {
    if (!this.authState.user) return false
    return this.authState.user.role === role
  }

  // Update user profile
  async updateProfile(updates: Partial<User>): Promise<boolean> {
    try {
      if (!this.authState.user) return false

      const updatedUser = { ...this.authState.user, ...updates }
      
      // Store updated user data
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
      this.setAuthState({ user: updatedUser })
      return true
    } catch (error) {
      console.error('Profile update error:', error)
      return false
    }
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      // In a real app, you would call your API to change password
      console.log('Changing password...')
      return true
    } catch (error) {
      console.error('Password change error:', error)
      return false
    }
  }
}

// Create and export a singleton instance
export const authService = new AuthService()
export default authService
