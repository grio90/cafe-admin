import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { CheckCircle, Clock, ChefHat, XCircle, AlertCircle } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'

const STATUS_CONFIG = {
  PENDING:   { icon: Clock,        label: 'Pedido recibido',       color: '#f59e0b', bg: '#fef3c7', desc: 'Tu pedido fue enviado a cocina' },
  CONFIRMED: { icon: CheckCircle,  label: 'Confirmado',            color: '#3b82f6', bg: '#dbeafe', desc: 'Cocina confirmó tu pedido' },
  PREPARING: { icon: ChefHat,      label: 'En preparación',        color: '#8b5cf6', bg: '#ede9fe', desc: 'Tu pedido está siendo preparado' },
  READY:     { icon: CheckCircle,  label: '¡Listo para entregar!', color: '#10b981', bg: '#d1fae5', desc: 'Tu pedido está listo, pronto llega' },
  DELIVERED: { icon: CheckCircle,  label: '¡Entregado!',           color: '#10b981', bg: '#d1fae5', desc: 'Que lo disfrutes 🎉' },
  CANCELLED: { icon: XCircle,      label: 'Cancelado',             color: '#ef4444', bg: '#fee2e2', desc: 'El pedido fue cancelado' },
}

export default function OrderStatusPage() {
  const { orderId, slug, result } = useParams<{ orderId: string; slug: string; result: string }>()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId) return
    const load = () => {
      axios.get(`${API}/orders/public/${orderId}`)
        .then(({ data }) => setOrder(data))
        .finally(() => setLoading(false))
    }
    load()
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [orderId])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
    </div>
  )

  if (!order) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Pedido no encontrado</p>
    </div>
  )

  const config = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.PENDING
  const Icon = config.icon

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-lg p-8 w-full max-w-sm text-center">
        {result === 'failure' ? (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={40} color="#ef4444" />
            </div>
            <h1 className="font-bold text-gray-900 text-xl mb-2">Pago no completado</h1>
            <p className="text-gray-500 text-sm">Podés intentarlo de nuevo</p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: config.bg }}>
              <Icon size={40} color={config.color} />
            </div>
            <h1 className="font-bold text-gray-900 text-xl mb-1">{config.label}</h1>
            <p className="text-gray-500 text-sm mb-6">{config.desc}</p>

            <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Mesa</span>
                <span className="font-semibold">{order.table?.number}</span>
              </div>
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.quantity}x {item.product?.name}</span>
                  <span className="font-medium">${(item.subtotal).toLocaleString('es-AR')}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span>${Number(order.total).toLocaleString('es-AR')}</span>
              </div>
            </div>

            {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
              <div className="flex items-center gap-2 text-xs text-gray-400 justify-center">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Actualizando en tiempo real
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
