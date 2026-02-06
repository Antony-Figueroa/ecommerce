import { useEffect, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { api, API_BASE } from '@/lib/api'

const SOCKET_URL = API_BASE.replace('/api', '')

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const token = api.getToken()
    if (!token) return

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket']
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Socket connected')
    })

    socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  const on = useCallback((event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback)
    }
  }, [])

  const off = useCallback((event: string, callback?: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback)
    }
  }, [])

  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data)
    }
  }, [])

  return { on, off, emit, socket: socketRef.current }
}
