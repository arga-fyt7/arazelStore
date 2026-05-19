import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Pencil, Trash2, X, Search, Package, Tag, Percent } from 'lucide-react'
import AdminLayout from '../../components/AdminLayout'
import { formatPrice } from '../../lib/utils'
import { useToast } from '../../lib/useToast'
import { useConfirm } from '../../lib/useConfirm'

async function api(path, options) {
  const token = localStorage.getItem('token')
  const { headers: optHeaders, ...rest } = options || {}
  const res = await fetch(`/api${path}`, {
    ...rest,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...optHeaders },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Terjadi kesalahan')
  return data
}

const categories = [
  { id: 'makanan-berat', label: 'Makanan Berat' },
  { id: 'camilan', label: 'Camilan' },
  { id: 'minuman', label: 'Minuman' },
]

export default function ManageProducts() {
  const { addToast } = useToast()
  const { confirm } = useConfirm()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', price: '', image: '',
    category: 'makanan-berat', weight: '', stock: '',
    active: true, discount_type: '', discount_value: '',
  })

  useEffect(() => { fetchProducts() }, [])

  async function fetchProducts() {
    const d = await api('/admin/products')
    if (d.products) setProducts(d.products)
    setLoading(false)
  }

  function openAdd() {
    setEditId(null)
    setForm({ name: '', description: '', price: '', image: '', category: 'makanan-berat', weight: '', stock: '', active: true, discount_type: '', discount_value: '' })
    setShowForm(true)
  }

  function openEdit(p) {
    setEditId(p.id)
    setForm({
      name: p.name, description: p.description || '', price: String(p.price),
      image: p.image || '', category: p.category || 'makanan-berat',
      weight: String(p.weight || 0), stock: String(p.stock || 0), active: p.active !== false,
      discount_type: p.discount_type || '', discount_value: p.discount_value ? String(p.discount_value) : '',
    })
    setShowForm(true)
  }

  function calcDiscountedPrice(price, type, value) {
    const p = Number(price)
    if (!type || !value || Number(value) <= 0) return p
    if (type === 'percentage') return Math.round(p * (1 - Number(value) / 100))
    if (type === 'fixed') return Math.max(0, p - Number(value))
    return p
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.price) {
      addToast('Nama dan harga wajib diisi', 'error')
      return
    }
    setSaving(true)
    const payload = {
      ...form,
      price: Number(form.price),
      weight: Number(form.weight || 0),
      stock: Number(form.stock || 0),
      active: form.active,
      discount_type: form.discount_type || null,
      discount_value: form.discount_value && Number(form.discount_value) > 0 ? Number(form.discount_value) : null,
    }
    try {
      if (editId) {
        await api(`/admin/products/${editId}`, { method: 'PUT', body: JSON.stringify(payload) })
        addToast('Produk berhasil diperbarui', 'success')
      } else {
        await api('/admin/products', { method: 'POST', body: JSON.stringify(payload) })
        addToast('Produk berhasil ditambahkan', 'success')
      }
      setShowForm(false)
      fetchProducts()
    } catch (err) {
      addToast(err.message || 'Gagal menyimpan produk', 'error')
    }
    setSaving(false)
  }

  async function toggleActive(id, current) {
    await api(`/admin/products/${id}/toggle`, { method: 'PATCH' })
    addToast(current ? 'Produk dinonaktifkan' : 'Produk diaktifkan', 'success')
    fetchProducts()
  }

  async function handleDelete(id) {
    const ok = await confirm({ title: 'Hapus Produk?', message: 'Produk ini akan dihapus secara permanen.', confirmText: 'Hapus', variant: 'danger' })
    if (!ok) return
    try {
      await api(`/admin/products/${id}`, { method: 'DELETE' })
      addToast('Produk berhasil dihapus', 'success')
      fetchProducts()
    } catch (err) {
      addToast(err.message || 'Gagal menghapus produk', 'error')
    }
  }

  const discounted = calcDiscountedPrice(form.price, form.discount_type, form.discount_value)
  const hasDiscount = form.discount_type && form.discount_value && Number(form.discount_value) > 0

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AdminLayout>
      <div className="space-y-[16px]">
        <div className="flex items-center justify-between">
          <h1 className="text-[28px] font-bold text-primary">Produk</h1>
          <button onClick={openAdd}
            className="flex items-center gap-[8px] px-[16px] py-[10px] rounded-[8px] bg-brand-600 text-white text-[14px] font-medium hover:bg-brand-700 transition-colors"
          >
            <Plus size={16} /> Tambah
          </button>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-[14px] top-1/2 -translate-y-1/2 text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari produk..."
            className="w-full h-[44px] pl-[42px] pr-[14px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-[64px]">
            <div className="w-[28px] h-[28px] border-[3px] border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[16px]">
            {filtered.map((p) => {
              const discPrice = p.discount_type && p.discount_value > 0
                ? (p.discount_type === 'percentage'
                    ? Math.round(Number(p.price) * (1 - Number(p.discount_value) / 100))
                    : Math.max(0, Number(p.price) - Number(p.discount_value)))
                : null
              return (
                <div key={p.id} className="bg-card rounded-[13px] border border-subtle overflow-hidden flex flex-col">
                  <div className="h-[180px] bg-surface flex items-center justify-center overflow-hidden relative">
                    {discPrice && (
                      <span className="absolute top-[10px] left-[10px] z-10 text-[11px] font-semibold px-[8px] py-[3px] rounded-full bg-red-500 text-white shadow-sm">
                        {p.discount_type === 'percentage' ? `-${p.discount_value}%` : `-Rp${Number(p.discount_value).toLocaleString('id-ID')}`}
                      </span>
                    )}
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' }}
                      />
                    ) : (
                      <Package size={34} className="text-muted" />
                    )}
                  </div>
                  <div className="p-[16px] flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-[10px]">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-[8px]">
                          <h3 className="text-[16px] font-semibold text-primary truncate">{p.name}</h3>
                          <span className={`shrink-0 text-[11px] font-medium px-[6px] py-[2px] rounded-full ${
                            p.active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                          }`}>{p.active ? 'Aktif' : 'Nonaktif'}</span>
                        </div>
                        <p className="text-[13px] text-muted capitalize mt-[2px]">{categories.find(c => c.id === p.category)?.label || p.category}</p>
                      </div>
                      <div className="flex gap-[4px] shrink-0">
                        <button type="button" onClick={() => toggleActive(p.id, p.active)}
                          className={`relative w-[40px] h-[24px] rounded-full transition-all duration-200 ease-in-out shrink-0 focus:outline-none focus:ring-2 focus:ring-brand-500/30 ${
                            p.active ? 'bg-brand-600' : 'bg-stone-200 dark:bg-stone-700'
                          }`}
                        >
                          <span className={`absolute top-[2px] left-[2px] w-[20px] h-[20px] rounded-full bg-white shadow-sm transition-all duration-200 ease-in-out ${
                            p.active ? 'translate-x-[16px]' : 'translate-x-0'
                          }`} />
                        </button>
                        <button onClick={() => openEdit(p)} className="p-[7px] rounded-[7px] text-muted hover:text-primary hover:bg-surface-secondary transition-colors"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-[7px] rounded-[7px] text-muted hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-[10px]">
                      <div>
                        {discPrice ? (
                          <div className="flex items-center gap-[6px] flex-wrap">
                            <span className="text-[18px] font-bold text-brand-600">{formatPrice(discPrice)}</span>
                            <span className="text-[12px] text-muted line-through">{formatPrice(p.price)}</span>
                          </div>
                        ) : (
                          <span className="text-[18px] font-bold text-brand-600">{formatPrice(p.price)}</span>
                        )}
                      </div>
                      <span className={`text-[12px] font-medium px-[8px] py-[3px] rounded-full ${p.stock > 0 ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                        {p.stock > 0 ? `Stok: ${p.stock}` : 'Habis'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-[40px]"><p className="text-[15px] text-muted">Tidak ada produk</p></div>
            )}
          </div>
        )}

        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-start justify-center p-[16px] pt-[40px] md:items-center md:p-[24px] bg-black/40 backdrop-blur-sm overflow-y-auto"
              onClick={() => setShowForm(false)}
            >
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[560px] bg-card rounded-[13px] border border-subtle shadow-xl"
              >
                <div className="flex items-center justify-between px-[24px] pt-[24px] pb-[16px] border-b border-subtle">
                  <h2 className="text-[18px] font-semibold text-primary">{editId ? 'Edit Produk' : 'Tambah Produk'}</h2>
                  <button onClick={() => setShowForm(false)} className="p-[8px] rounded-[7px] text-muted hover:text-primary hover:bg-surface-secondary"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-[24px] space-y-[16px]">
                  <div className="space-y-[6px]">
                    <label className="block text-[13px] font-medium text-secondary">Nama Produk</label>
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Masukkan nama produk"
                      className="w-full h-[44px] px-[14px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="space-y-[6px]">
                    <label className="block text-[13px] font-medium text-secondary">Deskripsi</label>
                    <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Deskripsi produk"
                      className="w-full px-[14px] py-[10px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-[12px]">
                    <div className="space-y-[6px]">
                      <label className="block text-[13px] font-medium text-secondary">Harga (Rp)</label>
                      <input required type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                        placeholder="25000"
                        className="w-full h-[44px] px-[14px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <div className="space-y-[6px]">
                      <label className="block text-[13px] font-medium text-secondary">Diskon</label>
                      <div className="flex gap-[6px]">
                        <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value, discount_value: e.target.value ? form.discount_value : '' })}
                          className="w-[90px] shrink-0 h-[44px] px-[10px] rounded-[8px] bg-surface border border-subtle text-primary text-[14px] focus:outline-none focus:border-brand-500"
                        >
                          <option value="">Tidak</option>
                          <option value="percentage"><Percent size={14} />%</option>
                          <option value="fixed">Rp</option>
                        </select>
                        <input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                          placeholder={form.discount_type === 'percentage' ? '10' : '5000'}
                          disabled={!form.discount_type}
                          className="flex-1 h-[44px] px-[14px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500 disabled:opacity-40"
                        />
                      </div>
                    </div>
                  </div>

                  {hasDiscount && Number(form.price) > 0 && (
                    <div className="flex items-center gap-[8px] px-[14px] py-[10px] rounded-[8px] bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30">
                      <Tag size={15} className="text-green-600 dark:text-green-400 shrink-0" />
                      <span className="text-[13px] text-green-700 dark:text-green-300">
                        Harga setelah diskon: <strong>{formatPrice(discounted)}</strong>
                        {form.discount_type === 'percentage' && (
                          <span className="ml-[4px] text-green-500">({form.discount_value}% off)</span>
                        )}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-[12px]">
                    <div className="space-y-[6px]">
                      <label className="block text-[13px] font-medium text-secondary">Kategori</label>
                      <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full h-[44px] px-[14px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500"
                      >
                        {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-[6px]">
                      <label className="block text-[13px] font-medium text-secondary">Stok</label>
                      <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                        placeholder="0"
                        className="w-full h-[44px] px-[14px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <div className="space-y-[6px]">
                      <label className="block text-[13px] font-medium text-secondary">Berat (gram)</label>
                      <input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })}
                        placeholder="200"
                        className="w-full h-[44px] px-[14px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <div className="space-y-[6px]">
                      <label className="block text-[13px] font-medium text-secondary">Status</label>
                      <div className="flex items-center gap-[10px] h-[44px]">
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
                    </div>
                  </div>

                  <div className="space-y-[6px]">
                    <label className="block text-[13px] font-medium text-secondary">URL Gambar</label>
                    <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                      className="w-full h-[44px] px-[14px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="flex gap-[10px] pt-[8px] border-t border-subtle">
                    <button type="button" onClick={() => setShowForm(false)}
                      className="flex-1 h-[44px] rounded-[8px] border border-subtle text-secondary text-[14px] font-medium hover:text-primary hover:bg-surface-secondary transition-colors">Batal</button>
                    <button type="submit" disabled={saving}
                      className="flex-1 h-[44px] rounded-[8px] bg-brand-600 text-white text-[14px] font-medium hover:bg-brand-700 transition-colors disabled:opacity-50">
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
