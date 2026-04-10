import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Plus, Trash2, QrCode, RefreshCw, Power } from 'lucide-react'
import QRCode from 'qrcode'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin

interface Table { id: string; number: string; qrToken: string; isActive: boolean; _count?: { orders: number } }

export default function TablesPage() {
  const { token, user } = useAuthStore()
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [number, setNumber] = useState('')
  const [saving, setSaving] = useState(false)
  const [qrPreview, setQrPreview] = useState<{ table: Table; dataUrl: string } | null>(null)

  const load = async () => {
    const { data } = await axios.get(`${API}/tables`, { headers: { Authorization: `Bearer ${token}` } })
    setTables(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!number.trim()) return
    setSaving(true)
    try {
      await axios.post(`${API}/tables`, { number }, { headers: { Authorization: `Bearer ${token}` } })
      toast.success('Mesa creada')
      setNumber('')
      setShowForm(false)
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error')
    } finally { setSaving(false) }
  }

  const toggleActive = async (table: Table) => {
    try {
      await axios.patch(`${API}/tables/${table.id}`, { isActive: !table.isActive }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      load()
    } catch { toast.error('Error') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Desactivar esta mesa?')) return
    try {
      await axios.delete(`${API}/tables/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      toast.success('Mesa desactivada')
      load()
    } catch { toast.error('Error') }
  }

  const regenerateQr = async (table: Table) => {
    if (!confirm('¿Regenerar QR? El QR anterior dejará de funcionar.')) return
    try {
      const { data } = await axios.post(`${API}/tables/${table.id}/regenerate-qr`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
      toast.success('QR regenerado')
      setTables(ts => ts.map(t => t.id === table.id ? { ...t, qrToken: data.qrToken } : t))
    } catch { toast.error('Error') }
  }

  const showQR = async (table: Table) => {
    const slug = (user as any)?.tenantSlug || 'local'
    const url = `${FRONTEND_URL}/menu/${slug}/${table.qrToken}`
    const dataUrl = await QRCode.toDataURL(url, { width: 400, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
    setQrPreview({ table, dataUrl })
  }

  const downloadQR = () => {
    if (!qrPreview) return
    const a = document.createElement('a')
    a.href = qrPreview.dataUrl
    a.download = `QR-Mesa-${qrPreview.table.number}.png`
    a.click()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mesas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestioná las mesas y sus QR codes</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-semibold"
        >
          <Plus size={16} /> Nueva mesa
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs font-medium text-gray-500 block mb-1">Nombre / número de mesa</label>
            <input
              autoFocus
              value={number}
              onChange={e => setNumber(e.target.value)}
              placeholder="Ej: Mesa 1, Barra, Terraza 3"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
            />
          </div>
          <button type="submit" disabled={saving}
            className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
            {saving ? 'Creando...' : 'Crear'}
          </button>
          <button type="button" onClick={() => setShowForm(false)}
            className="border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl text-sm">
            Cancelar
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : tables.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <QrCode size={40} className="mx-auto mb-3 opacity-30" />
          <p>No hay mesas todavía</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map(table => (
            <div key={table.id}
              className={`bg-white rounded-2xl border shadow-sm p-5 transition-opacity ${!table.isActive ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">{table.number}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{table._count?.orders ?? 0} pedidos totales</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  table.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {table.isActive ? 'Activa' : 'Inactiva'}
                </span>
              </div>

              <div className="flex gap-2">
                <button onClick={() => showQR(table)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-gray-900 text-white py-2 rounded-xl text-xs font-semibold">
                  <QrCode size={14} /> Ver QR
                </button>
                <button onClick={() => regenerateQr(table)} title="Regenerar QR"
                  className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                  <RefreshCw size={15} color="#374151" />
                </button>
                <button onClick={() => toggleActive(table)} title={table.isActive ? 'Desactivar' : 'Activar'}
                  className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                  <Power size={15} color={table.isActive ? '#10b981' : '#9ca3af'} />
                </button>
                <button onClick={() => handleDelete(table.id)} title="Eliminar"
                  className="p-2 rounded-xl bg-red-50 hover:bg-red-100 transition-colors">
                  <Trash2 size={15} color="#ef4444" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Modal */}
      {qrPreview && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-xs w-full text-center shadow-2xl">
            <h3 className="font-bold text-gray-900 text-lg mb-1">{qrPreview.table.number}</h3>
            <p className="text-gray-400 text-xs mb-5">Escaneá para hacer tu pedido</p>
            <img src={qrPreview.dataUrl} alt="QR" className="w-48 h-48 mx-auto rounded-xl" />
            <div className="flex gap-3 mt-6">
              <button onClick={downloadQR}
                className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-semibold text-sm">
                Descargar
              </button>
              <button onClick={() => setQrPreview(null)}
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-semibold text-sm">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
