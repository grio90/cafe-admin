import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/store/authStore'
import axios from 'axios'
import { Clock, ChefHat, CheckCircle, Bell } from 'lucide-react'
import toast from 'react-hot-toast'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Nuevo', CONFIRMED: 'Confirmado', PREPARING: 'Preparando', READY: 'Listo'
}
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 border-yellow-300', CONFIRMED: 'bg-blue-100 border-blue-300',
  PREPARING: 'bg-purple-100 border-purple-300', READY: 'bg-green-100 border-green-300',
}
const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-yellow-500', CONFIRMED: 'bg-blue-500', PREPARING: 'bg-purple-500', READY: 'bg-green-500',
}

const NEXT_STATUS: Record<string, string> = {
  PENDING: 'CONFIRMED', CONFIRMED: 'PREPARING', PREPARING: 'READY', READY: 'DELIVERED'
}
const NEXT_LABEL: Record<string, string> = {
  PENDING: 'Confirmar', CONFIRMED: 'Preparando', PREPARING: 'Listo', READY: 'Entregar'
}

export default function KitchenPage() {
  const { token, user } = useAuthStore()
  const [orders, setOrders] = useState<any[]>([])
  const [socket, setSocket] = useState<Socket | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrders()
    const s = io(SOCKET_URL, { auth: { token } })
    s.on('connect', () => {
      if (user?.tenantId) s.emit('join:tenant', user.tenantId)
    })
    s.on('order:new', (order: any) => {
      setOrders(prev => [order, ...prev])
      toast('¡Nuevo pedido — Mesa ' + order.table?.number + '!', { icon: '🔔', duration: 5000 })
      try { new Audio('/notification.mp3').play() } catch {}
    })
    s.on('order:updated', (updated: any) => {
      setOrders(prev => {
        if (updated.status === 'DELIVERED' || updated.status === 'CANCELLED') {
          return prev.filter(o => o.id !== updated.id)
        }
        return prev.map(o => o.id === updated.id ? updated : o)
      })
    })
    s.on('order:paid', (updated: any) => {
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o))
      toast.success('Pedido pagado — Mesa ' + updated.table?.number)
    })
    setSocket(s)
    return () => { s.disconnect() }
  }, [])

  const loadOrders = async () => {
    try {
      const { data } = await axios.get(`${API}/orders?status=PENDING,CONFIRMED,PREPARING,READY`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setOrders(data)
    } finally { setLoading(false) }
  }

  const advance = async (order: any) => {
    const next = NEXT_STATUS[order.status]
    if (!next) return
    try {
      await axios.patch(`${API}/orders/${order.id}/status`, { status: next }, {
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch {
      toast.error('Error al actualizar')
    }
  }

  const elapsed = (createdAt: string) => {
    const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
    return mins < 1 ? 'ahora' : `${mins}m`
  }

  const activeOrders = orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status))

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-3">
          <ChefHat size={24} color="#f59e0b" />
          <div>
            <h1 className="font-bold text-lg">Cocina</h1>
            <p className="text-gray-400 text-xs">{activeOrders.length} pedidos activos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${socket?.connected ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-400">{socket?.connected ? 'Conectado' : 'Sin conexión'}</span>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-gray-600 border-t-yellow-400 rounded-full animate-spin" />
        </div>
      ) : activeOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <CheckCircle size={48} className="mb-3 text-green-500 opacity-50" />
          <p className="text-lg font-medium">Sin pedidos pendientes</p>
          <p className="text-sm mt-1">Los nuevos pedidos aparecerán aquí automáticamente</p>
        </div>
      ) : (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {activeOrders.map(order => (
            <div key={order.id}
              className={`rounded-2xl border-2 p-4 ${STATUS_COLORS[order.status] ?? 'bg-gray-100 border-gray-300'}`}>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-bold text-gray-900 text-lg">Mesa {order.table?.number}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-white text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                    {order.paymentStatus === 'PAID' && (
                      <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                        Pagado
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-gray-500 text-xs">
                  <Clock size={12} />
                  {elapsed(order.createdAt)}
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1.5 mb-4">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex gap-2 text-gray-800">
                    <span className="font-bold text-base w-6 flex-shrink-0">{item.quantity}x</span>
                    <div>
                      <p className="font-medium text-sm leading-tight">{item.product?.name}</p>
                      {item.notes && <p className="text-xs text-gray-500 italic">{item.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>

              {order.notes && (
                <div className="bg-white/60 rounded-xl p-2 mb-3 text-xs text-gray-700 italic">
                  📝 {order.notes}
                </div>
              )}

              {/* Action button */}
              {NEXT_STATUS[order.status] && (
                <button
                  onClick={() => advance(order)}
                  className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-transform active:scale-95"
                  style={{ background: '#1f2937' }}
                >
                  {NEXT_LABEL[order.status]}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
