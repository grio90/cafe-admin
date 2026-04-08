import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { expensesApi } from '@/api'
import type { Expense } from '@/types'
import { formatARS, formatDateTime } from '@/utils/format'
import { TrendingDown, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'

export default function ExpensesPage() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'ADMIN'

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ['expenses', 'today'],
    queryFn: () => {
      const today = new Date().toISOString().split('T')[0]
      return expensesApi.list({ from: today, to: today })
    },
    refetchInterval: 30_000,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description || !amount) return
    setLoading(true)
    try {
      await expensesApi.create({
        description,
        amount: parseFloat(amount),
        notes: notes || undefined,
      })
      setDescription('')
      setAmount('')
      setNotes('')
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['cash-register', 'today'] })
      toast.success('Egreso registrado')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg || 'Error al registrar el egreso')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este egreso?')) return
    try {
      await expensesApi.remove(id)
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['cash-register', 'today'] })
      toast.success('Egreso eliminado')
    } catch {
      toast.error('No se pudo eliminar el egreso')
    }
  }

  const totalToday = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Registrar Egreso</h1>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Form */}
        <div className="bg-[#2a2a3e] rounded-xl p-5">
          <h2 className="font-medium text-white mb-4 flex items-center gap-2">
            <TrendingDown size={18} className="text-red-400" />
            Nuevo Egreso
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs text-white/50 mb-1">Descripción *</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Compra de insumos"
                required
                className="w-full bg-[#16162a] border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 placeholder-white/20"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Monto (ARS) *</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min="0.01"
                step="0.01"
                required
                className="w-full bg-[#16162a] border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 placeholder-white/20"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Notas (opcional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalles adicionales"
                className="w-full bg-[#16162a] border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 placeholder-white/20"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl transition-colors"
            >
              {loading ? 'Registrando...' : 'Registrar Egreso'}
            </button>
          </form>
        </div>

        {/* Today's expenses */}
        <div className="bg-[#2a2a3e] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-white text-sm">Egresos de hoy</h2>
            <span className="text-red-400 font-bold">{formatARS(totalToday)}</span>
          </div>

          {expenses.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-6">Sin egresos registrados hoy</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
              {expenses.map((expense) => (
                <div key={expense.id} className="flex items-start gap-3 p-3 bg-[#16162a] rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{expense.description}</p>
                    {expense.notes && <p className="text-xs text-white/40 truncate">{expense.notes}</p>}
                    <p className="text-xs text-white/30 mt-0.5">{formatDateTime(expense.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-400 font-medium text-sm">{formatARS(expense.amount)}</span>
                    {isAdmin && (
                      <button onClick={() => handleDelete(expense.id)} className="text-white/20 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
