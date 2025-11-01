import React, { useEffect, useRef, useState } from 'react'
import { MessageSquare, Send, X } from 'lucide-react'
import { api } from '../services/api'
import { userSocketService } from '../services/socket'
import { useAuth } from '../contexts/AuthContext'

interface LiveChatMessage {
  id: string
  sender: 'customer' | 'agent'
  senderName?: string
  message: string
  timestamp: string
}

export default function LiveChatWidget() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [session, setSession] = useState<any>(null)
  const [messages, setMessages] = useState<LiveChatMessage[]>([])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement | null>(null)

  // Initialize or restore session once (even if widget is closed)
  useEffect(() => {
    let cancelled = false
    const initSession = async () => {
      try {
        // Try restore from storage
        const storedId = localStorage.getItem('live_chat_session_id')
        let s = storedId ? { id: storedId } as any : null
        if (!s) {
          s = await api.liveChat.createSession({ userId: user?.id?.toString(), customerName: user?.name, customerEmail: user?.email })
          localStorage.setItem('live_chat_session_id', String(s.id))
        }
        if (cancelled) return
        setSession(s)
        // Join session room
        userSocketService.emit('live-chat:join-session', { sessionId: s.id })
        // Load existing messages
        const msgs = await api.liveChat.getMessages(s.id)
        if (cancelled) return
        const mapped = Array.isArray(msgs) ? msgs.map((m: any) => ({
          id: String(m.id),
          sender: m.sender,
          senderName: m.sender_name,
          message: m.message,
          timestamp: m.created_at
        })) : []
        const uniqueById = Array.from(new Map(mapped.map((m: any) => [m.id, m])).values())
        setMessages(uniqueById)
      } catch (e) {
        console.error('Live chat init failed', e)
      }
    }
    initSession()
    return () => { cancelled = true }
  }, [user?.id])

  // Subscribe to socket events when session is ready (even if widget is closed)
  useEffect(() => {
    if (!session?.id) return
    const unsubMsg = userSocketService.subscribe('live-chat:message', (data: any) => {
      if (data?.session_id?.toString() === session.id.toString()) {
        const incoming = {
          id: String(data.id),
          sender: data.sender,
          senderName: data.sender_name,
          message: data.message,
          timestamp: data.created_at
        }
        setMessages(prev => {
          if (prev.some(m => m.id === incoming.id)) return prev
          return [...prev, incoming]
        })
      }
    })
    const unsubTyping = userSocketService.subscribe('live-chat:typing', () => {})
    return () => {
      unsubMsg()
      unsubTyping()
    }
  }, [session?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || !session) return
    try {
      // Clear input immediately for snappy UX and stop typing
      setInput('')
      userSocketService.emit('live-chat:typing', { sessionId: session.id, sender: 'customer', isTyping: false })

      // Create on server and append immediately on success
      const created = await api.liveChat.sendMessage({ sessionId: session.id, sender: 'customer', senderName: user?.name, message: text, type: 'text' })
      const newMsg = {
        id: String(created?.id || `temp-${Date.now()}`),
        sender: 'customer' as const,
        senderName: user?.name,
        message: text,
        timestamp: created?.created_at || new Date().toISOString()
      }
      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev
        return [...prev, newMsg]
      })
    } catch (e) {
      console.error('Send failed', e)
      // Restore text on failure
      setInput(text)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-blue-600 text-white shadow-lg"
        aria-label="Open live chat"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col overflow-hidden">
      <div className="px-4 py-3 bg-blue-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <span className="font-semibold">Support</span>
        </div>
        <button onClick={() => setOpen(false)} aria-label="Close" className="p-1 hover:bg-blue-500 rounded">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-3 h-64 overflow-y-auto space-y-2">
        {messages.map((m) => (
          <div key={`${m.id}-${m.timestamp || ''}`} className={`flex ${m.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
            <div className={`${m.sender === 'customer' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'} px-3 py-2 rounded-lg max-w-[80%]`}>
              <div className="text-sm">{m.message}</div>
              <div className={`${m.sender === 'customer' ? 'text-blue-100' : 'text-gray-500'} text-[10px] mt-1`}>{new Date(m.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t border-gray-200 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            if (session) userSocketService.emit('live-chat:typing', { sessionId: session.id, sender: 'customer', isTyping: e.target.value.length > 0 })
          }}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
          className="flex-1 border border-gray-300 rounded px-2 py-1"
        />
        <button onClick={sendMessage} className="p-2 bg-blue-600 text-white rounded" aria-label="Send">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}


