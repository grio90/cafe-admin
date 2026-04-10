import { Server as HttpServer } from 'http'
import { Server as SocketServer } from 'socket.io'

let io: SocketServer

export function initSocket(server: HttpServer): SocketServer {
  io = new SocketServer(server, {
    cors: { origin: process.env.FRONTEND_URL || '*', credentials: true },
  })

  io.on('connection', (socket) => {
    // Staff joins their tenant room to receive order events
    socket.on('join:tenant', (tenantId: string) => {
      socket.join(`tenant:${tenantId}`)
    })

    socket.on('disconnect', () => {})
  })

  return io
}

export function getIO(): SocketServer {
  if (!io) throw new Error('Socket.io not initialized')
  return io
}
