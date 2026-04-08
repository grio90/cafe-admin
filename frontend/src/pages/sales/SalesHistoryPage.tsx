import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { salesApi } from '@/api'
import type { Sale } from '@/types'
import { formatARS, formatDateTime, PAYMENT_LABELS, PAYMENT_COLORS } from '@/utils/format'
import { Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import clsx from 'clsx'

export default function SalesHistoryPage() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'ADMIN'

  const today = new Date().toISOString().split('T')[0]
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)

  const { data: sales = [], isLoading } = useQuery<Sale[]>({
    queryKey: ['sales', from, to],
    queryFn: () => salesApi.list({ from, to }),
  })

  const total = sales.reduce((sum, s) => sum + parseFloat(s.total), 0)

  async function handleVoid(id: string) {
    if (!confirm('¿Anular esta venta?')) return
    try {
      await salesApi.void(id)
      qc.invalidateQueries({ queryKey: ['sales'] })
      toast.success('Venta anulada')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg || 'No se pudo anular')
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Historial de Ventas</h1>

      <div className="flex flex-wrap gap-3 items-center">
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
        <span className="text-sm text-white/50">{sales.length} ventas — <span className="text-green-400 font-medium">{formatARS(total)}</span></span>
      </div>

      {isLoading ? (
        <div className="text-white/50 text-sm">Cargando...</div>
      ) : sales.length === 0 ? (
        <p className="text-white/40 text-sm">Sin ventas en el período</p>
      ) : (
        <div className="space-y-2">
          {sales.map((sale) => (
            <div key={sale.id} className="bg-[#2a2a3e] rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={clsx('text-xs px-2 py-0.5 rounded-full', PAYMENT_COLORS[sale.paymentMethod])}>
                      {PAYMENT_LABELS[sale.paymentMethod]}
                    </span>
                    <span className="text-xs text-white/40">{formatDateTime(sale.createdAt)}</span>
                    <span className="text-xs text-white/30">por {sale.user.name}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {sale.items.map((item) => (
                      <span key={item.id} className="text-xs bg-[#16162a] text-white/70 px-2 py-0.5 rounded">
                        {item.quantity}x {item.product.name}
                      </span>
                    ))}
                  </div>
                  {sale.notes && <p className="text-xs text-white/40 mt-1 italic">{sale.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{formatARS(sale.total)}</span>
                  {isAdmin && (
                    <button onClick={() => handleVoid(sale.id)} className="text-white/20 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
