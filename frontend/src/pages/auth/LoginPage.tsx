import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CoffeeIcon, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '@/api'
import { useAuthStore } from '@/store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { token, user } = await authApi.login(email, password)
      setAuth(token, user)
      navigate('/dashboard')
    } catch {
      toast.error('Email o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600/20 rounded-2xl mb-4">
            <CoffeeIcon size={32} className="text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Café Admin</h1>
          <p className="text-white/50 mt-1">Iniciá sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#2a2a3e] rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@cafe.com"
              required
              className="w-full bg-[#16162a] border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 placeholder-white/20"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1.5">Contraseña</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#16162a] border border-white/10 text-white rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:border-indigo-500 placeholder-white/20"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
