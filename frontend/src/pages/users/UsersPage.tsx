import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/api'
import type { User } from '@/types'
import { Plus, Edit2, ToggleLeft, ToggleRight, Key } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/utils/format'

export default function UsersPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<{ type: 'create' | 'edit' | 'password'; user: User | null } | null>(null)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'CASHIER' })
  const [newPassword, setNewPassword] = useState('')

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: usersApi.list,
  })

  async function handleCreateOrEdit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (modal?.type === 'create') {
        await usersApi.create(form as Parameters<typeof usersApi.create>[0])
        toast.success('Usuario creado')
      } else if (modal?.type === 'edit' && modal.user) {
        await usersApi.update(modal.user.id, { name: form.name, role: form.role as 'ADMIN' | 'CASHIER' })
        toast.success('Usuario actualizado')
      }
      qc.invalidateQueries({ queryKey: ['users'] })
      setModal(null)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg || 'Error')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!modal?.user) return
    setLoading(true)
    try {
      await usersApi.resetPassword(modal.user.id, newPassword)
      toast.success('Contraseña restablecida')
      setModal(null)
      setNewPassword('')
    } catch {
      toast.error('Error al restablecer contraseña')
    } finally {
      setLoading(false)
    }
  }

  async function toggleActive(user: User) {
    try {
      await usersApi.update(user.id, { isActive: !user.isActive })
      qc.invalidateQueries({ queryKey: ['users'] })
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg || 'Error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Usuarios</h1>
        <button
          onClick={() => { setForm({ name: '', email: '', password: '', role: 'CASHIER' }); setModal({ type: 'create', user: null }) }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Nuevo
        </button>
      </div>

      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.id} className={`bg-[#2a2a3e] rounded-xl p-4 flex items-center gap-3 ${!user.isActive ? 'opacity-50' : ''}`}>
            <div className="w-10 h-10 bg-indigo-600/20 rounded-full flex items-center justify-center text-indigo-400 font-bold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white">{user.name}</p>
              <p className="text-xs text-white/40">{user.email}</p>
              <p className="text-xs text-white/30 mt-0.5">Creado: {user.createdAt ? formatDate(user.createdAt) : '-'}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${user.role === 'ADMIN' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/10 text-white/50'}`}>
              {user.role === 'ADMIN' ? 'Admin' : 'Cajero'}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => { setForm({ name: user.name, email: user.email, password: '', role: user.role }); setModal({ type: 'edit', user }) }}
                className="text-white/40 hover:text-white transition-colors" title="Editar">
                <Edit2 size={15} />
              </button>
              <button onClick={() => { setNewPassword(''); setModal({ type: 'password', user }) }}
                className="text-white/40 hover:text-white transition-colors" title="Cambiar contraseña">
                <Key size={15} />
              </button>
              <button onClick={() => toggleActive(user)} className="text-white/40 hover:text-white transition-colors">
                {user.isActive ? <ToggleRight size={18} className="text-green-400" /> : <ToggleLeft size={18} />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {modal && (modal.type === 'create' || modal.type === 'edit') && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#2a2a3e] rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-white mb-4">
              {modal.type === 'create' ? 'Nuevo Usuario' : 'Editar Usuario'}
            </h2>
            <form onSubmit={handleCreateOrEdit} className="space-y-3">
              <Field label="Nombre *">
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="input-base" />
              </Field>
              {modal.type === 'create' && (
                <Field label="Email *">
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="input-base" />
                </Field>
              )}
              {modal.type === 'create' && (
                <Field label="Contraseña *">
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} className="input-base" />
                </Field>
              )}
              <Field label="Rol">
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input-base">
                  <option value="CASHIER">Cajero</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </Field>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl transition-colors">
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {modal?.type === 'password' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#2a2a3e] rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-white mb-1">Restablecer Contraseña</h2>
            <p className="text-sm text-white/40 mb-4">{modal.user?.name}</p>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <Field label="Nueva contraseña *">
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className="input-base" />
              </Field>
              <div className="flex gap-3">
                <button type="button" onClick={() => setModal(null)} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl transition-colors">
                  {loading ? '...' : 'Restablecer'}
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
