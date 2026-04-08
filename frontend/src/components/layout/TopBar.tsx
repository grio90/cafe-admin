import { LogOut, CoffeeIcon } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'

export default function TopBar() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  function handleLogout() {
    clearAuth()
    navigate('/login')
  }

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-[#16162a] border-b border-white/10 md:bg-transparent md:border-0">
      {/* Mobile logo */}
      <div className="flex items-center gap-2 md:hidden">
        <CoffeeIcon className="text-indigo-400" size={20} />
        <span className="font-bold text-white">Café Admin</span>
      </div>
      <div className="hidden md:block" />

      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-white">{user?.name}</p>
          <p className="text-xs text-white/40">{user?.role === 'ADMIN' ? 'Administrador' : 'Cajero'}</p>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          title="Cerrar sesión"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
