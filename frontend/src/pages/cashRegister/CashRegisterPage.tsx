import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { cashRegisterApi } from '@/api'
import type { CashRegister } from '@/types'
import { formatARS, formatDateTime, PAYMENT_LABELS } from '@/utils/format'
import { Archive, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function CashRegisterPage() {
  const qc = useQueryClient()
  const [openingAmount, setOpeningAmount] = useState('0')
  const [closingNotes, setClosingNotes] = useState('')
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [loadingOpen, setLoadingOpen] = useState(false)
  const [loadingClose, setLoadingClose] = useState(false)

  const { data: register, isLoading } = useQuery<CashRegister | null>({
    queryKey: ['cash-register', 'today'],
    queryFn: cashRegisterApi.today,
    refetchInterval: 30_000,
  })

  async function handleOpen() {
    setLoadingOpen(true)
    try {
      await cashRegisterApi.open(parseFloat(openingAmount) || 0)
      qc.invalidateQueries({ queryKey: ['cash-register', 'today'] })
      toast.success('Caja abierta')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg || 'Error al abrir caja')
    } finally {
      setLoadingOpen(false)
    }
  }

  async function handleClose() {
    if (!register) return
    setLoadingClose(true)
    try {
      await cashRegisterApi.close(register.id, closingNotes || undefined)
      qc.invalidateQueries({ queryKey: ['cash-register'] })
      setShowCloseModal(false)
      toast.success('Caja cerrada')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg || 'Error al cerrar caja')
    } finally {
      setLoadingClose(false)
    }
  }

  if (isLoading) return <div className="text-white/50 text-sm">Cargando...</div>

  // No register today
  if (!register) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-white">Caja</h1>
        <div className="max-w-sm">
          <div className="bg-[#2a2a3e] rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <XCircle size={24} className="text-amber-400" />
              <div>
                <p className="font-medium text-white">Sin caja abierta</p>
                <p className="text-xs text-white/40">No hay caja abierta para hoy</p>
              </div>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Monto inicial en efectivo (ARS)</label>
              <input
                type="number"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                min="0"
                className="w-full bg-[#16162a] border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={handleOpen}
              disabled={loadingOpen}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl transition-colors"
            >
              {loadingOpen ? 'Abriendo...' : 'Abrir Caja'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const live = register.liveTotals
  const isClosed = register.status === 'CLOSED'

  const totals = isClosed
    ? {
        CASH: parseFloat(register.totalSalesCash || '0'),
        CREDIT_CARD: parseFloat(register.totalSalesCreditCard || '0'),
        DEBIT_CARD: parseFloat(register.totalSalesDebitCard || '0'),
        TRANSFER: parseFloat(register.totalSalesTransfer || '0'),
        totalSales: parseFloat(register.totalSales || '0'),
        totalExpenses: parseFloat(register.totalExpenses || '0'),
        netCash: parseFloat(register.netCash || '0'),
        transactionCount: 0,
      }
    : live

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Caja</h1>
        <span className={clsx(
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium',
          isClosed ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
        )}>
          <span className={clsx('w-1.5 h-1.5 rounded-full', isClosed ? 'bg-red-400' : 'bg-green-400')} />
          {isClosed ? 'Cerrada' : 'Abierta'}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Summary */}
        <div className="bg-[#2a2a3e] rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm text-white/50">
            <Archive size={16} />
            <span>{new Date(register.date).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#16162a] rounded-lg p-3">
              <p className="text-xs text-white/40">Apertura</p>
              <p className="font-bold text-white">{formatARS(register.openingCashAmount)}</p>
            </div>
            <div className="bg-[#16162a] rounded-lg p-3">
              <p className="text-xs text-white/40">Total ventas</p>
              <p className="font-bold text-green-400">{formatARS(totals?.totalSales ?? 0)}</p>
            </div>
            <div className="bg-[#16162a] rounded-lg p-3">
              <p className="text-xs text-white/40">Total egresos</p>
              <p className="font-bold text-red-400">{formatARS(totals?.totalExpenses ?? 0)}</p>
            </div>
            <div className="bg-[#16162a] rounded-lg p-3">
              <p className="text-xs text-white/40">Efectivo neto</p>
              <p className="font-bold text-indigo-300">{formatARS(totals?.netCash ?? 0)}</p>
            </div>
          </div>

          {isClosed && register.closedAt && (
            <div className="border-t border-white/10 pt-3 text-xs text-white/40">
              Cerrada: {formatDateTime(register.closedAt)}
              {register.closingNotes && <p className="mt-1 italic">"{register.closingNotes}"</p>}
            </div>
          )}
        </div>

        {/* Payment breakdown */}
        <div className="bg-[#2a2a3e] rounded-xl p-5">
          <h2 className="text-sm font-medium text-white mb-3">Desglose por método de pago</h2>
          <div className="space-y-2">
            {(Object.keys(PAYMENT_LABELS) as (keyof typeof PAYMENT_LABELS)[]).map((method) => (
              <div key={method} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-sm text-white/70">{PAYMENT_LABELS[method]}</span>
                <span className="font-medium text-white">{formatARS(totals?.[method] ?? 0)}</span>
              </div>
            ))}
          </div>

          {!isClosed && (
            <button
              onClick={() => setShowCloseModal(true)}
              className="mt-4 w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl transition-colors"
            >
              Cerrar Caja
            </button>
          )}

          {isClosed && (
            <div className="mt-4 flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle size={16} />
              <span>Caja cerrada correctamente</span>
            </div>
          )}
        </div>
      </div>

      {/* Close modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#2a2a3e] rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-white">Cerrar Caja</h2>
            <p className="text-sm text-white/60">Confirmá el cierre de caja. Esta acción no se puede deshacer.</p>

            <div className="bg-[#16162a] rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Total ventas</span>
                <span className="text-green-400 font-bold">{formatARS(live?.totalSales ?? 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Total egresos</span>
                <span className="text-red-400 font-bold">{formatARS(live?.totalExpenses ?? 0)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-white/10 pt-2">
                <span className="text-white font-medium">Efectivo neto</span>
                <span className="text-indigo-300 font-bold">{formatARS(live?.netCash ?? 0)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs text-white/50 mb-1">Notas de cierre (opcional)</label>
              <input
                type="text"
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                placeholder="Observaciones del cierre"
                className="w-full bg-[#16162a] border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 placeholder-white/20"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseModal(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleClose}
                disabled={loadingClose}
                className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl transition-colors"
              >
                {loadingClose ? 'Cerrando...' : 'Confirmar Cierre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
