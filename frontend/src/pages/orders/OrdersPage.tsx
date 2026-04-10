import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/store/authStore'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Clock, CheckCircle, ChefHat, XCircle, Bell } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:   { label: 'Pendiente',   color: '#d97706', bg: '#fef3c7' },
  CONFIRMED: { label: 'Confirmado',  color: '#2563eb', bg: '#dbeafe' },
  PREPARING: { label: 'Preparando',  color: '#7c3aed', bg: '#ede9fe' },
  READY:     { label: 'Listo',       color: '#059669', bg: '#d1fae5' },
  DELIVERED: { label: 'Entregado',   color: '#6b7280', bg: '#f3f4f6' },
  CANCELLED: { label: 'Cancelado',   color: '#dc2626', bg: '#fee2e2' },
}

const PAY_CONFIG: Record<string, { label: string; color: string }> = {
  UNPAID:     { label: 'Sin pagar',  color: '#ef4444' },
  PROCESSING: { label: 'Procesando', color: '#f59e0b' },
  PAID:       { label: 'Pagado',     color: '#10b981' },
  FAILED:     { label: 'Fallido',    color: '#dc2626' },
}

export default function OrdersPage() {
  const { token, user } = useAuthStore()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('active')
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    loadOrders()
    const s = io(SOCKET_URL, { auth: { token } })
    s.on('connect', () => { if (user?.tenantId) s.emit('join:tenant', user.tenantId) })
    s.on('order:new', (order: any) => {
      setOrders(prev => [order, ...prev])
      toast('¡Nuevo pedido — Mesa ' + order.table?.number + '!', { icon: '🔔' })
    })
    s.on('order:updated', (updated: any) => {
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o))
    })
    s.on('order:paid', (updated: any) => {
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o))
      toast.success('Pago confirmado — Mesa ' + updated.table?.number)
    })
    setSocket(s)
    return () => { s.disconnect() }
  }, [])

  const loadOrders = async () => {
    try {
      const { data } = await axios.get(`${API}/orders`, { headers: { Authorization: `Bearer ${token}` } })
      setOrders(data)
    } finally { setLoading(false) }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      await axios.patch(`${API}/orders/${id}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } })
    } catch { toast.error('Error al actualizar') }
  }

  const filtered = orders.filter(o => {
    if (filterStatus === 'active') return !['DELIVERED', 'CANCELLED'].includes(o.status)
    if (filterStatus === 'done') return ['DELIVERED', 'CANCELLED'].includes(o.status)
    return true
  })

  const elapsed = (d: string) => {
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
    return m < 1 ? 'ahora' : `${m}m`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pedidos</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <div className={`w-2 h-2 rounded-full ${socket?.connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            <p className="text-xs text-gray-400">{socket?.connected ? 'En tiempo real' : 'Sin conexión'}</p>
          </div>
        </div>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          {[['active', 'Activos'], ['done', 'Finalizados'], ['all', 'Todos']].map(([val, lbl]) => (
            <button key={val} onClick={() => setFilterStatus(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterStatus === val ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <CheckCircle size={40} className="mx-auto mb-3 opacity-30" />
          <p>No hay pedidos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const sc = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING
            const pc = PAY_CONFIG[order.paymentStatus] ?? PAY_CONFIG.UNPAID
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-gray-900">Mesa {order.table?.number}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: sc.bg, color: sc.color }}>
                        {sc.label}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium border"
                        style={{ color: pc.color, borderColor: pc.color + '40' }}>
                        {pc.label}
                      </span>
                      <span className="text-xs text-gray-400 ml-auto flex items-center gap-1">
                        <Clock size={11} /> {elapsed(order.createdAt)}
                      </span>
                    </div>

                    <div className="space-y-0.5 mb-3">
                      {order.items?.map((item: any) => (
                        <p key={item.id} className="text-sm text-gray-600">
                          <span className="font-semibold">{item.quantity}x</span> {item.product?.name}
                          {item.notes && <span className="text-gray-400 italic ml-1">— {item.notes}</span>}
                        </p>
                      ))}
                    </div>

                    <p className="font-bold text-gray-900">${Number(order.total).toLocaleString('es-AR')}</p>
                  </div>

                  {!['DELIVERED', 'CANCELLED'].includes(order.status) && (
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      {order.status !== 'READY' && (
                        <select
                          value={order.status}
                          onChange={e => updateStatus(order.id, e.target.value)}
                          className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                        >
                          {['PENDING','CONFIRMED','PREPARING','READY'].map(s => (
                            <option key={s} value={s}>{STATUS_CONFIG[s]?.label}</option>
                          ))}
                        </select>
                      )}
                      {order.status === 'READY' && (
                        <button onClick={() => updateStatus(order.id, 'DELIVERED')}
                          className="bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg font-semibold">
                          Entregar
                        </button>
                      )}
                      <button onClick={() => updateStatus(order.id, 'CANCELLED')}
                        className="text-red-500 text-xs px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50">
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
