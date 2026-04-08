import { useState, useReducer } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { productsApi, salesApi } from '@/api'
import type { Product, CartItem, PaymentMethod } from '@/types'
import { formatARS, PAYMENT_LABELS, PAYMENT_COLORS } from '@/utils/format'
import { Plus, Minus, Trash2, ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

type CartAction =
  | { type: 'ADD'; product: Product }
  | { type: 'INC'; productId: string }
  | { type: 'DEC'; productId: string }
  | { type: 'REMOVE'; productId: string }
  | { type: 'CLEAR' }

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'ADD': {
      const existing = state.find((i) => i.product.id === action.product.id)
      if (existing) return state.map((i) => i.product.id === action.product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...state, { product: action.product, quantity: 1 }]
    }
    case 'INC':
      return state.map((i) => i.product.id === action.productId ? { ...i, quantity: i.quantity + 1 } : i)
    case 'DEC':
      return state
        .map((i) => i.product.id === action.productId ? { ...i, quantity: i.quantity - 1 } : i)
        .filter((i) => i.quantity > 0)
    case 'REMOVE':
      return state.filter((i) => i.product.id !== action.productId)
    case 'CLEAR':
      return []
    default:
      return state
  }
}

export default function SalesPage() {
  const qc = useQueryClient()
  const [cart, dispatch] = useReducer(cartReducer, [])
  const [payment, setPayment] = useState<PaymentMethod>('CASH')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => productsApi.list(true),
  })

  const categories = Array.from(new Set(products.map((p) => p.category.name)))
  const filtered = selectedCategory
    ? products.filter((p) => p.category.name === selectedCategory)
    : products

  const total = cart.reduce((sum, i) => sum + parseFloat(i.product.price) * i.quantity, 0)
  const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0)

  async function handleConfirm() {
    if (cart.length === 0) return toast.error('Agregá al menos un producto')
    setLoading(true)
    try {
      await salesApi.create({
        paymentMethod: payment,
        notes: notes || undefined,
        items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      })
      dispatch({ type: 'CLEAR' })
      setNotes('')
      setShowCart(false)
      qc.invalidateQueries({ queryKey: ['cash-register', 'today'] })
      toast.success('¡Venta registrada!')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg || 'Error al registrar la venta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Nueva Venta</h1>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <button
          onClick={() => setSelectedCategory(null)}
          className={clsx(
            'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
            !selectedCategory ? 'bg-indigo-600 text-white' : 'bg-white/10 text-white/60 hover:text-white'
          )}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
            className={clsx(
              'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              selectedCategory === cat ? 'bg-indigo-600 text-white' : 'bg-white/10 text-white/60 hover:text-white'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Product grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {filtered.map((product) => {
            const inCart = cart.find((i) => i.product.id === product.id)
            return (
              <button
                key={product.id}
                onClick={() => dispatch({ type: 'ADD', product })}
                className={clsx(
                  'relative bg-[#2a2a3e] hover:bg-[#333350] rounded-xl p-3 text-left transition-all border',
                  inCart ? 'border-indigo-500/50' : 'border-transparent'
                )}
              >
                {inCart && (
                  <span className="absolute top-2 right-2 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {inCart.quantity}
                  </span>
                )}
                <div
                  className="inline-block w-2 h-2 rounded-full mb-2"
                  style={{ backgroundColor: product.category.color }}
                />
                <p className="text-sm font-medium text-white leading-tight">{product.name}</p>
                <p className="text-xs text-indigo-300 mt-1 font-medium">{formatARS(product.price)}</p>
              </button>
            )
          })}
        </div>

        {/* Cart panel (desktop inline, mobile collapsible) */}
        <div className="hidden md:flex flex-col bg-[#2a2a3e] rounded-xl p-4 h-fit">
          <CartPanel
            cart={cart}
            dispatch={dispatch}
            payment={payment}
            setPayment={setPayment}
            notes={notes}
            setNotes={setNotes}
            total={total}
            loading={loading}
            onConfirm={handleConfirm}
          />
        </div>
      </div>

      {/* Mobile cart toggle */}
      <div className="md:hidden">
        <button
          onClick={() => setShowCart(!showCart)}
          className="w-full flex items-center justify-between bg-[#2a2a3e] rounded-xl p-4"
        >
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-indigo-400" />
            <span className="text-sm font-medium text-white">
              {itemCount > 0 ? `${itemCount} items — ${formatARS(total)}` : 'Carrito vacío'}
            </span>
          </div>
          {showCart ? <ChevronDown size={18} className="text-white/50" /> : <ChevronUp size={18} className="text-white/50" />}
        </button>

        {showCart && (
          <div className="mt-2 bg-[#2a2a3e] rounded-xl p-4">
            <CartPanel
              cart={cart}
              dispatch={dispatch}
              payment={payment}
              setPayment={setPayment}
              notes={notes}
              setNotes={setNotes}
              total={total}
              loading={loading}
              onConfirm={handleConfirm}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function CartPanel({
  cart, dispatch, payment, setPayment, notes, setNotes, total, loading, onConfirm
}: {
  cart: CartItem[]
  dispatch: React.Dispatch<CartAction>
  payment: PaymentMethod
  setPayment: (p: PaymentMethod) => void
  notes: string
  setNotes: (n: string) => void
  total: number
  loading: boolean
  onConfirm: () => void
}) {
  const paymentMethods: PaymentMethod[] = ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'TRANSFER']

  return (
    <div className="space-y-4">
      <h2 className="font-medium text-white text-sm">Pedido</h2>

      {cart.length === 0 ? (
        <p className="text-white/30 text-sm text-center py-4">Seleccioná productos</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
          {cart.map((item) => (
            <div key={item.product.id} className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => dispatch({ type: 'DEC', productId: item.product.id })}
                  className="w-6 h-6 bg-white/10 rounded flex items-center justify-center hover:bg-white/20"
                >
                  <Minus size={12} />
                </button>
                <span className="w-6 text-center font-bold text-white">{item.quantity}</span>
                <button
                  onClick={() => dispatch({ type: 'INC', productId: item.product.id })}
                  className="w-6 h-6 bg-white/10 rounded flex items-center justify-center hover:bg-white/20"
                >
                  <Plus size={12} />
                </button>
              </div>
              <span className="flex-1 text-white/80 truncate">{item.product.name}</span>
              <span className="text-white/60 text-xs">{formatARS(parseFloat(item.product.price) * item.quantity)}</span>
              <button
                onClick={() => dispatch({ type: 'REMOVE', productId: item.product.id })}
                className="text-red-400/60 hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-white/10 pt-3">
        <div className="flex justify-between font-bold text-white text-base">
          <span>Total</span>
          <span>{formatARS(total)}</span>
        </div>
      </div>

      {/* Payment method */}
      <div>
        <p className="text-xs text-white/50 mb-2">Método de pago</p>
        <div className="grid grid-cols-2 gap-2">
          {paymentMethods.map((method) => (
            <button
              key={method}
              onClick={() => setPayment(method)}
              className={clsx(
                'px-2 py-2 rounded-lg text-xs font-medium transition-colors text-center',
                payment === method
                  ? PAYMENT_COLORS[method]
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              )}
            >
              {PAYMENT_LABELS[method]}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Nota opcional (mesa, cliente...)"
        className="w-full bg-[#16162a] border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 placeholder-white/20"
      />

      <button
        onClick={onConfirm}
        disabled={loading || cart.length === 0}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors"
      >
        {loading ? 'Registrando...' : `Confirmar — ${formatARS(total)}`}
      </button>
    </div>
  )
}
