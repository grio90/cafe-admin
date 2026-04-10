import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingCart, TrendingDown, Archive,
  BarChart3, Users, CoffeeIcon, History, BookOpen,
  QrCode, ClipboardList, ChefHat
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import clsx from 'clsx'

const cashierNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/orders', icon: ClipboardList, label: 'Pedidos QR' },
  { to: '/sales', icon: ShoppingCart, label: 'Nueva Venta' },
  { to: '/sales/history', icon: History, label: 'Historial Ventas' },
  { to: '/expenses', icon: TrendingDown, label: 'Egresos' },
  { to: '/cash-register', icon: Archive, label: 'Caja' },
  { to: '/cash-register/history', icon: BookOpen, label: 'Historial Caja' },
]

const adminNav = [
  { to: '/tables', icon: QrCode, label: 'Mesas / QR' },
  { to: '/products', icon: CoffeeIcon, label: 'Productos' },
  { to: '/reports', icon: BarChart3, label: 'Reportes' },
  { to: '/users', icon: Users, label: 'Usuarios' },
]

export default function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

  return (
    <aside className="w-56 flex flex-col bg-[#16162a] border-r border-white/10 h-full">
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <CoffeeIcon className="text-indigo-400" size={22} />
          <span className="font-bold text-lg text-white">Café Admin</span>
        </div>
        <p className="text-xs text-white/40 mt-1">{user?.name}</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {cashierNav.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}

        {isAdmin && (
          <>
            <div className="pt-3 pb-1 px-2">
              <span className="text-xs font-semibold text-white/30 uppercase tracking-wider">Admin</span>
            </div>
            {adminNav.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </>
        )}
      </nav>

      {/* Kitchen link */}
      <div className="px-2 py-3 border-t border-white/10">
        <a
          href="/kitchen"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-amber-400/80 hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
        >
          <ChefHat size={18} />
          Ver pantalla cocina
        </a>
      </div>
    </aside>
  )
}

function NavItem({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
          isActive
            ? 'bg-indigo-600/20 text-indigo-300 font-medium'
            : 'text-white/60 hover:text-white hover:bg-white/5'
        )
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  )
}
