import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Pencil, Trash2, X, Search, Tag, Percent, Truck } from 'lucide-react'
import AdminLayout from '../../components/AdminLayout'
import { formatPrice } from '../../lib/utils'
import { useToast } from '../../lib/useToast'
import { useConfirm } from '../../lib/useConfirm'
import { api } from '../../lib/api'

const promoTypes = [
  { value: 'percentage', label: 'Persentase' },
  { value: 'fixed', label: 'Nominal' },
  { value: 'free_shipping', label: 'Gratis Ongkir' },
]

const typeStyles = {
  percentage: { icon: Percent, color: 'bg-blue-50 text-blue-700' },
  fixed: { icon: Tag, color: 'bg-purple-50 text-purple-700' },
  free_shipping: { icon: Truck, color: 'bg-green-50 text-green-700' },
}

export default function ManagePromos() {
  const { addToast } = useToast()
  const { confirm } = useConfirm()
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    code: '', title: '', description: '', type: 'percentage', value: '',
    minPurchase: '0', maxDiscount: '', usageLimit: '', startDate: '', endDate: '', active: true,
  })

  useEffect(() => { fetchPromos() }, [])

  async function fetchPromos() {
    const d = await api('/admin/promos')
    setPromos(d.promos || [])
    setLoading(false)
  }

  function openAdd() {
    setEditId(null)
    setForm({ code: '', title: '', description: '', type: 'percentage', value: '', minPurchase: '0', maxDiscount: '', usageLimit: '', startDate: '', endDate: '', active: true })
    setShowForm(true)
  }

  function openEdit(p) {
    setEditId(p.id)
    setForm({
      code: p.code, title: p.title, description: p.description || '', type: p.type, value: String(p.value),
      minPurchase: String(p.min_purchase || 0), maxDiscount: p.max_discount ? String(p.max_discount) : '',
      usageLimit: p.usage_limit ? String(p.usage_limit) : '',
      startDate: p.start_date ? p.start_date.split('T')[0] : '',
      endDate: p.end_date ? p.end_date.split('T')[0] : '', active: p.active !== false,
    })
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.code || !form.title || !form.value) return
    setSaving(true)
    const payload = {
      ...form, value: Number(form.value), minPurchase: Number(form.minPurchase),
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      startDate: form.startDate || null, endDate: form.endDate || null, active: form.active,
    }
    try {
      if (editId) {
        await api(`/admin/promos/${editId}`, { method: 'PUT', body: JSON.stringify(payload) })
        addToast('Promo berhasil diperbarui', 'success')
      } else {
        await api('/admin/promos', { method: 'POST', body: JSON.stringify(payload) })
        addToast('Promo berhasil ditambahkan', 'success')
      }
      setShowForm(false)
      fetchPromos()
    } catch (err) {
      addToast(err.message || 'Gagal menyimpan promo', 'error')
    }
    setSaving(false)
  }

  async function toggleActive(id, current) {
    await api(`/admin/promos/${id}/toggle`, { method: 'PATCH' })
    addToast(current ? 'Promo dinonaktifkan' : 'Promo diaktifkan', 'success')
    fetchPromos()
  }

  async function handleDelete(id) {
    const ok = await confirm({ title: 'Hapus Promo?', message: 'Promo ini akan dihapus secara permanen.', confirmText: 'Hapus', variant: 'danger' })
    if (!ok) return
    try {
      await api(`/admin/promos/${id}`, { method: 'DELETE' })
      addToast('Promo berhasil dihapus', 'success')
      fetchPromos()
    } catch (err) {
      addToast(err.message || 'Gagal menghapus promo', 'error')
    }
  }

  const filtered = promos.filter((p) =>
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    p.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AdminLayout>
      <div className="space-y-[16px]">
        <div className="flex items-center justify-between">
          <h1 className="text-[28px] font-bold text-primary">Promo</h1>
          <button onClick={openAdd}
            className="flex items-center gap-[8px] px-[16px] py-[10px] rounded-[8px] bg-brand-600 text-white text-[14px] font-medium hover:bg-brand-700 transition-colors"
          >
            <Plus size={16} /> Tambah
          </button>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-[14px] top-1/2 -translate-y-1/2 text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari promo..."
            className="w-full h-[44px] pl-[42px] pr-[14px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-[64px]">
            <div className="w-[28px] h-[28px] border-[3px] border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
            {filtered.map((p) => {
              const ts = typeStyles[p.type] || { icon: Tag, color: 'bg-surface-secondary text-muted' }
              const TI = ts.icon
              return (
                <div key={p.id} className="bg-card rounded-[13px] border border-subtle p-[24px]">
                  <div className="flex items-start justify-between gap-[10px]">
                    <div className="flex items-center gap-[12px] min-w-0 flex-1">
                      <div className={`w-[44px] h-[44px] rounded-[10px] flex items-center justify-center shrink-0 ${ts.color}`}>
                        <TI size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-[8px] flex-wrap">
                          <span className="text-[18px] font-bold text-brand-600">{p.code}</span>
                          <button type="button" onClick={() => toggleActive(p.id, p.active)}
                            className={`relative w-[40px] h-[24px] rounded-full transition-all duration-200 ease-in-out shrink-0 focus:outline-none focus:ring-2 focus:ring-brand-500/30 ${
                              p.active ? 'bg-brand-600' : 'bg-stone-200 dark:bg-stone-700'
                            }`}
                          >
                            <span className={`absolute top-[2px] left-[2px] w-[20px] h-[20px] rounded-full bg-white shadow-sm transition-all duration-200 ease-in-out ${
                              p.active ? 'translate-x-[16px]' : 'translate-x-0'
                            }`} />
                          </button>
                        </div>
                        <p className="text-[15px] font-medium text-primary mt-[4px]">{p.title}</p>
                      </div>
                    </div>
                    <div className="flex gap-[4px] shrink-0">
                      <button onClick={() => openEdit(p)} className="p-[7px] rounded-[7px] text-muted hover:text-primary hover:bg-surface-secondary"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-[7px] rounded-[7px] text-muted hover:text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="mt-[12px] space-y-[2px]">
                    <p className="text-[14px] text-secondary">
                      {p.type === 'percentage' ? `${p.value}%` : p.type === 'fixed' ? formatPrice(p.value) : 'Gratis Ongkir'}
                      {Number(p.min_purchase) > 0 && ` &bull; Min. ${formatPrice(p.min_purchase)}`}
                    </p>
                    <p className="text-[12px] text-muted">
                      Digunakan {p.used_count || 0}x{p.usage_limit ? ` / ${p.usage_limit}x` : ''}
                      {p.end_date && ` &bull; Berakhir ${new Date(p.end_date).toLocaleDateString('id-ID')}`}
                    </p>
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-[40px]"><p className="text-[15px] text-muted">Tidak ada promo</p></div>
            )}
          </div>
        )}

        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-[24px] bg-black/40 backdrop-blur-sm"
              onClick={() => setShowForm(false)}
            >
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[540px] bg-card rounded-[13px] border border-subtle shadow-xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between px-[24px] pt-[24px] pb-[16px] border-b border-subtle sticky top-0 bg-card">
                  <h2 className="text-[18px] font-semibold text-primary">{editId ? 'Edit Promo' : 'Tambah Promo'}</h2>
                  <button onClick={() => setShowForm(false)} className="p-[8px] rounded-[7px] text-muted hover:text-primary hover:bg-surface-secondary"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-[24px] space-y-[12px]">
                  <div className="grid grid-cols-2 gap-[10px]">
                    <div>
                      <label className="block text-[13px] font-medium text-secondary mb-[4px]">Kode</label>
                      <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                        className="w-full h-[44px] px-[14px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500 uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-secondary mb-[4px]">Tipe</label>
                      <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                        className="w-full h-[44px] px-[14px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500"
                      >
                        {promoTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[13px] font-medium text-secondary mb-[4px]">Judul</label>
                      <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="w-full h-[44px] px-[14px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[13px] font-medium text-secondary mb-[4px]">Deskripsi</label>
                      <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full px-[14px] py-[10px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-secondary mb-[4px]">
                        {form.type === 'percentage' ? 'Persentase' : form.type === 'fixed' ? 'Nominal (Rp)' : 'Min. Pembelian'}
                      </label>
                      <input required type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })}
                        className="w-full h-[44px] px-[14px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-secondary mb-[4px]">Min. Belanja (Rp)</label>
                      <input type="number" value={form.minPurchase} onChange={(e) => setForm({ ...form, minPurchase: e.target.value })}
                        className="w-full h-[44px] px-[14px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-secondary mb-[4px]">Maks. Diskon (Rp)</label>
                      <input type="number" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                        className="w-full h-[44px] px-[14px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-secondary mb-[4px]">Batas Pakai</label>
                      <input type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                        className="w-full h-[44px] px-[14px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-secondary mb-[4px]">Mulai</label>
                      <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                        className="w-full h-[44px] px-[14px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-secondary mb-[4px]">Berakhir</label>
                      <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                        className="w-full h-[44px] px-[14px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center gap-[10px]">
                    <span className="text-[13px] font-medium text-secondary">Status</span>
                    <button type="button" onClick={() => setForm({ ...form, active: !form.active })}
                      className={`relative w-[50px] h-[28px] rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500/30 ${
                        form.active ? 'bg-brand-600' : 'bg-stone-200 dark:bg-stone-700'
                      }`}
                    >
                      <span className={`absolute top-[2px] left-[2px] w-[24px] h-[24px] rounded-full bg-white shadow-sm transition-all duration-200 ease-in-out ${
                        form.active ? 'translate-x-[22px]' : 'translate-x-0'
                      }`} />
                    </button>
                    <span className={`text-[13px] font-medium ${form.active ? 'text-green-700' : 'text-red-600'}`}>
                      {form.active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <div className="flex gap-[10px] pt-[6px]">
                    <button type="button" onClick={() => setShowForm(false)}
                      className="flex-1 h-[44px] rounded-[8px] border border-subtle text-secondary text-[14px] font-medium hover:text-primary hover:bg-surface-secondary">Batal</button>
                    <button type="submit" disabled={saving}
                      className="flex-1 h-[44px] rounded-[8px] bg-brand-600 text-white text-[14px] font-medium hover:bg-brand-700 disabled:opacity-50">
                      {saving ? 'Menyimpan...' : editId ? 'Simpan' : 'Tambah'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  )
}
