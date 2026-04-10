import 'dotenv/config'
import http from 'http'
import app from './app'
import { initSocket } from './shared/socket'

const PORT = parseInt(process.env.PORT || '3001')

const server = http.createServer(app)
initSocket(server)

server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
})
