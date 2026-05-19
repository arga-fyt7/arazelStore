import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Pencil, Trash2, X, Save, Megaphone, Store, Wrench, Building2, Landmark, Wallet, Smartphone, CreditCard, Users, Shield, ShieldOff, Search as SearchIcon, UserX, UserCheck, AlertTriangle, Clock, Truck, MapPin, Banknote } from 'lucide-react'
import AdminLayout from '../../components/AdminLayout'
import { useToast } from '../../lib/useToast'
import { useConfirm } from '../../lib/useConfirm'
import { api } from '../../lib/api'

const types = [
  { value: 'info', label: 'Info' },
  { value: 'promo', label: 'Promo' },
  { value: 'alert', label: 'Alert' },
]

const tabs = [
  { id: 'announcements', label: 'Pengumuman', icon: Megaphone },
  { id: 'shipping', label: 'Pengiriman & Bayar', icon: Truck },
  { id: 'store', label: 'Informasi Toko', icon: Store },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench },
  { id: 'pengguna', label: 'Pengguna', icon: Users },
]

const days = [
  { key: 'senin', label: 'Senin' },
  { key: 'selasa', label: 'Selasa' },
  { key: 'rabu', label: 'Rabu' },
  { key: 'kamis', label: 'Kamis' },
  { key: 'jumat', label: 'Jumat' },
  { key: 'sabtu', label: 'Sabtu' },
  { key: 'minggu', label: 'Minggu' },
]

function ApplyAllTimes({ onApply }) {
  const [open, setOpen] = useState('08:00')
  const [close, setClose] = useState('21:00')
  return (
    <>
      <input type="time" value={open} onChange={(e) => setOpen(e.target.value)}
        className="h-[32px] w-[80px] px-[8px] rounded-[6px] bg-surface border border-subtle text-[12px] text-primary focus:outline-none"
      />
      <input type="time" value={close} onChange={(e) => setClose(e.target.value)}
        className="h-[32px] w-[80px] px-[8px] rounded-[6px] bg-surface border border-subtle text-[12px] text-primary focus:outline-none"
      />
      <button type="button" onClick={() => onApply(open, close)}
        className="px-[10px] py-[5px] rounded-[6px] bg-brand-50 text-brand-700 text-[11px] font-medium hover:bg-brand-100 transition-colors"
      >
        Terapkan
      </button>
    </>
  )
}

export default function ManageSettings() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'announcements'

  function setTab(id) {
    setSearchParams(id === 'announcements' ? {} : { tab: id })
  }

  return (
    <AdminLayout>
      <div className="space-y-[12px] md:space-y-[16px]">
        <h1 className="text-[24px] md:text-[28px] font-bold text-primary">Pengaturan</h1>

        <div className="flex gap-[4px] md:gap-[6px] border-b border-subtle pb-[4px] overflow-x-auto">
          {tabs.map((t) => {
            const TIcon = t.icon
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-[6px] md:gap-[8px] px-[12px] md:px-[16px] py-[9px] md:py-[10px] rounded-t-[8px] text-[13px] md:text-[14px] font-medium transition-colors ${
                  tab === t.id ? 'bg-card text-brand-600 border border-b-0 border-subtle' : 'text-secondary hover:text-primary'
                }`}
              >
                <TIcon size={16} />
                {t.label}
              </button>
            )
          })}
        </div>

        {tab === 'announcements' && <AnnouncementsSection />}
        {tab === 'shipping' && <ShippingSection />}
        {tab === 'store' && <StoreSection />}
        {tab === 'maintenance' && <MaintenanceSection />}
        {tab === 'pengguna' && <UsersSection />}
      </div>
    </AdminLayout>
  )
}

function AnnouncementsSection() {
  const { addToast } = useToast()
  const { confirm } = useConfirm()
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', message: '', type: 'info', link: '', active: true })

  useEffect(() => { fetchNotifs() }, [])

  async function fetchNotifs() {
    const d = await api('/admin/notifications')
    setNotifs(d.notifications || [])
    setLoading(false)
  }

  function openAdd() {
    setEditId(null)
    setForm({ title: '', message: '', type: 'info', link: '', active: true })
    setShowForm(true)
  }

  function openEdit(n) {
    setEditId(n.id)
    setForm({ title: n.title, message: n.message, type: n.type, link: n.link || '', active: Boolean(n.active) })
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title || !form.message) return
    setSaving(true)
    try {
      const payload = { ...form, link: form.link || null }
      if (editId) {
        await api(`/admin/notifications/${editId}`, { method: 'PUT', body: JSON.stringify(payload) })
        addToast('Pengumuman berhasil diperbarui', 'success')
      } else {
        await api('/admin/notifications', { method: 'POST', body: JSON.stringify(payload) })
        addToast('Pengumuman berhasil ditambahkan', 'success')
      }
      setShowForm(false)
      fetchNotifs()
    } catch (err) {
      addToast(err.message || 'Gagal menyimpan pengumuman', 'error')
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    const ok = await confirm({ title: 'Hapus Pengumuman?', message: 'Pengumuman ini akan dihapus secara permanen.', confirmText: 'Hapus', variant: 'danger' })
    if (!ok) return
    try {
      await api(`/admin/notifications/${id}`, { method: 'DELETE' })
      addToast('Pengumuman berhasil dihapus', 'success')
      fetchNotifs()
    } catch (err) {
      addToast(err.message || 'Gagal menghapus pengumuman', 'error')
    }
  }

  const typeStyles = {
    info: 'bg-blue-50 text-blue-700',
    promo: 'bg-green-50 text-green-700',
    alert: 'bg-red-50 text-red-700',
  }

  if (loading) {
    return <div className="flex items-center justify-center py-[64px]"><div className="w-[28px] h-[28px] border-[3px] border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[10px]">
        <p className="text-[14px] md:text-[15px] text-secondary">Kelola pengumuman yang tampil ke pelanggan</p>
        <button onClick={openAdd}
          className="flex items-center gap-[8px] px-[16px] py-[10px] rounded-[8px] bg-brand-600 text-white text-[14px] font-medium hover:bg-brand-700 transition-colors self-start"
        >
          <Plus size={16} /> Tambah
        </button>
      </div>

      <div className="space-y-[8px] md:space-y-[10px]">
        {notifs.map((n) => (
          <div key={n.id} className="bg-card rounded-[13px] border border-subtle p-[16px] md:p-[24px]">
            <div className="flex items-start justify-between gap-[8px] md:gap-[10px]">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-[6px] md:gap-[8px] flex-wrap">
                  <span className="text-[14px] md:text-[16px] font-semibold text-primary">{n.title}</span>
                  <span className={`text-[11px] md:text-[12px] font-medium px-[6px] md:px-[8px] py-[2px] md:py-[3px] rounded-full ${typeStyles[n.type] || 'bg-surface-secondary text-muted'}`}>
                    {n.type}
                  </span>
                  <span className={`text-[11px] md:text-[12px] font-medium px-[6px] md:px-[8px] py-[2px] md:py-[3px] rounded-full ${n.active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {n.active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <p className="text-[13px] md:text-[14px] text-secondary mt-[4px]">{n.message}</p>
                <p className="text-[11px] md:text-[12px] text-muted mt-[4px]">
                  {n.link && <span>Link: {n.link} &bull; </span>}
                  {new Date(n.created_at).toLocaleDateString('id-ID')}
                </p>
              </div>
              <div className="flex gap-[4px] shrink-0">
                <button onClick={() => openEdit(n)} className="p-[6px] md:p-[7px] rounded-[7px] text-muted hover:text-primary hover:bg-surface-secondary"><Pencil size={13} className="md:size-[14px]" /></button>
                <button onClick={() => handleDelete(n.id)} className="p-[6px] md:p-[7px] rounded-[7px] text-muted hover:text-red-500 hover:bg-red-50"><Trash2 size={13} className="md:size-[14px]" /></button>
              </div>
            </div>
          </div>
        ))}
        {notifs.length === 0 && (
          <p className="text-[14px] md:text-[15px] text-muted text-center py-[24px] md:py-[40px]">Belum ada pengumuman</p>
        )}
      </div>

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
                <h2 className="text-[18px] font-semibold text-primary">{editId ? 'Edit Pengumuman' : 'Tambah Pengumuman'}</h2>
                <button onClick={() => setShowForm(false)} className="p-[8px] rounded-[7px] text-muted hover:text-primary hover:bg-surface-secondary"><X size={18} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-[24px] space-y-[12px]">
                <div>
                  <label className="block text-[13px] font-medium text-secondary mb-[4px]">Judul</label>
                  <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full h-[44px] px-[14px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-secondary mb-[4px]">Pesan</label>
                  <textarea required rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-[14px] py-[10px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-[10px]">
                  <div>
                    <label className="block text-[13px] font-medium text-secondary mb-[4px]">Tipe</label>
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className="w-full h-[44px] px-[14px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500"
                    >
                      {types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-secondary mb-[4px]">Status</label>
                    <select value={form.active} onChange={(e) => setForm({ ...form, active: e.target.value === 'true' })}
                      className="w-full h-[44px] px-[14px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500"
                    >
                      <option value={true}>Aktif</option>
                      <option value={false}>Nonaktif</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-secondary mb-[4px]">Link (opsional)</label>
                  <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })}
                    className="w-full h-[44px] px-[14px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500"
                  />
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
    </>
  )
}

function ShippingSection() {
  const { addToast } = useToast()
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [transferAccounts, setTransferAccounts] = useState([])
  const [ewalletAccounts, setEwalletAccounts] = useState([])

  useEffect(() => {
    api('/admin/settings').then(d => {
      if (d.settings) {
        setSettings(d.settings)
        try { setTransferAccounts(JSON.parse(d.settings.payment_transfer || '[]')) } catch { setTransferAccounts([]) }
        try { setEwalletAccounts(JSON.parse(d.settings.payment_ewallet || '[]')) } catch { setEwalletAccounts([]) }
      }
    }).finally(() => setLoading(false))
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...settings,
      shipping_fee: String(settings.shipping_fee || ''),
      free_shipping_minimum: String(settings.free_shipping_minimum || ''),
      store_address_full: settings.store_address_full || '',
      pickup_estimate: settings.pickup_estimate || '',
      cod_enabled: settings.cod_enabled === true || settings.cod_enabled === 'true' ? 'true' : 'false',
      payment_transfer: JSON.stringify(transferAccounts),
      payment_ewallet: JSON.stringify(ewalletAccounts),
    }
    try {
      await api('/admin/settings', { method: 'PUT', body: JSON.stringify(payload) })
      addToast('Pengaturan pengiriman & pembayaran berhasil disimpan', 'success')
    } catch (err) {
      addToast(err.message || 'Gagal menyimpan pengaturan', 'error')
    }
    setSaving(false)
  }

  function addTransfer() { setTransferAccounts(prev => [...prev, { bank: '', account: '', name: '' }]) }
  function removeTransfer(i) { setTransferAccounts(prev => prev.filter((_, idx) => idx !== i)) }
  function updateTransfer(i, field, value) { setTransferAccounts(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: value } : a)) }
  function addEwallet() { setEwalletAccounts(prev => [...prev, { provider: '', account: '', name: '' }]) }
  function removeEwallet(i) { setEwalletAccounts(prev => prev.filter((_, idx) => idx !== i)) }
  function updateEwallet(i, field, value) { setEwalletAccounts(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: value } : a)) }

  if (loading) {
    return <div className="flex items-center justify-center py-[64px]"><div className="w-[28px] h-[28px] border-[3px] border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <form onSubmit={handleSave} className="space-y-[16px]">
      <div className="bg-card rounded-[13px] border border-subtle overflow-hidden">
        <div className="px-[16px] md:px-[24px] py-[14px] md:py-[16px] border-b border-subtle flex items-center gap-[8px] md:gap-[10px]">
          <Truck size={16} className="md:size-[18px] text-brand-600" />
          <h2 className="text-[15px] md:text-[16px] font-semibold text-primary">Biaya Pengiriman</h2>
        </div>
        <div className="p-[16px] md:p-[24px] space-y-[12px] md:space-y-[16px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px] md:gap-[16px]">
            <div>
              <label className="block text-[13px] font-medium text-secondary mb-[4px]">Ongkos Kirim (Rp)</label>
              <div className="relative">
                <Truck size={16} className="absolute left-[13px] top-1/2 -translate-y-1/2 text-muted" />
                <input type="number" value={settings.shipping_fee || ''} onChange={(e) => setSettings({ ...settings, shipping_fee: e.target.value })}
                  placeholder="10000" min="0"
                  className="w-full h-[44px] pl-[38px] pr-[14px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500"
                />
              </div>
              <p className="text-[11px] text-muted mt-[4px]">Biaya pengiriman untuk metode Antar</p>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-secondary mb-[4px]">Gratis Ongkir Minimal (Rp)</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-[13px] top-1/2 -translate-y-1/2 text-muted" />
                <input type="number" value={settings.free_shipping_minimum || ''} onChange={(e) => setSettings({ ...settings, free_shipping_minimum: e.target.value })}
                  placeholder="50000" min="0"
                  className="w-full h-[44px] pl-[38px] pr-[14px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500"
                />
              </div>
              <p className="text-[11px] text-muted mt-[4px]">Pembelian minimal untuk gratis ongkir (0 = nonaktif)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-[13px] border border-subtle overflow-hidden">
        <div className="px-[16px] md:px-[24px] py-[14px] md:py-[16px] border-b border-subtle flex items-center gap-[8px] md:gap-[10px]">
          <Store size={16} className="md:size-[18px] text-brand-600" />
          <h2 className="text-[15px] md:text-[16px] font-semibold text-primary">Metode Jemput (Ambil di Toko)</h2>
        </div>
        <div className="p-[16px] md:p-[24px] space-y-[12px] md:space-y-[16px]">
          <div>
            <label className="block text-[13px] font-medium text-secondary mb-[4px]">Alamat Toko</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-[13px] top-[13px] text-muted" />
              <textarea rows={3} value={settings.store_address_full || ''} onChange={(e) => setSettings({ ...settings, store_address_full: e.target.value })}
                placeholder="Jl. Merdeka No. 123, Bandung"
                className="w-full pl-[38px] pr-[14px] py-[10px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500 resize-none leading-relaxed"
              />
            </div>
            <p className="text-[11px] text-muted mt-[4px]">Alamat lengkap toko untuk metode pengambilan</p>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-secondary mb-[4px]">Estimasi Waktu Siap</label>
            <input value={settings.pickup_estimate || ''} onChange={(e) => setSettings({ ...settings, pickup_estimate: e.target.value })}
              placeholder="30-45 menit"
              className="w-full h-[44px] px-[14px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500"
            />
            <p className="text-[11px] text-muted mt-[4px]">Estimasi waktu sampai pesanan siap diambil</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-[13px] border border-subtle overflow-hidden">
        <div className="px-[16px] md:px-[24px] py-[14px] md:py-[16px] border-b border-subtle flex items-center gap-[8px] md:gap-[10px]">
          <CreditCard size={16} className="md:size-[18px] text-brand-600" />
          <h2 className="text-[15px] md:text-[16px] font-semibold text-primary">Metode Pembayaran</h2>
        </div>
        <div className="p-[16px] md:p-[24px] space-y-[12px] md:space-y-[16px]">
          <div className="flex items-center justify-between p-[14px] rounded-[8px] bg-surface border border-subtle">
            <div className="flex items-center gap-[10px]">
              <Banknote size={18} className="text-green-600" />
              <div>
                <div className="text-[14px] font-medium text-primary">COD (Bayar di Tempat)</div>
                <p className="text-[12px] text-muted">Pelanggan membayar tunai/QRIS saat pesanan diterima</p>
              </div>
            </div>
            <button type="button" onClick={() => setSettings({ ...settings, cod_enabled: settings.cod_enabled === 'true' ? 'false' : 'true' })}
              className={`relative w-[50px] h-[28px] rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500/30 shrink-0 ${
                settings.cod_enabled === 'true' || settings.cod_enabled === true ? 'bg-brand-600' : 'bg-stone-200 dark:bg-stone-700'
              }`}
            >
              <span className={`absolute top-[2px] left-[2px] w-[24px] h-[24px] rounded-full bg-white shadow-sm transition-all duration-200 ease-in-out ${
                settings.cod_enabled === 'true' || settings.cod_enabled === true ? 'translate-x-[22px]' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-[13px] border border-subtle overflow-hidden">
        <div className="px-[16px] md:px-[24px] py-[14px] md:py-[16px] border-b border-subtle flex items-center gap-[8px] md:gap-[10px]">
          <Landmark size={16} className="md:size-[18px] text-brand-600" />
          <h2 className="text-[15px] md:text-[16px] font-semibold text-primary">Transfer Bank</h2>
        </div>
        <div className="p-[16px] md:p-[24px] space-y-[8px] md:space-y-[10px]">
          {transferAccounts.map((acc, i) => (
            <div key={i} className="flex gap-[8px] md:gap-[10px] items-start p-[12px] md:p-[14px] rounded-[8px] bg-surface border border-subtle">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-[6px] md:gap-[8px]">
                <input value={acc.bank} onChange={(e) => updateTransfer(i, 'bank', e.target.value)} placeholder="Nama Bank"
                  className="h-[38px] md:h-[40px] px-[10px] md:px-[12px] rounded-[7px] bg-card border border-subtle text-primary text-[13px] md:text-[14px] focus:outline-none focus:border-brand-500"
                />
                <input value={acc.account} onChange={(e) => updateTransfer(i, 'account', e.target.value)} placeholder="No. Rekening"
                  className="h-[38px] md:h-[40px] px-[10px] md:px-[12px] rounded-[7px] bg-card border border-subtle text-primary text-[13px] md:text-[14px] focus:outline-none focus:border-brand-500"
                />
                <input value={acc.name} onChange={(e) => updateTransfer(i, 'name', e.target.value)} placeholder="Atas Nama"
                  className="h-[38px] md:h-[40px] px-[10px] md:px-[12px] rounded-[7px] bg-card border border-subtle text-primary text-[13px] md:text-[14px] focus:outline-none focus:border-brand-500"
                />
              </div>
              <button type="button" onClick={() => removeTransfer(i)} className="p-[7px] md:p-[8px] rounded-[7px] text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={14} className="md:size-[15px]" /></button>
            </div>
          ))}
          <button type="button" onClick={addTransfer}
            className="flex items-center gap-[6px] px-[12px] md:px-[14px] py-[8px] md:py-[9px] rounded-[7px] border border-dashed border-subtle text-[13px] md:text-[14px] text-secondary hover:text-primary hover:border-brand-500 transition-colors"
          >
            <Plus size={13} className="md:size-[14px]" /> Tambah Rekening
          </button>
        </div>
      </div>

      <div className="bg-card rounded-[13px] border border-subtle overflow-hidden">
        <div className="px-[16px] md:px-[24px] py-[14px] md:py-[16px] border-b border-subtle flex items-center gap-[8px] md:gap-[10px]">
          <Wallet size={16} className="md:size-[18px] text-brand-600" />
          <h2 className="text-[15px] md:text-[16px] font-semibold text-primary">E-Wallet</h2>
        </div>
        <div className="p-[16px] md:p-[24px] space-y-[8px] md:space-y-[10px]">
          {ewalletAccounts.map((acc, i) => (
            <div key={i} className="flex gap-[8px] md:gap-[10px] items-start p-[12px] md:p-[14px] rounded-[8px] bg-surface border border-subtle">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-[6px] md:gap-[8px]">
                <input value={acc.provider} onChange={(e) => updateEwallet(i, 'provider', e.target.value)} placeholder="Provider"
                  className="h-[38px] md:h-[40px] px-[10px] md:px-[12px] rounded-[7px] bg-card border border-subtle text-primary text-[13px] md:text-[14px] focus:outline-none focus:border-brand-500"
                />
                <input value={acc.account} onChange={(e) => updateEwallet(i, 'account', e.target.value)} placeholder="No. Akun"
                  className="h-[38px] md:h-[40px] px-[10px] md:px-[12px] rounded-[7px] bg-card border border-subtle text-primary text-[13px] md:text-[14px] focus:outline-none focus:border-brand-500"
                />
                <input value={acc.name} onChange={(e) => updateEwallet(i, 'name', e.target.value)} placeholder="Atas Nama"
                  className="h-[38px] md:h-[40px] px-[10px] md:px-[12px] rounded-[7px] bg-card border border-subtle text-primary text-[13px] md:text-[14px] focus:outline-none focus:border-brand-500"
                />
              </div>
              <button type="button" onClick={() => removeEwallet(i)} className="p-[7px] md:p-[8px] rounded-[7px] text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={14} className="md:size-[15px]" /></button>
            </div>
          ))}
          <button type="button" onClick={addEwallet}
            className="flex items-center gap-[6px] px-[12px] md:px-[14px] py-[8px] md:py-[9px] rounded-[7px] border border-dashed border-subtle text-[13px] md:text-[14px] text-secondary hover:text-primary hover:border-brand-500 transition-colors"
          >
            <Plus size={13} className="md:size-[14px]" /> Tambah E-Wallet
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={saving}
          className="flex items-center gap-[8px] px-[20px] md:px-[24px] py-[10px] md:py-[11px] rounded-[8px] bg-brand-600 text-white text-[13px] md:text-[14px] font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors">
          <Save size={15} className="md:size-[16px]" /> {saving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}
        </button>
      </div>
    </form>
  )
}

function StoreSection() {
  const { addToast } = useToast()
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api('/admin/settings').then(d => {
      if (d.settings) setSettings(d.settings)
    }).finally(() => setLoading(false))
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api('/admin/settings', { method: 'PUT', body: JSON.stringify(settings) })
      addToast('Pengaturan toko berhasil disimpan', 'success')
    } catch (err) {
      addToast(err.message || 'Gagal menyimpan pengaturan', 'error')
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="flex items-center justify-center py-[64px]"><div className="w-[28px] h-[28px] border-[3px] border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  const infoFields = [
    { key: 'store_name', label: 'Nama Toko', icon: Store, full: true },
    { key: 'store_description', label: 'Deskripsi', icon: Building2, full: true, textarea: true },
    { key: 'store_address', label: 'Alamat', icon: Building2, full: true, textarea: true },
    { key: 'store_phone', label: 'No. Telepon', icon: Smartphone, full: false },
    { key: 'store_email', label: 'Email', icon: Smartphone, full: false },
    { key: 'whatsapp_number', label: 'No. WhatsApp', icon: Smartphone, full: false },
    { key: 'instagram', label: 'Instagram', icon: Smartphone, full: false },
  ]

  return (
    <form onSubmit={handleSave} className="space-y-[16px]">
      <div className="bg-card rounded-[13px] border border-subtle overflow-hidden">
        <div className="px-[16px] md:px-[24px] py-[14px] md:py-[16px] border-b border-subtle flex items-center gap-[8px] md:gap-[10px]">
          <Store size={16} className="md:size-[18px] text-brand-600" />
          <h2 className="text-[15px] md:text-[16px] font-semibold text-primary">Profil Toko</h2>
        </div>
        <div className="p-[16px] md:p-[24px] grid grid-cols-1 md:grid-cols-2 gap-[12px] md:gap-[16px]">
          {infoFields.map((f) => {
            const FIcon = f.icon
            return (
            <div key={f.key} className={f.full ? 'md:col-span-2' : ''}>
              <label className="block text-[13px] font-medium text-secondary mb-[4px]">{f.label}</label>
              {f.textarea ? (
                <div className="relative">
                  <FIcon size={16} className="absolute left-[13px] top-[13px] text-muted" />
                  <textarea rows={3} value={settings[f.key] || ''} onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
                    className="w-full pl-[38px] pr-[14px] py-[10px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500 resize-none leading-relaxed"
                  />
                </div>
              ) : (
                <div className="relative">
                  <FIcon size={16} className="absolute left-[13px] top-1/2 -translate-y-1/2 text-muted" />
                  <input value={settings[f.key] || ''} onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
                    className="w-full h-[44px] pl-[38px] pr-[14px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500"
                  />
                </div>
              )}
            </div>
            )
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={saving}
          className="flex items-center gap-[8px] px-[20px] md:px-[24px] py-[10px] md:py-[11px] rounded-[8px] bg-brand-600 text-white text-[13px] md:text-[14px] font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors">
          <Save size={15} className="md:size-[16px]" /> {saving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}
        </button>
      </div>
    </form>
  )
}

function MaintenanceSection() {
  const { addToast } = useToast()
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hours, setHours] = useState({})

  useEffect(() => {
    api('/admin/settings').then(d => {
      if (d.settings) {
        setSettings(d.settings)
        try { setHours(JSON.parse(d.settings.operational_hours || '{}')) } catch { setHours({}) }
      }
    }).finally(() => setLoading(false))
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const payload = { ...settings, operational_hours: JSON.stringify(hours) }

    if (settings.store_status === 'tutup_sementara' && payload.maintenance_duration) {
      const now = new Date()
      const dur = payload.maintenance_duration
      let ms = 0
      if (dur === '30m') ms = 30 * 60 * 1000
      else if (dur === '90m') ms = 90 * 60 * 1000
      else if (dur === '1h') ms = 60 * 60 * 1000
      else if (dur === '3h') ms = 3 * 60 * 60 * 1000
      else if (dur === '6h') ms = 6 * 60 * 60 * 1000
      else if (dur === '1day') ms = 24 * 60 * 60 * 1000
      payload.maintenance_until = new Date(now.getTime() + ms).toISOString()
    } else {
      payload.maintenance_until = ''
    }

    try {
      await api('/admin/settings', { method: 'PUT', body: JSON.stringify(payload) })
      addToast('Pengaturan maintenance berhasil disimpan', 'success')
    } catch (err) {
      addToast(err.message || 'Gagal menyimpan pengaturan', 'error')
    }
    setSaving(false)
  }

  function updateDay(key, field, value) {
    setHours(prev => ({ ...prev, [key]: { ...(prev[key] || {}), [field]: value } }))
  }

  function applyAllDays(open, close) {
    const updated = {}
    days.forEach(d => {
      updated[d.key] = { ...(hours[d.key] || {}), open, close, active: true }
    })
    setHours(updated)
  }

  if (loading) {
    return <div className="flex items-center justify-center py-[64px]"><div className="w-[28px] h-[28px] border-[3px] border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  const statusOptions = [
    { value: 'open', label: 'Buka', color: 'text-green-700 bg-green-50 border-green-200' },
    { value: 'tutup_sementara', label: 'Tutup Sementara', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
    { value: 'tutup', label: 'Tutup', color: 'text-red-700 bg-red-50 border-red-200' },
  ]

  const durationOptions = [
    { value: '30m', label: '30 Menit' },
    { value: '90m', label: '90 Menit' },
    { value: '1h', label: '1 Jam' },
    { value: '3h', label: '3 Jam' },
    { value: '6h', label: '6 Jam' },
    { value: '1day', label: '1 Hari' },
    { value: 'until_update', label: 'Sampai Update Manual' },
  ]

  return (
    <form onSubmit={handleSave} className="space-y-[16px]">
      <div className="bg-card rounded-[13px] border border-subtle overflow-hidden">
        <div className="px-[16px] md:px-[24px] py-[14px] md:py-[16px] border-b border-subtle flex items-center gap-[8px] md:gap-[10px]">
          <Wrench size={16} className="md:size-[18px] text-brand-600" />
          <h2 className="text-[15px] md:text-[16px] font-semibold text-primary">Status Toko</h2>
        </div>
        <div className="p-[16px] md:p-[24px] space-y-[12px] md:space-y-[16px]">
          <div className="flex flex-wrap gap-[6px] md:gap-[8px]">
            {statusOptions.map((opt) => (
              <button key={opt.value} type="button" onClick={() => setSettings({ ...settings, store_status: opt.value, maintenance_duration: opt.value === 'tutup_sementara' ? settings.maintenance_duration || '30m' : '' })}
                className={`px-[16px] md:px-[20px] py-[9px] md:py-[11px] rounded-[8px] text-[13px] md:text-[14px] font-medium border transition-colors ${
                  settings.store_status === opt.value ? `${opt.color} border-2` : 'bg-surface text-secondary border-subtle hover:text-primary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {settings.store_status === 'tutup_sementara' && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-[8px]">
                <label className="block text-[13px] font-medium text-secondary mb-[4px]">Durasi Tutup Sementara</label>
                <div className="flex flex-wrap gap-[6px]">
                  {durationOptions.map((opt) => (
                    <button key={opt.value} type="button" onClick={() => setSettings({ ...settings, maintenance_duration: opt.value })}
                  className={`px-[12px] md:px-[14px] py-[8px] md:py-[9px] rounded-[7px] text-[12px] md:text-[13px] font-medium border transition-colors ${
                    settings.maintenance_duration === opt.value ? 'bg-brand-600 text-white border-brand-600' : 'bg-surface text-secondary border-subtle hover:text-primary'
                  }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {settings.maintenance_until && (
                  <p className="text-[12px] text-muted">Aktif sampai: {new Date(settings.maintenance_until).toLocaleString('id-ID')}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {settings.store_status === 'tutup_sementara' && settings.maintenance_until && new Date(settings.maintenance_until) > new Date() && (
            <div className="flex items-center gap-[8px] px-[16px] py-[11px] rounded-[8px] bg-yellow-50 border border-yellow-200 text-[14px] text-yellow-700">
              <div className="w-[8px] h-[8px] rounded-full bg-yellow-500 animate-pulse" />
              Toko sedang tutup sementara &mdash; akan buka otomatis pada {new Date(settings.maintenance_until).toLocaleString('id-ID')}
            </div>
          )}
        </div>
      </div>

      <div className="bg-card rounded-[13px] border border-subtle overflow-hidden">
        <div className="px-[16px] md:px-[24px] py-[14px] md:py-[16px] border-b border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-[10px]">
          <div className="flex items-center gap-[8px] md:gap-[10px]">
            <Wrench size={16} className="md:size-[18px] text-brand-600" />
            <h2 className="text-[15px] md:text-[16px] font-semibold text-primary">Jam Operasional</h2>
          </div>
          <div className="flex items-center gap-[6px] flex-wrap">
            <span className="text-[11px] text-muted">Terapkan ke semua:</span>
            <ApplyAllTimes onApply={applyAllDays} />
          </div>
        </div>
        <div className="p-[16px] md:p-[24px] space-y-[4px] md:space-y-[6px]">
          {days.map((d) => {
            const day = hours[d.key] || {}
            return (
              <div key={d.key} className="flex flex-col sm:flex-row sm:items-center gap-[6px] sm:gap-[10px] p-[10px] rounded-[8px] bg-surface border border-subtle">
                <div className="w-full sm:w-[70px] shrink-0">
                  <label className="flex items-center gap-[6px] cursor-pointer">
                    <input type="checkbox" checked={day.active !== false} onChange={(e) => updateDay(d.key, 'active', e.target.checked)}
                      className="w-[16px] h-[16px] rounded-[4px] accent-brand-600" />
                    <span className={`text-[13px] md:text-[14px] font-medium ${day.active !== false ? 'text-primary' : 'text-muted'}`}>{d.label}</span>
                  </label>
                </div>
                <div className="flex items-center gap-[4px] md:gap-[6px] flex-1">
                  <input type="time" value={day.open || ''} disabled={day.active === false} onChange={(e) => updateDay(d.key, 'open', e.target.value)}
                    className={`flex-1 h-[34px] md:h-[38px] px-[8px] md:px-[10px] rounded-[6px] border text-[13px] md:text-[14px] focus:outline-none focus:border-brand-500 ${day.active !== false ? 'bg-card border-subtle text-primary' : 'bg-surface border-dashed border-subtle text-muted'}`}
                  />
                  <span className="text-muted text-[12px]">&mdash;</span>
                  <input type="time" value={day.close || ''} disabled={day.active === false} onChange={(e) => updateDay(d.key, 'close', e.target.value)}
                    className={`flex-1 h-[34px] md:h-[38px] px-[8px] md:px-[10px] rounded-[6px] border text-[13px] md:text-[14px] focus:outline-none focus:border-brand-500 ${day.active !== false ? 'bg-card border-subtle text-primary' : 'bg-surface border-dashed border-subtle text-muted'}`}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={saving}
          className="flex items-center gap-[8px] px-[20px] md:px-[24px] py-[10px] md:py-[11px] rounded-[8px] bg-brand-600 text-white text-[13px] md:text-[14px] font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors">
          <Save size={15} className="md:size-[16px]" /> {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>
    </form>
  )
}

const statusMeta = {
  active: { label: 'Aktif', color: 'bg-green-50 text-green-700' },
  suspended: { label: 'Ditangguhkan', color: 'bg-yellow-50 text-yellow-700' },
  blocked: { label: 'Diblokir', color: 'bg-red-50 text-red-700' },
}

function UsersSection() {
  const { addToast } = useToast()
  const { confirm } = useConfirm()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [processing, setProcessing] = useState(null)

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    const d = await api('/admin/users')
    setUsers(d.users || [])
    setLoading(false)
  }

  async function toggleRole(userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    const action = newRole === 'admin' ? 'Jadikan Admin' : 'Hapus Admin'
    const ok = await confirm({ title: `${action}?`, message: `Yakin ingin mengubah role pengguna ini?`, confirmText: action, variant: 'warning' })
    if (!ok) return
    setProcessing(`role-${userId}`)
    try {
      const d = await api(`/admin/users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role: newRole }) })
      addToast(`Role berhasil diubah`, 'success')
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    } catch (err) {
      addToast(err.message || 'Gagal mengubah role', 'error')
    }
    setProcessing(null)
  }

  async function updateStatus(userId, status) {
    const statusLabel = { active: 'Aktif', suspended: 'Ditangguhkan', blocked: 'Diblokir' }
    const ok = await confirm({ title: `${statusLabel[status]}kan Pengguna?`, message: `Yakin ingin mengubah status pengguna ini menjadi "${statusLabel[status]}"?`, confirmText: 'Ya, Ubah', variant: status === 'blocked' ? 'danger' : 'warning' })
    if (!ok) return
    setProcessing(`status-${userId}`)
    try {
      await api(`/admin/users/${userId}/status`, { method: 'PUT', body: JSON.stringify({ status }) })
      addToast(`Status berhasil diubah`, 'success')
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u))
    } catch (err) {
      addToast(err.message || 'Gagal mengubah status', 'error')
    }
    setProcessing(null)
  }

  async function handleDelete(userId) {
    const ok = await confirm({ title: 'Hapus Pengguna?', message: 'Pengguna ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.', confirmText: 'Hapus', variant: 'danger' })
    if (!ok) return
    setProcessing(`delete-${userId}`)
    try {
      await api(`/admin/users/${userId}`, { method: 'DELETE' })
      addToast('Pengguna berhasil dihapus', 'success')
      setUsers(prev => prev.filter(u => u.id !== userId))
    } catch (err) {
      addToast(err.message || 'Gagal menghapus pengguna', 'error')
    }
    setProcessing(null)
  }

  const filtered = users.filter((u) => {
    if (!search) return true
    const q = search.toLowerCase()
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.toLowerCase().includes(q)
  })

  if (loading) {
    return <div className="flex items-center justify-center py-[64px]"><div className="w-[28px] h-[28px] border-[3px] border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-[12px]">
      <div className="relative max-w-[320px]">
        <SearchIcon size={16} className="absolute left-[14px] top-1/2 -translate-y-1/2 text-muted" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama, email, atau no. HP..."
          className="w-full h-[44px] pl-[42px] pr-[14px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500"
        />
      </div>
      <div className="space-y-[8px]">
        {filtered.map((u) => {
          const sm = statusMeta[u.status] || statusMeta.active
          return (
            <div key={u.id} className="bg-card rounded-[11px] border border-subtle p-[16px]">
              <div className="flex items-start justify-between gap-[10px]">
                <div className="flex items-center gap-[12px] min-w-0 flex-1">
                  <div className={`w-[36px] h-[36px] md:w-[40px] md:h-[40px] rounded-full flex items-center justify-center text-[12px] md:text-[13px] font-semibold shrink-0 ${
                    u.status === 'blocked' ? 'bg-red-100 text-red-600' :
                    u.status === 'suspended' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-brand-100 text-brand-600'
                  }`}>
                    {u.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-[6px] flex-wrap">
                      <span className="text-[15px] font-semibold text-primary">{u.name}</span>
                      {u.role === 'admin' && <span className="text-[10px] font-medium text-brand-600 bg-brand-50 px-[6px] py-[2px] rounded-full">Admin</span>}
                      <span className={`text-[10px] font-medium px-[6px] py-[2px] rounded-full ${sm.color}`}>{sm.label}</span>
                    </div>
                    <p className="text-[13px] text-secondary mt-[2px]">{u.email}</p>
                    {u.phone && <p className="text-[12px] text-muted">{u.phone}</p>}
                    <p className="text-[11px] text-muted mt-[2px]">Bergabung {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex gap-[4px] shrink-0">
                  <button onClick={() => toggleRole(u.id, u.role)} disabled={processing === `role-${u.id}`}
                    className="p-[7px] rounded-[6px] text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-30"
                    title={u.role === 'admin' ? 'Hapus Admin' : 'Jadikan Admin'}
                  >{u.role === 'admin' ? <ShieldOff size={14} /> : <Shield size={14} />}</button>
                  {(u.status === 'active' || u.status === 'suspended') && (
                    <button onClick={() => updateStatus(u.id, u.status === 'active' ? 'suspended' : 'active')} disabled={processing === `status-${u.id}`}
                      className="p-[7px] rounded-[6px] text-yellow-600 hover:bg-yellow-50 transition-colors disabled:opacity-30"
                      title={u.status === 'active' ? 'Tangguhkan' : 'Aktifkan'}
                    >{u.status === 'active' ? <AlertTriangle size={14} /> : <UserCheck size={14} />}</button>
                  )}
                  {u.status !== 'blocked' && (
                    <button onClick={() => updateStatus(u.id, 'blocked')} disabled={processing === `status-${u.id}`}
                      className="p-[7px] rounded-[6px] text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30"
                      title="Blokir"
                    ><UserX size={14} /></button>
                  )}
                  <button onClick={() => handleDelete(u.id)} disabled={processing === `delete-${u.id}`}
                    className="p-[7px] rounded-[6px] text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30"
                    title="Hapus"
                  ><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-[15px] text-muted text-center py-[34px]">Tidak ada pengguna</p>
        )}
      </div>
    </div>
  )
}
