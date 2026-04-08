import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ShoppingCart, TrendingDown, Archive } from 'lucide-react'
import clsx from 'clsx'

const tabs = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/sales', icon: ShoppingCart, label: 'Venta' },
  { to: '/expenses', icon: TrendingDown, label: 'Egreso' },
  { to: '/cash-register', icon: Archive, label: 'Caja' },
]

export default function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#16162a] border-t border-white/10 z-50">
      <div className="flex">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end
            className={({ isActive }) =>
              clsx(
                'flex-1 flex flex-col items-center justify-center py-2 text-xs gap-1 transition-colors',
                isActive ? 'text-indigo-400' : 'text-white/40'
              )
            }
          >
            <tab.icon size={20} />
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
