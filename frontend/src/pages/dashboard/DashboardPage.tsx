import { useQuery } from '@tanstack/react-query'
import { cashRegisterApi, reportsApi } from '@/api'
import { CashRegister, MonthlyReport } from '@/types'
import { formatARS } from '@/utils/format'
import { TrendingUp, TrendingDown, ShoppingCart, Archive, AlertCircle } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { Link } from 'react-router-dom'

const PAYMENT_COLORS = {
  CASH: '#22c55e',
  CREDIT_CARD: '#3b82f6',
  DEBIT_CARD: '#8b5cf6',
  TRANSFER: '#f59e0b',
}

const PAYMENT_LABELS = {
  CASH: 'Efectivo',
  CREDIT_CARD: 'Tarjeta Crédito',
  DEBIT_CARD: 'Tarjeta Débito',
  TRANSFER: 'Transferencia',
}

export default function DashboardPage() {
  const { data: register } = useQuery<CashRegister | null>({
    queryKey: ['cash-register', 'today'],
    queryFn: cashRegisterApi.today,
    refetchInterval: 30_000,
  })

  const { data: monthly = [] } = useQuery<MonthlyReport[]>({
    queryKey: ['reports', 'monthly'],
    queryFn: reportsApi.monthly,
  })

  const todayLive = register?.liveTotals
  const last7 = monthly.slice(-7)

  const pieData = todayLive
    ? Object.entries(PAYMENT_LABELS).map(([key, name]) => ({
        name,
        value: todayLive[key as keyof typeof todayLive] as number,
        color: PAYMENT_COLORS[key as keyof typeof PAYMENT_COLORS],
      })).filter((d) => d.value > 0)
    : []

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Dashboard</h1>

      {/* Register status alert */}
      {!register && (
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl p-4">
          <AlertCircle size={20} />
          <span>No hay caja abierta hoy. <Link to="/cash-register" className="underline">Abrir caja</Link></span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Ventas hoy"
          value={formatARS(todayLive?.totalSales ?? 0)}
          icon={<ShoppingCart size={20} />}
          color="text-indigo-400"
          sub={`${todayLive?.transactionCount ?? 0} transacciones`}
        />
        <KpiCard
          label="Efectivo hoy"
          value={formatARS(todayLive?.CASH ?? 0)}
          icon={<TrendingUp size={20} />}
          color="text-green-400"
          sub="En caja"
        />
        <KpiCard
          label="Egresos hoy"
          value={formatARS(todayLive?.totalExpenses ?? 0)}
          icon={<TrendingDown size={20} />}
          color="text-red-400"
          sub="Pagos realizados"
        />
        <KpiCard
          label="Estado caja"
          value={register ? (register.status === 'OPEN' ? 'Abierta' : 'Cerrada') : 'Sin abrir'}
          icon={<Archive size={20} />}
          color={register?.status === 'OPEN' ? 'text-green-400' : 'text-white/40'}
          sub={register ? `Saldo neto: ${formatARS(todayLive?.netCash ?? 0)}` : ''}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Monthly trend */}
        <div className="bg-[#2a2a3e] rounded-xl p-4">
          <h2 className="text-sm font-medium text-white/70 mb-4">Tendencia 12 meses</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="monthLabel" tick={{ fill: '#ffffff50', fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: '#ffffff50', fontSize: 11 }} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#1e1e2e', border: '1px solid #ffffff20', borderRadius: 8 }}
                formatter={(v: number) => [formatARS(v), '']}
              />
              <Area type="monotone" dataKey="totalSales" name="Ventas" stroke="#6366f1" fill="url(#colorSales)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Payment method breakdown */}
        <div className="bg-[#2a2a3e] rounded-xl p-4">
          <h2 className="text-sm font-medium text-white/70 mb-4">Ventas de hoy por método</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e1e2e', border: '1px solid #ffffff20', borderRadius: 8 }}
                  formatter={(v: number) => [formatARS(v), '']}
                />
                <Legend formatter={(value) => <span style={{ color: '#ffffff80', fontSize: 12 }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-52 text-white/30 text-sm">
              Sin ventas registradas hoy
            </div>
          )}
        </div>
      </div>

      {/* Last 7 days bar */}
      {last7.length > 0 && (
        <div className="bg-[#2a2a3e] rounded-xl p-4">
          <h2 className="text-sm font-medium text-white/70 mb-4">Últimos meses — ventas vs egresos</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={last7} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="monthLabel" tick={{ fill: '#ffffff50', fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: '#ffffff50', fontSize: 11 }} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#1e1e2e', border: '1px solid #ffffff20', borderRadius: 8 }}
                formatter={(v: number) => [formatARS(v), '']}
              />
              <Bar dataKey="totalSales" name="Ventas" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="totalExpenses" name="Egresos" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function KpiCard({ label, value, icon, color, sub }: {
  label: string; value: string; icon: React.ReactNode; color: string; sub: string
}) {
  return (
    <div className="bg-[#2a2a3e] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-white/50">{label}</span>
        <span className={color}>{icon}</span>
      </div>
      <p className="text-lg font-bold text-white leading-tight">{value}</p>
      <p className="text-xs text-white/30 mt-1">{sub}</p>
    </div>
  )
}
