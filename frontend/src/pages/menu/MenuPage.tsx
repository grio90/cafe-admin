'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { ShoppingCart, Plus, Minus, X, ChevronLeft, CheckCircle, Clock } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'
const MP_PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY || ''

interface Product { id: string; name: string; description?: string; price: number; imageUrl?: string }
interface Category { id: string; name: string; color: string; products: Product[] }
interface CartItem { product: Product; quantity: number; notes?: string }
interface Tenant { id: string; name: string; slug: string; logoUrl?: string; primaryColor: string }
interface Table { id: string; number: string; qrToken: string }

export default function MenuPage() {
  const { slug, qrToken } = useParams<{ slug: string; qrToken: string }>()
  const navigate = useNavigate()

  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [table, setTable] = useState<Table | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('')
  const [orderId, setOrderId] = useState<string | null>(null)
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    if (!slug || !qrToken) return
    axios.get(`${API}/menu/${slug}/table/${qrToken}`)
      .then(({ data }) => {
        setTenant(data.tenant)
        setTable(data.table)
        setCategories(data.categories)
        setActiveCategory(data.categories[0]?.id ?? '')
      })
      .catch(() => toast.error('Mesa no encontrada'))
      .finally(() => setLoading(false))
  }, [slug, qrToken])

  const addToCart = (product: Product) => {
    setCart(c => {
      const existing = c.find(i => i.product.id === product.id)
      if (existing) return c.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...c, { product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(c => {
      const existing = c.find(i => i.product.id === productId)
      if (!existing) return c
      if (existing.quantity === 1) return c.filter(i => i.product.id !== productId)
      return c.map(i => i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i)
    })
  }

  const getQty = (productId: string) => cart.find(i => i.product.id === productId)?.quantity ?? 0

  const total = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
  const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0)

  const handleOrder = async () => {
    if (cart.length === 0 || !table || !tenant) return
    setSubmitting(true)
    try {
      const { data: order } = await axios.post(`${API}/orders/public`, {
        tenantSlug: slug,
        tableQrToken: qrToken,
        items: cart.map(i => ({ productId: i.product.id, quantity: i.quantity })),
      })
      setOrderId(order.id)

      // Create MP preference and redirect to payment
      const { data: pref } = await axios.post(`${API}/payments/create-preference`, { orderId: order.id })
      if (pref.initPoint) {
        window.location.href = pref.initPoint
      } else {
        toast.success('¡Pedido enviado!')
        setCart([])
        setShowCart(false)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al procesar el pedido')
    } finally {
      setSubmitting(false)
    }
  }

  const scrollToCategory = (id: string) => {
    setActiveCategory(id)
    categoryRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Cargando menú...</p>
      </div>
    </div>
  )

  if (!tenant || !table) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <div className="text-5xl mb-4">😕</div>
        <p className="text-gray-600 font-medium">Mesa no encontrada</p>
        <p className="text-gray-400 text-sm mt-1">El QR puede estar desactivado</p>
      </div>
    </div>
  )

  const primary = tenant.primaryColor || '#0a1628'

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 shadow-sm" style={{ background: primary }}>
        <div className="px-4 py-3 flex items-center gap-3">
          {tenant.logoUrl && <img src={tenant.logoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />}
          <div className="flex-1">
            <p className="text-white font-bold text-sm leading-tight">{tenant.name}</p>
            <p className="text-white/60 text-xs">Mesa {table.number}</p>
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="relative bg-white/20 hover:bg-white/30 text-white p-2.5 rounded-xl transition-colors"
          >
            <ShoppingCart size={20} />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {itemCount}
              </span>
            )}
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => scrollToCategory(cat.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeCategory === cat.id ? 'bg-white text-gray-900' : 'bg-white/20 text-white'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products */}
      <div className="px-4 pt-4 space-y-8">
        {categories.map(cat => (
          <div key={cat.id} ref={el => categoryRefs.current[cat.id] = el}>
            <h2 className="font-bold text-gray-800 text-lg mb-3 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.color }} />
              {cat.name}
            </h2>
            <div className="space-y-3">
              {cat.products.map(product => {
                const qty = getQty(product.id)
                return (
                  <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex gap-3">
                    {product.imageUrl && (
                      <img src={product.imageUrl} alt={product.name}
                        className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{product.name}</p>
                      {product.description && (
                        <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{product.description}</p>
                      )}
                      <p className="font-bold text-gray-900 mt-1">
                        ${Number(product.price).toLocaleString('es-AR')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end justify-between flex-shrink-0">
                      {qty === 0 ? (
                        <button
                          onClick={() => addToCart(product)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
                          style={{ background: primary }}
                        >
                          <Plus size={18} />
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button onClick={() => removeFromCart(product.id)}
                            className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Minus size={15} color="#374151" />
                          </button>
                          <span className="font-bold text-gray-900 w-4 text-center text-sm">{qty}</span>
                          <button onClick={() => addToCart(product)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                            style={{ background: primary }}>
                            <Plus size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Fixed cart button */}
      {itemCount > 0 && !showCart && (
        <div className="fixed bottom-6 left-4 right-4 z-30">
          <button
            onClick={() => setShowCart(true)}
            className="w-full text-white font-bold py-4 rounded-2xl shadow-xl flex items-center justify-between px-5"
            style={{ background: primary }}
          >
            <span className="bg-white/20 px-2 py-0.5 rounded-lg text-sm">{itemCount}</span>
            <span>Ver pedido</span>
            <span>${total.toLocaleString('es-AR')}</span>
          </button>
        </div>
      )}

      {/* Cart drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCart(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">Tu pedido — Mesa {table.number}</h2>
              <button onClick={() => setShowCart(false)} className="p-2 rounded-xl bg-gray-100">
                <X size={18} color="#374151" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => removeFromCart(item.product.id)}
                      className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Minus size={14} color="#374151" />
                    </button>
                    <span className="font-bold w-5 text-center text-sm">{item.quantity}</span>
                    <button onClick={() => addToCart(item.product)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                      style={{ background: primary }}>
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-800">{item.product.name}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    ${(item.product.price * item.quantity).toLocaleString('es-AR')}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-5 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-xl text-gray-900">${total.toLocaleString('es-AR')}</span>
              </div>
              <button
                onClick={handleOrder}
                disabled={submitting}
                className="w-full text-white font-bold py-4 rounded-2xl text-base disabled:opacity-60"
                style={{ background: primary }}
              >
                {submitting ? 'Procesando...' : 'Pagar con Mercado Pago'}
              </button>
              <p className="text-center text-xs text-gray-400">
                Serás redirigido a Mercado Pago para completar el pago
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
