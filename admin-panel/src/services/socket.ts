// Socket.IO client service for real-time updates
import { io, Socket } from 'socket.io-client'

class SocketService {
  private socket: Socket | null = null
  private listeners: Map<string, Function[]> = new Map()

  connect() {
    if (this.socket?.connected) return

    this.socket = io(`http://${window.location.hostname}:4000`, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    this.socket.on('connect', () => {
      console.log('Connected to server')
      // Join admin panel room
      this.socket?.emit('join-admin')
    })

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason)
    })

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })

    this.socket.on('update', (data) => {
      console.log('Received update:', data)
      this.notifyListeners(data.type, data.data)
    })

    this.socket.on('error', (error) => {
      console.error('Socket error:', error)
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  // Subscribe to specific update types
  subscribe(type: string, callback: Function) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, [])
    }
    this.listeners.get(type)?.push(callback)

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(type)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index > -1) {
          callbacks.splice(index, 1)
        }
      }
    }
  }

  // Notify all listeners for a specific type
  private notifyListeners(type: string, data: any) {
    const callbacks = this.listeners.get(type)
    if (callbacks) {
      callbacks.forEach(callback => callback(data))
    }
  }

  // Emit events to server
  emit(event: string, data?: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    }
  }

  // Get connection status
  isConnected(): boolean {
    return this.socket?.connected || false
  }
}

// Export singleton instance
export const socketService = new SocketService()
export default socketService


