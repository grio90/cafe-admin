import { useQuery } from '@tanstack/react-query'
import { cashRegisterApi } from '@/api'
import type { CashRegister } from '@/types'
import { formatARS, formatDate } from '@/utils/format'
import { CheckCircle, XCircle } from 'lucide-react'
import clsx from 'clsx'

export default function CashRegisterHistoryPage() {
  const { data: registers = [], isLoading } = useQuery<CashRegister[]>({
    queryKey: ['cash-register', 'history'],
    queryFn: () => cashRegisterApi.list(),
  })

  if (isLoading) return <div className="text-white/50">Cargando...</div>

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Historial de Cierres</h1>

      {registers.length === 0 ? (
        <p className="text-white/40 text-sm">Sin registros</p>
      ) : (
        <div className="space-y-2">
          {registers.map((reg) => {
            const isClosed = reg.status === 'CLOSED'
            return (
              <div key={reg.id} className="bg-[#2a2a3e] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {isClosed
                      ? <CheckCircle size={16} className="text-green-400" />
                      : <XCircle size={16} className="text-amber-400" />
                    }
                    <span className="font-medium text-white">{formatDate(reg.date)}</span>
                    <span className={clsx(
                      'text-xs px-2 py-0.5 rounded-full',
                      isClosed ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                    )}>
                      {isClosed ? 'Cerrada' : 'Abierta'}
                    </span>
                  </div>
                  <span className="font-bold text-green-400">{formatARS(reg.totalSales || '0')}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-[#16162a] rounded p-2">
                    <p className="text-white/40">Efectivo</p>
                    <p className="text-white font-medium">{formatARS(reg.totalSalesCash || '0')}</p>
                  </div>
                  <div className="bg-[#16162a] rounded p-2">
                    <p className="text-white/40">Tarjeta Cred.</p>
                    <p className="text-white font-medium">{formatARS(reg.totalSalesCreditCard || '0')}</p>
                  </div>
                  <div className="bg-[#16162a] rounded p-2">
                    <p className="text-white/40">Tarjeta Déb.</p>
                    <p className="text-white font-medium">{formatARS(reg.totalSalesDebitCard || '0')}</p>
                  </div>
                  <div className="bg-[#16162a] rounded p-2">
                    <p className="text-white/40">Transferencia</p>
                    <p className="text-white font-medium">{formatARS(reg.totalSalesTransfer || '0')}</p>
                  </div>
                </div>
                {isClosed && (
                  <div className="flex justify-between mt-2 text-xs text-white/40 pt-2 border-t border-white/5">
                    <span>Egresos: <span className="text-red-400">{formatARS(reg.totalExpenses || '0')}</span></span>
                    <span>Neto efectivo: <span className="text-indigo-300 font-medium">{formatARS(reg.netCash || '0')}</span></span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
