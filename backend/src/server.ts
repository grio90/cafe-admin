import 'dotenv/config'
import app from './app'

const PORT = parseInt(process.env.PORT || '3001')

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
})
