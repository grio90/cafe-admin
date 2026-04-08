import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/api'
import type { MonthlyReport } from '@/types'
import { formatARS } from '@/utils/format'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const tabs = ['Mensual', 'Métodos de Pago', 'Top Productos']

const PIE_COLORS = ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b']
const PAYMENT_KEYS = [
  { key: 'CASH', label: 'Efectivo', color: '#22c55e' },
  { key: 'CREDIT_CARD', label: 'Tarjeta Crédito', color: '#3b82f6' },
  { key: 'DEBIT_CARD', label: 'Tarjeta Débito', color: '#8b5cf6' },
  { key: 'TRANSFER', label: 'Transferencia', color: '#f59e0b' },
]

export default function ReportsPage() {
  const [tab, setTab] = useState(0)

  const today = new Date()
  const firstOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  const todayStr = today.toISOString().split('T')[0]

  const [from, setFrom] = useState(firstOfMonth)
  const [to, setTo] = useState(todayStr)

  const { data: monthly = [] } = useQuery<MonthlyReport[]>({
    queryKey: ['reports', 'monthly'],
    queryFn: reportsApi.monthly,
  })

  const { data: paymentData } = useQuery({
    queryKey: ['reports', 'payment-methods', from, to],
    queryFn: () => reportsApi.paymentMethods({ from, to }),
    enabled: tab === 1,
  })

  const { data: topProducts = [] } = useQuery<{ product: { name: string }; totalRevenue: number; totalQuantity: number }[]>({
    queryKey: ['reports', 'top-products', from, to],
    queryFn: () => reportsApi.topProducts({ from, to }),
    enabled: tab === 2,
  })

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Reportes</h1>

      <div className="flex gap-1 bg-[#2a2a3e] p-1 rounded-xl w-fit">
        {tabs.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === i ? 'bg-indigo-600 text-white' : 'text-white/50 hover:text-white'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <div className="space-y-4">
          <div className="bg-[#2a2a3e] rounded-xl p-5">
            <h2 className="text-sm font-medium text-white/70 mb-4">Ventas últimos 12 meses</h2>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="monthLabel" tick={{ fill: '#ffffff50', fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fill: '#ffffff50', fontSize: 11 }} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: '#1e1e2e', border: '1px solid #ffffff20', borderRadius: 8 }}
                  formatter={(v: number) => [formatARS(v), '']} />
                <Legend formatter={(v) => <span style={{ color: '#ffffff80', fontSize: 12 }}>{v}</span>} />
                <Area type="monotone" dataKey="totalSales" name="Ventas" stroke="#6366f1" fill="url(#gSales)" />
                <Area type="monotone" dataKey="totalExpenses" name="Egresos" stroke="#ef4444" fill="url(#gExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="bg-[#2a2a3e] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/40 text-xs border-b border-white/10">
                    <th className="text-left px-4 py-3">Mes</th>
                    <th className="text-right px-4 py-3">Ventas</th>
                    <th className="text-right px-4 py-3">Egresos</th>
                    <th className="text-right px-4 py-3">Neto</th>
                    <th className="text-right px-4 py-3">Transacciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {monthly.map((m) => (
                    <tr key={`${m.year}-${m.month}`} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-white font-medium">{m.monthLabel}</td>
                      <td className="px-4 py-3 text-right text-green-400">{formatARS(m.totalSales)}</td>
                      <td className="px-4 py-3 text-right text-red-400">{formatARS(m.totalExpenses)}</td>
                      <td className="px-4 py-3 text-right text-indigo-300 font-medium">{formatARS(m.totalSales - m.totalExpenses)}</td>
                      <td className="px-4 py-3 text-right text-white/50">{m.transactionCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-white/50">Desde</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                className="bg-[#2a2a3e] border border-white/10 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-white/50">Hasta</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                className="bg-[#2a2a3e] border border-white/10 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
          </div>

          {paymentData && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-[#2a2a3e] rounded-xl p-5">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={PAYMENT_KEYS.map((k) => ({ name: k.label, value: paymentData[k.key] || 0, color: k.color }))}
                      cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                      {PAYMENT_KEYS.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e1e2e', border: '1px solid #ffffff20', borderRadius: 8 }}
                      formatter={(v: number) => [formatARS(v), '']} />
                    <Legend formatter={(v) => <span style={{ color: '#ffffff80', fontSize: 12 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-[#2a2a3e] rounded-xl p-5 space-y-3">
                <h2 className="text-sm font-medium text-white/70">Detalle</h2>
                {PAYMENT_KEYS.map((k) => {
                  const value = paymentData[k.key] || 0
                  const pct = paymentData.total > 0 ? ((value / paymentData.total) * 100).toFixed(1) : '0'
                  return (
                    <div key={k.key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white/70">{k.label}</span>
                        <span className="font-medium text-white">{formatARS(value)} <span className="text-white/40 text-xs">({pct}%)</span></span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: k.color }} />
                      </div>
                    </div>
                  )
                })}
                <div className="border-t border-white/10 pt-3 flex justify-between">
                  <span className="text-white/50 text-sm">Total</span>
                  <span className="font-bold text-white">{formatARS(paymentData.total || 0)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 2 && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-white/50">Desde</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                className="bg-[#2a2a3e] border border-white/10 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-white/50">Hasta</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                className="bg-[#2a2a3e] border border-white/10 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
          </div>

          <div className="bg-[#2a2a3e] rounded-xl p-5">
            <h2 className="text-sm font-medium text-white/70 mb-4">Top 10 Productos por Ingresos</h2>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={topProducts} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#ffffff50', fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="product.name" tick={{ fill: '#ffffff80', fontSize: 12 }} width={110} />
                <Tooltip contentStyle={{ background: '#1e1e2e', border: '1px solid #ffffff20', borderRadius: 8 }}
                  formatter={(v: number) => [formatARS(v), 'Ingresos']} />
                <Bar dataKey="totalRevenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
