import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { productsApi, categoriesApi } from '@/api'
import type { Product, Category } from '@/types'
import { formatARS } from '@/utils/format'
import { Plus, Edit2, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'

interface ProductForm {
  name: string
  description: string
  price: string
  categoryId: string
  isActive: boolean
}

const emptyForm: ProductForm = { name: '', description: '', price: '', categoryId: '', isActive: true }

export default function ProductsPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<{ open: boolean; editing: Product | null }>({ open: false, editing: null })
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [loading, setLoading] = useState(false)

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products', 'all'],
    queryFn: () => productsApi.list(false),
  })

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
  })

  function openCreate() {
    setForm(emptyForm)
    setModal({ open: true, editing: null })
  }

  function openEdit(p: Product) {
    setForm({ name: p.name, description: p.description || '', price: p.price, categoryId: p.categoryId, isActive: p.isActive })
    setModal({ open: true, editing: p })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const data = { ...form, price: parseFloat(form.price) }
      if (modal.editing) {
        await productsApi.update(modal.editing.id, data)
        toast.success('Producto actualizado')
      } else {
        await productsApi.create(data)
        toast.success('Producto creado')
      }
      qc.invalidateQueries({ queryKey: ['products'] })
      setModal({ open: false, editing: null })
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg || 'Error')
    } finally {
      setLoading(false)
    }
  }

  async function toggleActive(p: Product) {
    try {
      await productsApi.update(p.id, { isActive: !p.isActive })
      qc.invalidateQueries({ queryKey: ['products'] })
    } catch {
      toast.error('Error al actualizar')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Productos</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} />
          Nuevo
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/40 border-b border-white/10">
              <th className="pb-2 pr-4 font-medium">Nombre</th>
              <th className="pb-2 pr-4 font-medium">Categoría</th>
              <th className="pb-2 pr-4 font-medium">Precio</th>
              <th className="pb-2 pr-4 font-medium">Estado</th>
              <th className="pb-2 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {products.map((p) => (
              <tr key={p.id} className={!p.isActive ? 'opacity-50' : ''}>
                <td className="py-3 pr-4 text-white font-medium">{p.name}</td>
                <td className="py-3 pr-4">
                  <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.category.color }} />
                    {p.category.name}
                  </span>
                </td>
                <td className="py-3 pr-4 text-indigo-300 font-medium">{formatARS(p.price)}</td>
                <td className="py-3 pr-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/30'}`}>
                    {p.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(p)} className="text-white/40 hover:text-white transition-colors">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => toggleActive(p)} className="text-white/40 hover:text-white transition-colors">
                      {p.isActive ? <ToggleRight size={18} className="text-green-400" /> : <ToggleLeft size={18} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#2a2a3e] rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-white mb-4">{modal.editing ? 'Editar Producto' : 'Nuevo Producto'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Field label="Nombre *">
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                  className="input-base" />
              </Field>
              <Field label="Descripción">
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-base" />
              </Field>
              <Field label="Precio (ARS) *">
                <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required min="0.01" step="0.01"
                  className="input-base" />
              </Field>
              <Field label="Categoría *">
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required
                  className="input-base">
                  <option value="">Seleccionar...</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal({ open: false, editing: null })}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl transition-colors">
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`.input-base { width: 100%; background: #16162a; border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 0.5rem; padding: 0.625rem 0.75rem; font-size: 0.875rem; outline: none; } .input-base:focus { border-color: #6366f1; }`}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-white/50 mb-1">{label}</label>
      {children}
    </div>
  )
}
