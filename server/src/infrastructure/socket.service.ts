import { Server as SocketServer } from 'socket.io'
import { Server as HttpServer } from 'http'
import jwt from 'jsonwebtoken'
import { config } from '../shared/config/index.js'

export class SocketService {
  private io: SocketServer | null = null
  private userSockets: Map<string, string[]> = new Map() // userId -> socketIds[]

  init(server: HttpServer) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5174',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      config.frontendUrl,
      'https://ecommerce-phi-five-35.vercel.app',
      ...(process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [])
    ].filter(Boolean)

    this.io = new SocketServer(server, {
      cors: {
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
      },
      transports: ['websocket', 'polling'],
      allowRequest: (req, callback) => {
        callback(null, true)
      }
    })

    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token
      if (!token) return next(new Error('Authentication error'))

      try {
        const decoded = jwt.verify(token, config.jwtSecret) as any
        socket.data.userId = decoded.id
        socket.data.role = decoded.role
        next()
      } catch (err) {
        next(new Error('Authentication error'))
      }
    })

    this.io.on('connection', (socket) => {
      const userId = socket.data.userId
      if (userId) {
        const sockets = this.userSockets.get(userId) || []
        this.userSockets.set(userId, [...sockets, socket.id])
        
        // Join a room for this user
        socket.join(`user:${userId}`)
        
        // Join admin room if applicable
        if (socket.data.role === 'ADMIN') {
          socket.join('admin')
        }
      }

      socket.on('disconnect', () => {
        if (userId) {
          const sockets = this.userSockets.get(userId) || []
          this.userSockets.set(userId, sockets.filter(id => id !== socket.id))
        }
      })
    })

    console.log('WebSocket service initialized')
  }

  emitToUser(userId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, data)
    }
  }

  emitToAdmin(event: string, data: any) {
    if (this.io) {
      this.io.to('admin').emit(event, data)
    }
  }

  emitToAll(event: string, data: any) {
    if (this.io) {
      this.io.emit(event, data)
    }
  }
}

export const socketService = new SocketService()
