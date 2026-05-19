import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  User, Mail, Phone, Lock, Eye, EyeOff, LogOut, Save,
  ChevronRight, Shield, Bell, MapPin, Trash2,
  Plus, Pencil, Star, X, Home, Building, MapPinned,
} from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import { useToast } from '../lib/useToast'
import { api } from '../lib/api'

const sections = [
  { id: 'akun', label: 'Informasi Akun', icon: User },
  { id: 'keamanan', label: 'Keamanan', icon: Shield },
  { id: 'alamat', label: 'Alamat Tersimpan', icon: MapPin },
  { id: 'notifikasi', label: 'Notifikasi', icon: Bell },
]

const addressLabels = [
  { value: 'Rumah', icon: Home },
  { value: 'Kantor', icon: Building },
  { value: 'Lainnya', icon: MapPinned },
]

export default function Profile() {
  useEffect(() => { document.title = 'Profil - Arazel Store' }, [])
  const { user, logout, updateProfile, updatePassword } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [activeSection, setActiveSection] = useState('akun')

  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [saving, setSaving] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showCur, setShowCur] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [changing, setChanging] = useState(false)

  const [notifEmail, setNotifEmail] = useState(true)
  const [notifOrder, setNotifOrder] = useState(true)
  const [notifPromo, setNotifPromo] = useState(false)

  const [addresses, setAddresses] = useState([])
  const [addrLoading, setAddrLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [formData, setFormData] = useState({
    label: 'Rumah',
    recipientName: '',
    recipientPhone: '',
    streetAddress: '',
    notes: '',
    isDefault: false,
  })
  const [savingAddr, setSavingAddr] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    if (activeSection === 'alamat') fetchAddresses()
  }, [activeSection])

  async function fetchAddresses() {
    setAddrLoading(true)
    try {
      const data = await api('/addresses')
      setAddresses(data.addresses)
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setAddrLoading(false)
    }
  }

  function openAddForm() {
    setEditId(null)
    setFormData({
      label: 'Rumah',
      recipientName: '',
      recipientPhone: '',
      streetAddress: '',
      notes: '',
      isDefault: addresses.length === 0,
    })
    setShowForm(true)
  }

  function openEditForm(addr) {
    setEditId(addr.id)
    setFormData({
      label: addr.label,
      recipientName: addr.recipient_name,
      recipientPhone: addr.recipient_phone,
      streetAddress: addr.street_address,
      notes: addr.notes || '',
      isDefault: Boolean(addr.is_default),
    })
    setShowForm(true)
  }

  async function handleSubmitForm(e) {
    e.preventDefault()
    if (!formData.recipientName || !formData.recipientPhone || !formData.streetAddress) {
      addToast('Lengkapi semua field wajib', 'error')
      return
    }
    setSavingAddr(true)
    try {
      if (editId) {
        await api(`/addresses/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        addToast('Alamat berhasil diperbarui')
      } else {
        await api('/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        addToast('Alamat berhasil ditambahkan')
      }
      setShowForm(false)
      await fetchAddresses()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSavingAddr(false)
    }
  }

  async function handleDelete(id) {
    setDeletingId(id)
    try {
      await api(`/addresses/${id}`, { method: 'DELETE' })
      addToast('Alamat berhasil dihapus')
      await fetchAddresses()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleSetDefault(id) {
    try {
      await api(`/addresses/${id}/default`, { method: 'PUT' })
      addToast('Alamat utama berhasil diubah')
      await fetchAddresses()
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  async function handleProfile(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateProfile(name, phone)
      addToast('Profil berhasil diperbarui')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handlePassword(e) {
    e.preventDefault()
    setChanging(true)
    try {
      await updatePassword(currentPassword, newPassword)
      addToast('Password berhasil diubah')
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setChanging(false)
    }
  }

  function handleLogout() {
    logout()
    addToast('Berhasil keluar')
    navigate('/')
  }

  if (!user) return null

  return (
    <div className="max-w-4xl mx-auto px-[21px] py-[55px]">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-[13px] mb-[34px]">
          <div className="w-[55px] h-[55px] rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
            <User size={26} className="text-brand-600" />
          </div>
          <div>
            <h1 className="text-[24px] font-bold text-primary">Manajemen Akun</h1>
            <p className="text-[14px] text-secondary">{user.email}</p>
          </div>
        </div>

        <div className="md:grid md:grid-cols-[240px_1fr] md:gap-[21px] items-start">
          <div className="bg-card rounded-[13px] border border-subtle overflow-hidden mb-[13px] md:mb-0">
            {sections.map((sec) => {
              const Icon = sec.icon
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full flex items-center gap-[10px] px-[16px] py-[12px] text-[13px] font-medium transition-colors text-left ${
                    activeSection === sec.id
                      ? 'bg-brand-50 dark:bg-brand-900/10 text-brand-600 border-r-[3px] border-brand-600'
                      : 'text-secondary hover:text-primary hover:bg-surface-secondary'
                  }`}
                >
                  <Icon size={16} className="shrink-0" />
                  <span className="flex-1">{sec.label}</span>
                  <ChevronRight size={14} className="text-muted" />
                </button>
              )
            })}
            <div className="border-t border-subtle mt-[4px] pt-[4px]">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-[10px] px-[16px] py-[12px] text-[13px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
              >
                <LogOut size={16} className="shrink-0" />
                <span className="flex-1">Keluar</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="bg-card rounded-[13px] border border-subtle p-[21px]">
            {activeSection === 'akun' && (
              <form onSubmit={handleProfile} className="space-y-[13px]">
                <div className="flex items-center gap-[8px] pb-[13px] border-b border-subtle mb-[13px]">
                  <User size={18} className="text-brand-600" />
                  <h2 className="text-[16px] font-semibold text-primary">Informasi Akun</h2>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-secondary mb-[4px]">Nama Lengkap</label>
                  <div className="relative">
                    <User size={15} className="absolute left-[13px] top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-[42px] pl-[38px] pr-[13px] rounded-[8px] bg-surface border border-subtle text-primary text-[14px] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-secondary mb-[4px]">Email</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-[13px] top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full h-[42px] pl-[38px] pr-[13px] rounded-[8px] bg-surface/50 border border-subtle text-muted text-[14px] cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-secondary mb-[4px]">Nomor HP</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-[13px] top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-[42px] pl-[38px] pr-[13px] rounded-[8px] bg-surface border border-subtle text-primary text-[14px] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary w-full justify-center h-[42px] text-[13px]"
                >
                  <Save size={15} />
                  {saving ? 'Menyimpan...' : 'Simpan Profil'}
                </button>
              </form>
            )}

            {activeSection === 'keamanan' && (
              <div className="space-y-[21px]">
                <div className="flex items-center gap-[8px] pb-[13px] border-b border-subtle">
                  <Shield size={18} className="text-brand-600" />
                  <h2 className="text-[16px] font-semibold text-primary">Keamanan</h2>
                </div>

                <form onSubmit={handlePassword} className="space-y-[13px]">
                  <h3 className="text-[13px] font-medium text-primary">Ubah Password</h3>

                  <div>
                    <label className="block text-[12px] font-medium text-secondary mb-[4px]">Password Saat Ini</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-[13px] top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        type={showCur ? 'text' : 'password'}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full h-[42px] pl-[38px] pr-[38px] rounded-[8px] bg-surface border border-subtle text-primary text-[14px] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                      />
                      <button type="button" onClick={() => setShowCur(!showCur)} className="absolute right-[13px] top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors">
                        {showCur ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-secondary mb-[4px]">Password Baru</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-[13px] top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        type={showNew ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        className="w-full h-[42px] pl-[38px] pr-[38px] rounded-[8px] bg-surface border border-subtle text-primary text-[14px] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                      />
                      <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-[13px] top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors">
                        {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={changing}
                    className="btn-primary w-full justify-center h-[42px] text-[13px]"
                  >
                    <Lock size={15} />
                    {changing ? 'Mengubah...' : 'Ubah Password'}
                  </button>
                </form>
              </div>
            )}

            {activeSection === 'alamat' && (
              <div className="space-y-[13px]">
                <div className="flex items-center justify-between pb-[13px] border-b border-subtle">
                  <div className="flex items-center gap-[8px]">
                    <MapPin size={18} className="text-brand-600" />
                    <h2 className="text-[16px] font-semibold text-primary">Alamat Tersimpan</h2>
                  </div>
                  <button
                    onClick={openAddForm}
                    className="flex items-center gap-[6px] text-[12px] font-medium text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    <Plus size={14} />
                    Tambah
                  </button>
                </div>

                {addrLoading ? (
                  <div className="flex items-center justify-center py-[34px]">
                    <div className="w-[24px] h-[24px] border-[2px] border-brand-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-[34px] text-center">
                    <MapPin size={34} className="text-muted mb-[13px]" />
                    <p className="text-[14px] text-secondary">Belum ada alamat tersimpan</p>
                    <button
                      onClick={openAddForm}
                      className="mt-[13px] flex items-center gap-[6px] text-[13px] font-medium text-brand-600 hover:text-brand-700 transition-colors"
                    >
                      <Plus size={14} />
                      Tambah Alamat Baru
                    </button>
                  </div>
                ) : (
                  <div className="space-y-[8px]">
                    {addresses.map((addr) => {
                      const LabelIcon = addressLabels.find(l => l.value === addr.label)?.icon || MapPinned
                      return (
                        <div
                          key={addr.id}
                          className={`rounded-[10px] border p-[16px] transition-colors ${
                            addr.is_default
                              ? 'border-brand-300 dark:border-brand-700 bg-brand-50/50 dark:bg-brand-900/10'
                              : 'border-subtle bg-surface-secondary/20'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-[8px]">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-[6px] mb-[4px]">
                                <LabelIcon size={14} className="text-brand-600" />
                                <span className="text-[13px] font-semibold text-primary">{addr.label}</span>
                                {addr.is_default && (
                                  <span className="flex items-center gap-[3px] text-[10px] font-medium text-brand-700 dark:text-brand-400 bg-brand-100 dark:bg-brand-900/30 px-[8px] py-[2px] rounded-full">
                                    <Star size={10} />
                                    Utama
                                  </span>
                                )}
                              </div>
                              <p className="text-[13px] font-medium text-primary">{addr.recipient_name}</p>
                              <p className="text-[11px] text-muted">{addr.recipient_phone}</p>
                              <p className="text-[12px] text-secondary mt-[4px] leading-relaxed">{addr.street_address}</p>
                              {addr.notes && (
                                <p className="text-[11px] text-muted mt-[4px] italic">Catatan: {addr.notes}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-[4px] shrink-0">
                              {!addr.is_default && (
                                <button
                                  onClick={() => handleSetDefault(addr.id)}
                                  title="Jadikan utama"
                                  className="p-[6px] rounded-[6px] text-muted hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                                >
                                  <Star size={13} />
                                </button>
                              )}
                              <button
                                onClick={() => openEditForm(addr)}
                                title="Edit"
                                className="p-[6px] rounded-[6px] text-muted hover:text-primary hover:bg-surface-secondary transition-colors"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => handleDelete(addr.id)}
                                disabled={deletingId === addr.id}
                                title="Hapus"
                                className="p-[6px] rounded-[6px] text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              >
                                {deletingId === addr.id ? (
                                  <div className="w-[13px] h-[13px] border-[2px] border-red-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Trash2 size={13} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'notifikasi' && (
              <div className="space-y-[13px]">
                <div className="flex items-center gap-[8px] pb-[13px] border-b border-subtle">
                  <Bell size={18} className="text-brand-600" />
                  <h2 className="text-[16px] font-semibold text-primary">Notifikasi</h2>
                </div>
                <div className="space-y-[8px]">
                  <ToggleRow label="Email notifikasi pesanan" desc="Pemberitahuan status pesanan via email" checked={notifOrder} onChange={setNotifOrder} />
                  <ToggleRow label="Email promo & penawaran" desc="Info diskon dan promo terbaru" checked={notifPromo} onChange={setNotifPromo} />
                  <ToggleRow label="Email aktivitas akun" desc="Notifikasi login dan perubahan akun" checked={notifEmail} onChange={setNotifEmail} />
                </div>
                <p className="text-[11px] text-muted pt-[8px] border-t border-subtle">
                  Pengaturan notifikasi akan tersimpan secara otomatis.
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-[21px] bg-black/40 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[500px] bg-card rounded-[13px] border border-subtle shadow-2xl"
            >
              <div className="flex items-center justify-between px-[21px] pt-[21px] pb-[13px] border-b border-subtle">
                <h2 className="text-[16px] font-semibold text-primary flex items-center gap-[8px]">
                  <MapPin size={18} className="text-brand-600" />
                  {editId ? 'Edit Alamat' : 'Tambah Alamat Baru'}
                </h2>
                <button onClick={() => setShowForm(false)} className="p-[6px] rounded-[6px] text-muted hover:text-primary hover:bg-surface-secondary transition-colors">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmitForm} className="p-[21px] space-y-[13px]">
                <div>
                  <label className="block text-[12px] font-medium text-secondary mb-[4px]">Label Alamat</label>
                  <div className="grid grid-cols-3 gap-[8px]">
                    {addressLabels.map((l) => {
                      const Icon = l.icon
                      return (
                        <button
                          key={l.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, label: l.value })}
                          className={`flex items-center justify-center gap-[6px] h-[38px] rounded-[8px] border text-[12px] font-medium transition-colors ${
                            formData.label === l.value
                              ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/10 text-brand-700'
                              : 'border-subtle text-secondary hover:text-primary hover:bg-surface-secondary'
                          }`}
                        >
                          <Icon size={14} />
                          {l.value}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-[8px]">
                  <div>
                    <label className="block text-[12px] font-medium text-secondary mb-[4px]">Nama Penerima</label>
                    <input
                      type="text"
                      required
                      value={formData.recipientName}
                      onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                      placeholder="Nama penerima"
                      className="w-full h-[38px] px-[13px] rounded-[8px] bg-surface border border-subtle text-primary text-[13px] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-secondary mb-[4px]">No. HP Penerima</label>
                    <input
                      type="tel"
                      required
                      value={formData.recipientPhone}
                      onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                      placeholder="08xxxxxxxxxx"
                      className="w-full h-[38px] px-[13px] rounded-[8px] bg-surface border border-subtle text-primary text-[13px] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-secondary mb-[4px]">Alamat Lengkap</label>
                  <textarea
                    required
                    value={formData.streetAddress}
                    onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                    placeholder="Jalan, gang, nomor rumah, RT/RW, kelurahan, kecamatan, kota, kode pos"
                    rows={3}
                    className="w-full px-[13px] py-[10px] rounded-[8px] bg-surface border border-subtle text-primary text-[13px] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-secondary mb-[4px]">Catatan <span className="text-muted">(opsional)</span></label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Contoh: Dekat gerbang hijau, patung XYZ"
                    className="w-full h-[38px] px-[13px] rounded-[8px] bg-surface border border-subtle text-primary text-[13px] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                  />
                </div>

                <label className="flex items-center gap-[8px] cursor-pointer">
                  <div className={`relative w-[38px] h-[22px] rounded-full transition-colors shrink-0 ${
                    formData.isDefault ? 'bg-brand-600' : 'bg-surface-secondary border border-subtle'
                  }`}>
                    <div className={`absolute top-[2px] left-[2px] w-[16px] h-[16px] rounded-full bg-white shadow-sm transition-transform ${
                      formData.isDefault ? 'translate-x-[18px]' : ''
                    }`} />
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="sr-only"
                  />
                  <span className="text-[12px] text-secondary">Jadikan alamat utama</span>
                </label>

                <div className="flex gap-[8px] pt-[4px]">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 h-[38px] rounded-[8px] border border-subtle text-secondary text-[12px] font-medium hover:text-primary hover:bg-surface-secondary transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={savingAddr}
                    className="flex-1 h-[38px] rounded-[8px] bg-brand-600 text-white text-[12px] font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
                  >
                    {savingAddr ? 'Menyimpan...' : editId ? 'Simpan Perubahan' : 'Tambah Alamat'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ToggleRow({ label, desc, checked, onChange }) {
  return (
    <label className="flex items-start gap-[13px] py-[8px] cursor-pointer group">
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-primary">{label}</p>
        {desc && <p className="text-[11px] text-muted mt-[2px]">{desc}</p>}
      </div>
      <div className={`relative w-[42px] h-[24px] rounded-full transition-colors shrink-0 mt-[2px] ${
        checked ? 'bg-brand-600' : 'bg-surface-secondary border border-subtle'
      }`}>
        <div className={`absolute top-[2px] left-[2px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-[20px]' : ''
        }`} />
      </div>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
    </label>
  )
}
