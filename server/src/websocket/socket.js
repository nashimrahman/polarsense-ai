import { Server } from 'socket.io'

export function createSocketServer(httpServer, corsOrigin) {
  return new Server(httpServer, { cors: { origin: corsOrigin } })
}