import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Search, CheckCircle, XCircle, X, ZoomIn, ExternalLink, Star, Trash2, Pencil, Plus, MessageCircle, MessageCircleOff } from 'lucide-react'
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

const tabs = [
  { id: 'pesanan', label: 'Pesanan' },
  { id: 'pembayaran', label: 'Pembayaran' },
  { id: 'testimonial', label: 'Testimonial' },
]

const statuses = ['all', 'pending', 'paid', 'processing', 'done', 'cancelled']
const statusLabel = { all: 'Semua', pending: 'Menunggu', paid: 'Dibayar', processing: 'Diproses', done: 'Selesai', cancelled: 'Dibatalkan' }
const statusColor = {
  pending: 'bg-yellow-50 text-yellow-700',
  paid: 'bg-blue-50 text-blue-700',
  processing: 'bg-brand-50 text-brand-700',
  done: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
}

const payStatuses = ['all', 'pending', 'verified', 'rejected']
const payStatusLabel = { all: 'Semua', pending: 'Menunggu', verified: 'Terverifikasi', rejected: 'Ditolak' }

function OrdersTab() {
  const { addToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const filterStatus = searchParams.get('status') || 'all'
  const [detailOrder, setDetailOrder] = useState(null)
  const [detailItems, setDetailItems] = useState([])
  const [detailPayment, setDetailPayment] = useState(null)
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterStatus !== 'all') params.set('status', filterStatus)
    if (search) params.set('search', search)
    api(`/admin/orders?${params}`).then((d) => {
      if (d.orders) setOrders(d.orders)
    }).finally(() => setLoading(false))
  }, [filterStatus, search])

  async function updateStatus(id, status) {
    setUpdating(id)
    try {
      await api(`/admin/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) })
      addToast(`Status pesanan diubah menjadi ${statusLabel[status]}`, 'success')
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (search) params.set('search', search)
      const d = await api(`/admin/orders?${params}`)
      if (d.orders) setOrders(d.orders)
      if (detailOrder?.id === id) {
        const detail = await api(`/admin/orders/${id}`)
        if (detail.order) { setDetailOrder(detail.order); setDetailItems(detail.items); setDetailPayment(detail.payment) }
      }
    } catch (err) {
      addToast(err.message || 'Gagal mengubah status', 'error')
    }
    setUpdating(null)
  }

  async function openDetail(id) {
    const d = await api(`/admin/orders/${id}`)
    if (d.order) { setDetailOrder(d.order); setDetailItems(d.items); setDetailPayment(d.payment) }
  }

  const detailOrderId = searchParams.get('order')
  useEffect(() => {
    if (detailOrderId) openDetail(detailOrderId)
  }, [detailOrderId])

  return (
    <>
      <div className="flex flex-col md:flex-row gap-[10px]">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-[14px] top-1/2 -translate-y-1/2 text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari order number, nama, atau no. HP..."
            className="w-full h-[44px] pl-[42px] pr-[14px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex gap-[6px] overflow-x-auto">
          {statuses.map((s) => (
            <button key={s} onClick={() => setSearchParams(s === 'all' ? {} : { status: s })}
              className={`shrink-0 px-[14px] py-[9px] rounded-[7px] text-[14px] font-medium transition-colors ${
                filterStatus === s ? 'bg-brand-600 text-white' : 'bg-surface border border-subtle text-secondary hover:text-primary'
              }`}
            >
              {statusLabel[s]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-[64px]">
          <div className="w-[28px] h-[28px] border-[3px] border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-card rounded-[13px] border border-subtle overflow-hidden">
          <div className="divide-y divide-subtle">
            {orders.map((order) => (
              <div key={order.id} className="px-[24px] py-[16px] hover:bg-surface-secondary transition-colors">
                <div className="flex items-center justify-between gap-[10px]">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-[8px] flex-wrap">
                      <span className="text-[16px] font-semibold text-primary">#{order.order_number}</span>
                      <span className={`text-[11px] font-medium px-[8px] py-[2px] rounded-full ${statusColor[order.status]}`}>
                        {statusLabel[order.status]}
                      </span>
                    </div>
                    <p className="text-[14px] text-secondary mt-[4px]">{order.customer_name}</p>
                    <p className="text-[13px] text-muted">{formatPrice(order.total)} &bull; {order.item_count} item &bull; {new Date(order.created_at).toLocaleDateString('id-ID')}</p>
                  </div>
                  <button onClick={() => openDetail(order.id)}
                    className="shrink-0 px-[14px] py-[9px] rounded-[7px] text-[14px] font-medium text-brand-600 hover:bg-brand-50 transition-colors"
                  >
                    Detail
                  </button>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <p className="text-[15px] text-muted text-center py-[40px]">Tidak ada pesanan</p>
            )}
          </div>
        </div>
      )}

      {detailOrder && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-[24px] bg-black/40 backdrop-blur-sm"
          onClick={() => setDetailOrder(null)}
        >
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[600px] bg-card rounded-[13px] border border-subtle shadow-xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between px-[24px] pt-[24px] pb-[16px] border-b border-subtle sticky top-0 bg-card">
              <h2 className="text-[18px] font-semibold text-primary">#{detailOrder.order_number}</h2>
              <button onClick={() => setDetailOrder(null)} className="p-[8px] rounded-[7px] text-muted hover:text-primary hover:bg-surface-secondary"><X size={18} /></button>
            </div>
            <div className="p-[24px] space-y-[16px]">
              <div className="grid grid-cols-2 gap-[16px] text-[14px]">
                <div><span className="text-muted">Pelanggan</span><p className="text-primary font-medium mt-[4px]">{detailOrder.customer_name}</p></div>
                <div><span className="text-muted">No. HP</span><p className="text-primary mt-[4px]">{detailOrder.customer_phone}</p></div>
                <div><span className="text-muted">Pengiriman</span><p className="text-primary capitalize mt-[4px]">{detailOrder.delivery_method === 'antar' ? 'Di antar' : 'Di jemput'}</p></div>
                <div><span className="text-muted">Pembayaran</span><p className="text-primary capitalize mt-[4px]">{detailOrder.payment_method === 'cod' ? 'COD' : detailOrder.payment_method}</p></div>
              </div>
              {detailOrder.delivery_address && (
                <div className="text-[14px] bg-surface rounded-[8px] p-[16px] border border-subtle">
                  <span className="text-muted">Alamat</span><p className="text-primary mt-[4px]">{detailOrder.delivery_address}</p>
                </div>
              )}

              <div className="border-t border-subtle pt-[16px]">
                <p className="text-[14px] font-medium text-primary mb-[10px]">Item Pesanan</p>
                <div className="space-y-[6px]">
                  {detailItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-[14px]">
                      <span className="text-secondary">{item.product_name} &times; {item.quantity}</span>
                      <span className="text-primary font-medium">{formatPrice(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-subtle mt-[10px] pt-[10px] space-y-[4px] text-[14px]">
                  <div className="flex justify-between"><span className="text-muted">Subtotal</span><span className="text-primary">{formatPrice(detailOrder.subtotal)}</span></div>
                  {Number(detailOrder.discount_amount) > 0 && (
                    <div className="flex justify-between"><span className="text-muted">Diskon</span><span className="text-green-600">-{formatPrice(detailOrder.discount_amount)}</span></div>
                  )}
                  <div className="flex justify-between"><span className="text-muted">Ongkir</span><span className="text-primary">{Number(detailOrder.shipping_fee) === 0 ? 'Gratis' : formatPrice(detailOrder.shipping_fee)}</span></div>
                  <div className="flex justify-between text-[16px] font-bold pt-[10px] border-t border-subtle"><span className="text-primary">Total</span><span className="text-brand-600">{formatPrice(detailOrder.total)}</span></div>
                </div>
              </div>

              {detailPayment && (
                <div className="border-t border-subtle pt-[16px]">
                  <p className="text-[14px] font-medium text-primary mb-[10px]">Pembayaran</p>
                  <div className="text-[14px] space-y-[4px]">
                    <div className="flex justify-between"><span className="text-muted">Metode</span><span className="text-primary capitalize">{detailPayment.method === 'transfer' ? 'Transfer' : 'E-Wallet'}</span></div>
                    {detailPayment.account_name && <div className="flex justify-between"><span className="text-muted">Pengirim</span><span className="text-primary">{detailPayment.account_name}</span></div>}
                    <div className="flex justify-between"><span className="text-muted">Status</span><span className="capitalize">{detailPayment.status === 'verified' ? 'Terverifikasi' : detailPayment.status === 'rejected' ? 'Ditolak' : 'Menunggu'}</span></div>
                  </div>
                  {detailPayment.proof_image && (
                    <div className="mt-[10px]">
                      <img src={detailPayment.proof_image} alt="Bukti pembayaran" className="max-h-[160px] rounded-[8px] border border-subtle" onError={(e) => { e.target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' }} />
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-subtle pt-[16px]">
                <p className="text-[14px] font-medium text-primary mb-[10px]">Ubah Status</p>
                <div className="flex flex-wrap gap-[6px]">
                  {['pending', 'paid', 'processing', 'done', 'cancelled'].map((s) => (
                    <button key={s} disabled={updating === detailOrder.id || detailOrder.status === s}
                      onClick={() => updateStatus(detailOrder.id, s)}
                      className={`px-[14px] py-[9px] rounded-[7px] text-[14px] font-medium transition-colors ${
                        detailOrder.status === s ? 'bg-brand-600 text-white' : 'bg-surface border border-subtle text-secondary hover:text-primary disabled:opacity-30'
                      }`}
                    >
                      {statusLabel[s]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  )
}

function PaymentsTab() {
  const { addToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const filterStatus = searchParams.get('status') || 'all'
  const [processing, setProcessing] = useState(null)
  const [detailPayment, setDetailPayment] = useState(null)
  const [lightboxImage, setLightboxImage] = useState(null)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterStatus !== 'all') params.set('status', filterStatus)
    if (search) params.set('search', search)
    api(`/admin/payments?${params}`).then((d) => {
      setPayments(d.payments || [])
    }).finally(() => setLoading(false))
  }, [filterStatus, search])

  async function verifyPayment(id, status) {
    setProcessing(id)
    try {
      await api(`/admin/payments/${id}/verify`, { method: 'PUT', body: JSON.stringify({ status }) })
      addToast(status === 'verified' ? 'Pembayaran berhasil diverifikasi' : 'Pembayaran ditolak', status === 'verified' ? 'success' : 'error')
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (search) params.set('search', search)
      const d = await api(`/admin/payments?${params}`)
      setPayments(d.payments || [])
      if (detailPayment?.id === id) setDetailPayment(null)
    } catch (err) {
      addToast(err.message || 'Gagal memproses pembayaran', 'error')
    }
    setProcessing(null)
  }

  const filtered = payments.filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return p.order_number?.toLowerCase().includes(q) || p.customer_name?.toLowerCase().includes(q) || p.account_name?.toLowerCase().includes(q)
  })

  function payStatusBadge(status) {
    const cls = status === 'verified' ? 'bg-green-50 text-green-700' :
      status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
    const label = status === 'verified' ? 'Terverifikasi' : status === 'rejected' ? 'Ditolak' : 'Menunggu'
    return <span className={`text-[12px] font-medium px-[8px] py-[3px] rounded-full ${cls}`}>{label}</span>
  }

  return (
    <>
      <div className="flex flex-col md:flex-row gap-[10px]">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-[14px] top-1/2 -translate-y-1/2 text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari order number atau nama..."
            className="w-full h-[44px] pl-[42px] pr-[14px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex gap-[6px]">
          {payStatuses.map((s) => (
            <button key={s} onClick={() => setSearchParams(s === 'all' ? {} : { status: s })}
              className={`shrink-0 px-[14px] py-[9px] rounded-[7px] text-[14px] font-medium transition-colors ${
                filterStatus === s ? 'bg-brand-600 text-white' : 'bg-surface border border-subtle text-secondary hover:text-primary'
              }`}
            >
              {payStatusLabel[s]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-[64px]">
          <div className="w-[28px] h-[28px] border-[3px] border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-[10px]">
          {filtered.map((p) => (
            <motion.div key={p.id} layout
              className="bg-card rounded-[13px] border border-subtle overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-[20px]">
                <div className="flex flex-col md:flex-row md:items-start gap-[16px]">
                  {p.proof_image && (
                    <button onClick={() => setLightboxImage(p.proof_image)}
                      className="shrink-0 group relative overflow-hidden rounded-[8px] border border-subtle w-full md:w-[140px] h-[100px] md:h-[100px]"
                    >
                      <img src={p.proof_image} alt="Bukti pembayaran"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { e.target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-[8px] flex-wrap">
                      <span className="text-[16px] font-semibold text-primary">#{p.order_number}</span>
                      {payStatusBadge(p.status)}
                    </div>
                    <p className="text-[14px] text-secondary mt-[4px]">{p.customer_name}</p>
                    <div className="flex flex-wrap gap-x-[16px] gap-y-[4px] mt-[6px] text-[13px] text-muted">
                      <span>{formatPrice(p.amount)}</span>
                      <span>&bull;</span>
                      <span className="capitalize">{p.method === 'transfer' ? 'Transfer Bank' : 'E-Wallet'}</span>
                      <span>&bull;</span>
                      <span>{new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {p.account_name && (
                      <p className="text-[13px] text-muted mt-[2px]">Pengirim: <span className="text-secondary font-medium">{p.account_name}</span>{p.account_number ? ` (${p.account_number})` : ''}</p>
                    )}
                  </div>
                  <div className="flex md:flex-col gap-[8px] shrink-0 md:min-w-[100px]">
                    <button onClick={() => setDetailPayment(p)}
                      className="flex items-center justify-center gap-[6px] px-[14px] py-[9px] rounded-[8px] text-[13px] font-medium bg-surface border border-subtle text-secondary hover:text-primary hover:border-brand-400 transition-colors"
                    ><ExternalLink size={14} /> Detail</button>
                    {p.status === 'pending' && (
                      <div className="flex md:flex-col gap-[6px]">
                        <button onClick={() => verifyPayment(p.id, 'verified')} disabled={processing === p.id}
                          className="flex items-center justify-center gap-[6px] px-[14px] py-[9px] rounded-[8px] bg-green-600 text-white text-[13px] font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                        ><CheckCircle size={14} /> Setujui</button>
                        <button onClick={() => verifyPayment(p.id, 'rejected')} disabled={processing === p.id}
                          className="flex items-center justify-center gap-[6px] px-[14px] py-[9px] rounded-[8px] bg-red-600 text-white text-[13px] font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                        ><XCircle size={14} /> Tolak</button>
                      </div>
                    )}
                    {p.status !== 'pending' && (
                      <button onClick={() => verifyPayment(p.id, p.status === 'verified' ? 'rejected' : 'verified')} disabled={processing === p.id}
                        className="flex items-center justify-center gap-[6px] px-[14px] py-[9px] rounded-[8px] bg-surface border border-subtle text-[13px] font-medium text-secondary hover:text-primary transition-colors disabled:opacity-50"
                      >Ubah Status</button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <p className="text-[15px] text-muted text-center py-[40px]">Tidak ada pembayaran</p>
          )}
        </div>
      )}

      <AnimatePresence>
        {detailPayment && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-[16px] md:p-[24px] bg-black/40 backdrop-blur-sm"
            onClick={() => setDetailPayment(null)}
          >
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[500px] bg-card rounded-[13px] border border-subtle shadow-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-[20px] pt-[20px] pb-[14px] border-b border-subtle sticky top-0 bg-card z-10">
                <h2 className="text-[18px] font-semibold text-primary">#{detailPayment.order_number}</h2>
                <button onClick={() => setDetailPayment(null)} className="p-[8px] rounded-[7px] text-muted hover:text-primary hover:bg-surface-secondary"><X size={18} /></button>
              </div>
              <div className="p-[20px] space-y-[16px]">
                {detailPayment.proof_image && (
                  <div>
                    <p className="text-[13px] font-medium text-primary mb-[8px]">Bukti Pembayaran</p>
                    <button onClick={() => setLightboxImage(detailPayment.proof_image)}
                      className="group relative overflow-hidden rounded-[8px] border border-subtle w-full"
                    >
                      <img src={detailPayment.proof_image} alt="Bukti pembayaran"
                        className="w-full max-h-[300px] object-contain bg-surface-secondary"
                        onError={(e) => { e.target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-[6px] bg-black/60 text-white px-[14px] py-[7px] rounded-full text-[13px] font-medium">
                          <ZoomIn size={16} /> Perbesar
                        </div>
                      </div>
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-[12px] text-[14px]">
                  <div><span className="text-muted">Metode</span><p className="text-primary font-medium mt-[2px] capitalize">{detailPayment.method === 'transfer' ? 'Transfer Bank' : 'E-Wallet'}</p></div>
                  <div><span className="text-muted">Status</span><p className="mt-[2px]">{payStatusBadge(detailPayment.status)}</p></div>
                  <div><span className="text-muted">Pelanggan</span><p className="text-primary mt-[2px]">{detailPayment.customer_name}</p></div>
                  <div><span className="text-muted">Jumlah</span><p className="text-primary font-semibold mt-[2px]">{formatPrice(detailPayment.amount)}</p></div>
                  {detailPayment.account_name && (
                    <div className="col-span-2"><span className="text-muted">Pengirim</span><p className="text-primary mt-[2px]">{detailPayment.account_name}{detailPayment.account_number ? ` (${detailPayment.account_number})` : ''}</p></div>
                  )}
                  <div className="col-span-2"><span className="text-muted">Tanggal</span><p className="text-primary mt-[2px]">{new Date(detailPayment.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p></div>
                </div>
                {detailPayment.status === 'pending' && (
                  <div className="flex gap-[8px] pt-[8px]">
                    <button onClick={() => { verifyPayment(detailPayment.id, 'verified'); setDetailPayment(null) }} disabled={processing === detailPayment.id}
                      className="flex-1 flex items-center justify-center gap-[6px] py-[11px] rounded-[8px] bg-green-600 text-white text-[14px] font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                    ><CheckCircle size={16} /> Setujui</button>
                    <button onClick={() => { verifyPayment(detailPayment.id, 'rejected'); setDetailPayment(null) }} disabled={processing === detailPayment.id}
                      className="flex-1 flex items-center justify-center gap-[6px] py-[11px] rounded-[8px] bg-red-600 text-white text-[14px] font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                    ><XCircle size={16} /> Tolak</button>
                  </div>
                )}
                {detailPayment.status !== 'pending' && (
                  <button onClick={() => { verifyPayment(detailPayment.id, detailPayment.status === 'verified' ? 'rejected' : 'verified'); setDetailPayment(null) }}
                    className="w-full flex items-center justify-center gap-[6px] py-[11px] rounded-[8px] bg-surface border border-subtle text-[14px] font-medium text-secondary hover:text-primary transition-colors"
                  >Ubah Status Pembayaran</button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lightboxImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-sm p-[16px]"
            onClick={() => setLightboxImage(null)}
          >
            <button onClick={() => setLightboxImage(null)}
              className="absolute top-[16px] right-[16px] p-[10px] rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
            ><X size={22} /></button>
            <motion.img
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              src={lightboxImage} alt="Bukti pembayaran"
              className="max-w-full max-h-full object-contain rounded-[8px]"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => { e.target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function ReviewsTab() {
  const { addToast } = useToast()
  const { confirm } = useConfirm()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', rating: 5, content: '' })
  const [replyForm, setReplyForm] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [replying, setReplying] = useState(false)

  useEffect(() => {
    setLoading(true)
    api('/admin/reviews').then((d) => {
      setReviews(d.reviews || [])
    }).finally(() => setLoading(false))
  }, [])

  async function load() {
    const d = await api('/admin/reviews')
    setReviews(d.reviews || [])
  }

  function openAdd() {
    setEditing(null)
    setForm({ name: '', rating: 5, content: '' })
    setShowModal(true)
  }

  function openEdit(r) {
    setEditing(r)
    setForm({ name: r.name, rating: r.rating, content: r.content })
    setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.content.trim()) {
      addToast('Nama dan konten wajib diisi', 'error')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await api(`/admin/reviews/${editing.id}`, { method: 'PUT', body: JSON.stringify({ ...form, active: editing.active }) })
        addToast('Testimonial berhasil diperbarui', 'success')
      } else {
        await api('/admin/reviews', { method: 'POST', body: JSON.stringify(form) })
        addToast('Testimonial berhasil ditambahkan', 'success')
      }
      setShowModal(false)
      await load()
    } catch (err) {
      addToast(err.message || 'Gagal menyimpan', 'error')
    }
    setSaving(null)
  }

  async function handleDelete(r) {
    const ok = await confirm({ title: 'Hapus testimonial?', message: `Testimonial dari "${r.name}" akan dihapus.`, confirmText: 'Hapus', variant: 'danger' })
    if (!ok) return
    try {
      await api(`/admin/reviews/${r.id}`, { method: 'DELETE' })
      addToast('Testimonial berhasil dihapus', 'success')
      await load()
    } catch (err) {
      addToast(err.message || 'Gagal menghapus', 'error')
    }
  }

  function openReply(r) {
    setReplyForm(r.id)
    setReplyText(r.reply || '')
  }

  async function handleReply(r) {
    if (!replyText.trim()) {
      addToast('Balasan tidak boleh kosong', 'error')
      return
    }
    setReplying(true)
    try {
      await api(`/admin/reviews/${r.id}/reply`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText.trim() }),
      })
      addToast('Balasan berhasil dikirim', 'success')
      setReplyForm(null)
      setReplyText('')
      await load()
    } catch (err) {
      addToast(err.message || 'Gagal mengirim balasan', 'error')
    }
    setReplying(false)
  }

  async function removeReply(r) {
    const ok = await confirm({ title: 'Hapus balasan?', message: 'Balasan untuk testimonial ini akan dihapus.', confirmText: 'Hapus', variant: 'danger' })
    if (!ok) return
    try {
      await api(`/admin/reviews/${r.id}/reply`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: '' }),
      })
      addToast('Balasan berhasil dihapus', 'success')
      await load()
    } catch (err) {
      addToast(err.message || 'Gagal menghapus balasan', 'error')
    }
  }

  async function toggleActive(r) {
    try {
      await api(`/admin/reviews/${r.id}`, { method: 'PUT', body: JSON.stringify({ name: r.name, rating: r.rating, content: r.content, active: !r.active }) })
      addToast(r.active ? 'Testimonial dinonaktifkan' : 'Testimonial diaktifkan', 'success')
      await load()
    } catch (err) {
      addToast(err.message || 'Gagal mengubah status', 'error')
    }
  }

  const [filterStatus, setFilterStatus] = useState('all')

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0.0'
  const repliedCount = reviews.filter(r => r.reply).length

  const filtered = reviews.filter((r) => {
    if (filterStatus === 'replied' && !r.reply) return false
    if (filterStatus === 'unreplied' && r.reply) return false
    if (!search) return true
    const q = search.toLowerCase()
    return r.name?.toLowerCase().includes(q) || r.content?.toLowerCase().includes(q) || r.reply?.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-[14px]">
      <div className="flex items-center gap-[16px] flex-wrap">
        <div className="flex items-center gap-[5px] px-[11px] py-[6px] rounded-[8px] bg-card border border-subtle">
          <span className="text-[11px] text-muted font-medium">Total</span>
          <span className="text-[13px] font-bold text-primary">{reviews.length}</span>
        </div>
        <div className="flex items-center gap-[5px] px-[11px] py-[6px] rounded-[8px] bg-card border border-subtle">
          <span className="text-[11px] text-muted font-medium">Rating</span>
          <span className="text-[13px] font-bold text-yellow-600 dark:text-yellow-400">{avgRating}</span>
          <Star size={11} className="text-yellow-500 fill-yellow-500" />
        </div>
        <div className="flex items-center gap-[5px] px-[11px] py-[6px] rounded-[8px] bg-card border border-subtle">
          <span className="text-[11px] text-muted font-medium">Dibalas</span>
          <span className="text-[13px] font-bold text-brand-600 dark:text-brand-400">{repliedCount}</span>
        </div>
        <div className="flex items-center gap-[5px] px-[11px] py-[6px] rounded-[8px] bg-card border border-subtle">
          <span className="text-[11px] text-muted font-medium">Perlu balasan</span>
          <span className="text-[13px] font-bold text-orange-600 dark:text-orange-400">{reviews.length - repliedCount}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-[12px] flex-wrap">
        <div className="relative flex-1 max-w-[320px]">
          <Search size={16} className="absolute left-[14px] top-1/2 -translate-y-1/2 text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari testimonial..."
            className="w-full h-[44px] pl-[42px] pr-[14px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex items-center gap-[6px]">
          <button onClick={() => setFilterStatus('all')}
            className={`px-[11px] py-[6px] rounded-[7px] text-[12px] font-medium transition-colors ${
              filterStatus === 'all' ? 'bg-brand-600 text-white shadow-sm' : 'bg-surface border border-subtle text-secondary hover:text-primary hover:border-muted'
            }`}
          >Semua</button>
          <button onClick={() => setFilterStatus('unreplied')}
            className={`px-[11px] py-[6px] rounded-[7px] text-[12px] font-medium transition-colors ${
              filterStatus === 'unreplied' ? 'bg-brand-600 text-white shadow-sm' : 'bg-surface border border-subtle text-secondary hover:text-primary hover:border-muted'
            }`}
          >Belum dibalas</button>
          <button onClick={() => setFilterStatus('replied')}
            className={`px-[11px] py-[6px] rounded-[7px] text-[12px] font-medium transition-colors ${
              filterStatus === 'replied' ? 'bg-brand-600 text-white shadow-sm' : 'bg-surface border border-subtle text-secondary hover:text-primary hover:border-muted'
            }`}
          >Sudah dibalas</button>
          <div className="w-[1px] h-[22px] bg-subtle mx-[4px]" />
          <button onClick={openAdd}
            className="flex items-center gap-[6px] px-[12px] py-[6px] rounded-[7px] bg-brand-600 dark:bg-brand-500 text-white text-[12px] font-medium hover:bg-brand-700 dark:hover:bg-brand-400 transition-colors shadow-sm"
          ><Plus size={14} /> Tambah</button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-[50px]">
          <div className="w-[28px] h-[28px] border-[3px] border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-[8px]">
          {filtered.map((r) => (
            <div key={r.id} className="bg-card rounded-[11px] border border-subtle overflow-hidden transition-shadow hover:shadow-sm">
              <div className="p-[18px]">
                <div className="flex items-start gap-[12px]">
                  <div className={`w-[38px] h-[38px] rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                    r.active ? 'bg-brand-100 dark:bg-brand-800 text-brand-600 dark:text-brand-300' : 'bg-surface-secondary dark:bg-stone-800 text-muted'
                  }`}>
                    {(r.name || '??').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-[12px]">
                      <div className="flex items-center gap-[8px] flex-wrap min-w-0">
                        <span className="text-[15px] font-semibold text-primary truncate">{r.name}</span>
                        <div className="flex gap-[2px] shrink-0">
                          {Array.from({ length: 5 }, (_, s) => (
                            <Star key={s} size={11} className={s < r.rating ? 'text-yellow-500 fill-yellow-500' : 'text-subtle'} />
                          ))}
                        </div>
                        <span className={`text-[10px] font-medium px-[6px] py-[1px] rounded-full ${
                          r.active ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>{r.active ? 'Aktif' : 'Nonaktif'}</span>
                        {r.reply && (
                          <span className="text-[10px] font-medium px-[6px] py-[1px] rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 flex items-center gap-[2px]">
                            <MessageCircle size={9} /> Dibalas
                          </span>
                        )}
                      </div>
                      <div className="flex gap-[2px] shrink-0">
                        <button onClick={() => toggleActive(r)}
                          className={`p-[6px] rounded-[6px] transition-colors ${r.active ? 'text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20' : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'}`}
                          title={r.active ? 'Nonaktifkan' : 'Aktifkan'}
                        >{r.active ? <X size={13} /> : <CheckCircle size={13} />}</button>
                        {r.reply ? (
                          <button onClick={() => removeReply(r)} className="p-[6px] rounded-[6px] text-orange-500 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors" title="Hapus balasan"><MessageCircleOff size={13} /></button>
                        ) : (
                          <button onClick={() => openReply(r)} className="p-[6px] rounded-[6px] text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors" title="Balas"><MessageCircle size={13} /></button>
                        )}
                        <button onClick={() => openEdit(r)} className="p-[6px] rounded-[6px] text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Edit"><Pencil size={13} /></button>
                        <button onClick={() => handleDelete(r)} className="p-[6px] rounded-[6px] text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Hapus"><Trash2 size={13} /></button>
                      </div>
                    </div>
                    <div className="mt-[8px] pl-[14px] border-l-[2px] border-subtle">
                      <p className="text-[14px] text-secondary leading-relaxed italic">&ldquo;{r.content}&rdquo;</p>
                      <p className="text-[11px] text-muted mt-[4px]">{new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>

                    {r.reply && (
                      <>
                        <div className="mt-[14px] h-[1px] bg-subtle/50" />
                        <div className="mt-[12px] flex gap-[10px]">
                          <div className="w-[30px] h-[30px] rounded-full bg-brand-600 dark:bg-brand-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0 mt-[2px] shadow-sm">
                            AZ
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-[8px] mb-[3px]">
                              <span className="text-[12px] font-semibold text-brand-700 dark:text-brand-300">Arazel Store</span>
                              <span className="text-[10px] text-muted">{new Date(r.replied_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                            <div className="bg-brand-50 dark:bg-brand-900/20 rounded-[10px] rounded-tl-[2px] px-[14px] py-[10px] border border-brand-100 dark:border-brand-800/30">
                              <p className="text-[13px] text-secondary leading-relaxed">{r.reply}</p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {replyForm === r.id && (
                      <>
                        <div className="mt-[14px] h-[1px] bg-subtle/50" />
                        <div className="mt-[12px] flex gap-[10px]">
                          <div className="w-[30px] h-[30px] rounded-full bg-brand-600 dark:bg-brand-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0 mt-[2px] shadow-sm">
                            AZ
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-[8px] mb-[6px]">
                              <span className="text-[12px] font-semibold text-brand-700 dark:text-brand-300">Arazel Store</span>
                            </div>
                            <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Tulis balasan untuk testimonial ini..."
                              className="w-full px-[14px] py-[10px] rounded-[10px] bg-surface border border-subtle text-[13px] text-primary focus:outline-none focus:border-brand-500 resize-none"
                            />
                            <div className="flex gap-[8px] justify-end mt-[8px]">
                              <button onClick={() => { setReplyForm(null); setReplyText('') }}
                                className="px-[12px] py-[7px] rounded-[7px] text-[12px] font-medium text-secondary hover:bg-surface-secondary transition-colors"
                              >Batal</button>
                              <button onClick={() => handleReply(r)} disabled={replying}
                                className="px-[14px] py-[7px] rounded-[7px] bg-brand-600 dark:bg-brand-500 text-white text-[12px] font-medium hover:bg-brand-700 dark:hover:bg-brand-400 disabled:opacity-50 transition-colors flex items-center gap-[5px] shadow-sm"
                              >{replying ? 'Mengirim...' : <><MessageCircle size={13} /> Kirim Balasan</>}</button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-[50px]">
              <MessageCircle size={34} className="mx-auto text-muted/50 mb-[10px]" />
              <p className="text-[15px] text-muted">Tidak ada testimonial</p>
              {search && <p className="text-[13px] text-muted mt-[4px]">Coba ubah kata kunci pencarian</p>}
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-[24px] bg-black/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[480px] bg-card rounded-[13px] border border-subtle shadow-xl"
            >
              <div className="flex items-center justify-between px-[24px] pt-[24px] pb-[16px] border-b border-subtle">
                <h2 className="text-[18px] font-semibold text-primary">{editing ? 'Edit Testimonial' : 'Tambah Testimonial'}</h2>
                <button onClick={() => setShowModal(false)} className="p-[8px] rounded-[7px] text-muted hover:text-primary hover:bg-surface-secondary"><X size={18} /></button>
              </div>
              <form onSubmit={handleSave} className="p-[24px] space-y-[16px]">
                <div>
                  <label className="block text-[13px] font-medium text-secondary mb-[5px]">Nama Pelanggan</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Nama pelanggan"
                    className="w-full h-[44px] px-[14px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-secondary mb-[5px]">Rating</label>
                  <div className="flex gap-[4px]">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} type="button" onClick={() => setForm({ ...form, rating: s })}
                        className="p-[4px] rounded-[4px] hover:bg-brand-50 transition-colors"
                      ><Star size={20} className={s <= form.rating ? 'text-yellow-500 fill-yellow-500' : 'text-subtle'} /></button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-secondary mb-[5px]">Isi Testimonial</label>
                  <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                    placeholder="Isi testimonial..." rows={4}
                    className="w-full px-[14px] py-[10px] rounded-[8px] bg-surface border border-subtle text-primary text-[15px] focus:outline-none focus:border-brand-500 resize-none"
                  />
                </div>
                <div className="flex gap-[10px] pt-[8px]">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="flex-1 py-[11px] rounded-[8px] bg-surface border border-subtle text-[14px] font-medium text-secondary hover:text-primary transition-colors"
                  >Batal</button>
                  <button type="submit" disabled={saving}
                    className="flex-1 flex items-center justify-center gap-[6px] py-[11px] rounded-[8px] bg-brand-600 text-white text-[14px] font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
                  >{saving ? 'Menyimpan...' : 'Simpan'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function ManageOrders() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'pesanan'

  function setTab(id) {
    setSearchParams(id === 'pesanan' ? {} : { tab: id })
  }

  return (
    <AdminLayout>
      <div className="space-y-[16px]">
        <h1 className="text-[28px] font-bold text-primary">Manajemen Pesanan</h1>

        <div className="flex gap-[6px] border-b border-subtle pb-[4px]">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-[16px] py-[10px] rounded-t-[8px] text-[14px] font-medium transition-colors ${
                tab === t.id ? 'bg-card text-brand-600 border border-b-0 border-subtle' : 'text-secondary hover:text-primary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'pesanan' && <OrdersTab />}
        {tab === 'pembayaran' && <PaymentsTab />}
        {tab === 'testimonial' && <ReviewsTab />}
      </div>
    </AdminLayout>
  )
}
