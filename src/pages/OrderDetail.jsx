import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  CheckCircle, Clock, MapPin, Bike, Store, CreditCard, Wallet,
  Upload, FileImage, X, ArrowLeft, AlertCircle, Copy, Banknote,
  ImagePlus, ShoppingBag, User, Phone, Star,
} from 'lucide-react'
import { useToast } from '../lib/useToast'
import { formatPrice } from '../lib/utils'
import { api } from '../lib/api'

const statusColor = {
  pending: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
  paid: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
  processing: 'bg-brand-100 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400',
  done: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  cancelled: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
}

const statusLabel = {
  pending: 'Menunggu Pembayaran',
  paid: 'Sudah Dibayar',
  processing: 'Diproses',
  done: 'Selesai',
  cancelled: 'Dibatalkan',
}

function InfoBlock({ icon: Icon, children }) {
  return (
    <div className="flex items-start gap-[8px] text-[13px] text-secondary leading-relaxed">
      <Icon size={14} className="text-brand-600 shrink-0 mt-[2px]" />
      <div className="flex-1">{children}</div>
    </div>
  )
}

function DetailRow({ label, value, accent }) {
  return (
    <div className="flex justify-between text-[13px]">
      <span className="text-muted">{label}</span>
      <span className={accent ? 'text-accent-600 dark:text-accent-400 font-medium' : 'text-primary font-medium'}>{value}</span>
    </div>
  )
}

export default function OrderDetail() {
  const { id } = useParams()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const fileRef = useRef()
  const dropRef = useRef()

  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [payment, setPayment] = useState(null)
  const [review, setReview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paymentInfo, setPaymentInfo] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => { document.title = 'Detail Pesanan - Arazel Store' }, [])

  const [reviewRating, setReviewRating] = useState(5)
  const [reviewContent, setReviewContent] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  const [proofFile, setProofFile] = useState(null)
  const [proofPreview, setProofPreview] = useState(null)
  const [accountName, setAccountName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    api('/payment-info', { headers: {} }).then(setPaymentInfo).catch(() => {})
    api(`/orders/${id}`).then((data) => {
      setOrder(data.order)
      setItems(data.items)
      setPayment(data.payment)
      setReview(data.review)
      setTransferAmount(data.order.total)
    }).catch((err) => {
      addToast(err.message, 'error')
      navigate('/orders')
    }).finally(() => setLoading(false))
  }, [id])

  function handleFile(file) {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      addToast('Ukuran file maksimal 5MB', 'error')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      addToast('Hanya file JPG, PNG, atau WEBP', 'error')
      return
    }
    setProofFile(file)
    setProofPreview(URL.createObjectURL(file))
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  async function handleUpload(e) {
    e.preventDefault()
    if (!proofFile) {
      addToast('Pilih bukti transfer terlebih dahulu', 'error')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('proof', proofFile)
      formData.append('orderId', id)
      formData.append('accountName', accountName)
      formData.append('accountNumber', accountNumber)
      formData.append('amount', transferAmount)

      await api('/payments/upload', {
        method: 'POST',
        headers: {},
        body: formData,
      })
      addToast('Bukti pembayaran berhasil dikirim!')
      const data = await api(`/orders/${id}`)
      setOrder(data.order)
      setPayment(data.payment)
      setProofFile(null)
      setProofPreview(null)
      setAccountName('')
      setAccountNumber('')
      setTransferAmount('')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  async function handleReviewSubmit(e) {
    e.preventDefault()
    if (!reviewContent.trim()) {
      addToast('Tulis ulasan kamu terlebih dahulu', 'error')
      return
    }
    setSubmittingReview(true)
    try {
      await api('/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: id, rating: reviewRating, content: reviewContent }),
      })
      addToast('Ulasan berhasil dikirim! Terima kasih!', 'success')
      const data = await api(`/orders/${id}`)
      setReview(data.review)
      setReviewRating(5)
      setReviewContent('')
    } catch (err) {
      addToast(err.message, 'error')
    }
    setSubmittingReview(false)
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center">
        <div className="w-[34px] h-[34px] border-[3px] border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!order) return null

  const needsPayment = (order.status === 'pending') && (!payment || payment.status === 'rejected') && order.payment_method !== 'cod'

  const leftCol = (
    <div className="space-y-[13px]">
      <div className="bg-card rounded-[13px] border border-subtle p-[21px] text-center">
        <div className={`w-[55px] h-[55px] rounded-full flex items-center justify-center mx-auto mb-[13px] ${
          order.status === 'done' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
          order.status === 'cancelled' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
          'bg-brand-100 dark:bg-brand-900/30 text-brand-600'
        }`}>
          {order.status === 'done' ? <CheckCircle size={26} /> :
           order.status === 'cancelled' ? <X size={26} /> :
           <Clock size={26} />}
        </div>
        <h1 className="text-xl font-bold text-primary mb-[8px]">#{order.order_number}</h1>
        <span className={`inline-block text-[11px] font-medium px-[13px] py-[4px] rounded-full ${statusColor[order.status]}`}>
          {statusLabel[order.status]}
        </span>
      </div>

      <div className="bg-card rounded-[13px] border border-subtle p-[21px]">
        <h2 className="text-[14px] font-semibold text-primary mb-[13px]">Informasi Pelanggan</h2>
        <div className="space-y-[8px]">
          <InfoBlock icon={User}><span className="text-primary font-medium">{order.customer_name}</span></InfoBlock>
          <InfoBlock icon={Phone}>{order.customer_phone}</InfoBlock>
        </div>
      </div>

      <div className="bg-card rounded-[13px] border border-subtle p-[21px]">
        <h2 className="text-[14px] font-semibold text-primary mb-[13px]">Pengiriman & Pembayaran</h2>
        <div className="space-y-[8px]">
          <InfoBlock icon={order.delivery_method === 'antar' ? Bike : Store}>
            <span className="capitalize text-primary font-medium">{order.delivery_method === 'antar' ? 'Di antar' : 'Di jemput'}</span>
          </InfoBlock>
          {order.delivery_address && (
            <InfoBlock icon={MapPin}>{order.delivery_address}</InfoBlock>
          )}
          <InfoBlock icon={order.payment_method === 'transfer' ? CreditCard : order.payment_method === 'cod' ? Banknote : Wallet}>
            <span className="capitalize text-primary font-medium">
              {order.payment_method === 'transfer' ? 'Transfer Bank' : order.payment_method === 'cod' ? 'COD (Bayar di Tempat)' : 'E-Wallet'}
            </span>
          </InfoBlock>
        </div>
      </div>

      <div className="bg-card rounded-[13px] border border-subtle overflow-hidden">
        <div className="px-[21px] pt-[13px] pb-[8px] border-b border-subtle">
          <h2 className="text-[14px] font-semibold text-primary flex items-center gap-[8px]">
            <ShoppingBag size={15} className="text-brand-600" />
            Detail Pesanan
          </h2>
        </div>
        <div className="p-[21px] space-y-[8px] mb-[8px]">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-[13px]">
              <span className="text-secondary">{item.product_name} × {item.quantity}</span>
              <span className="text-primary font-medium">{formatPrice(item.subtotal)}</span>
            </div>
          ))}
        </div>
        <div className="px-[21px] pb-[21px] space-y-[8px] text-[13px] border-t border-subtle pt-[13px]">
          <DetailRow label="Subtotal" value={formatPrice(order.subtotal)} />
          {Number(order.discount_amount) > 0 && (
            <DetailRow label="Diskon" value={`-${formatPrice(order.discount_amount)}`} accent />
          )}
          <DetailRow label="Ongkir" value={Number(order.shipping_fee) === 0 ? 'Gratis' : formatPrice(order.shipping_fee)} accent={Number(order.shipping_fee) === 0} />
          <div className="flex justify-between text-[16px] font-bold border-t border-subtle pt-[13px] mt-[8px]">
            <span className="text-primary">Total</span>
            <span className="text-brand-600">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  )

  const rightCol = (
    <div className="space-y-[13px]">
      {needsPayment && (
        <div className="bg-card rounded-[13px] border border-subtle overflow-hidden">
          <div className="flex items-center gap-[8px] px-[21px] pt-[13px] pb-[8px] border-b border-subtle bg-surface-secondary/30">
            <Upload size={15} className="text-brand-600" />
            <h2 className="text-[14px] font-semibold text-primary">Upload Bukti Pembayaran</h2>
          </div>
          <div className="p-[21px]">
            {paymentInfo && (
              <div className="mb-[13px] p-[13px] rounded-[8px] bg-surface-secondary/20 border border-subtle">
                <div className="text-[13px]">
                  <p className="font-medium text-primary mb-[8px] flex items-center gap-[8px]">
                    <CreditCard size={14} className="text-brand-600" />
                    {order.payment_method === 'transfer' ? 'Transfer ke rekening:' : 'Pembayaran via:'}
                  </p>
                  <div className="space-y-[4px]">
                    {order.payment_method === 'transfer' ? (
                      paymentInfo.transfer.map((b) => (
                        <CopyRow key={b.bank} label={b.bank} value={b.account} onCopy={() => { navigator.clipboard.writeText(b.account); addToast('Tersalin!') }} />
                      ))
                    ) : (
                      paymentInfo.ewallet.map((e) => (
                        <CopyRow key={e.provider} label={e.provider} value={e.account} onCopy={() => { navigator.clipboard.writeText(e.account); addToast('Tersalin!') }} />
                      ))
                    )}
                  </div>
                  <div className="text-[12px] text-muted mt-[4px]">a.n. Arazel Store</div>
                </div>
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-[13px]">
              <div
                ref={dropRef}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                {proofPreview ? (
                  <div className="relative rounded-[13px] overflow-hidden border border-subtle group">
                     <img src={proofPreview} alt="Preview" className="w-full h-[144px] object-cover" onError={(e) => { e.target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' }} />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <button type="button" onClick={() => { setProofFile(null); setProofPreview(null) }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity w-[34px] h-[34px] rounded-full bg-white/90 text-red-500 flex items-center justify-center shadow-md"
                      ><X size={16} /></button>
                    </div>
                    <div className="absolute bottom-[8px] right-[8px] bg-black/60 text-white text-[10px] px-[8px] py-[4px] rounded-full">
                      {(proofFile.size / 1024 / 1024).toFixed(1)} MB
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className={`w-full h-[89px] rounded-[13px] border-2 border-dashed flex flex-col items-center justify-center gap-[8px] transition-all ${
                      dragOver
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/10'
                        : 'border-subtle text-muted hover:text-primary hover:border-brand-400'
                    }`}
                  >
                    <ImagePlus size={24} className={dragOver ? 'text-brand-600' : ''} />
                    <span className="text-[11px] font-medium">Klik atau tarik file</span>
                    <span className="text-[10px]">JPG, PNG, WEBP — Maks 5MB</span>
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => handleFile(e.target.files[0])} className="hidden" />

              <div>
                <label className="block text-[12px] font-medium text-secondary mb-[5px]">Nama Pengirim & No. Rekening/HP</label>
                <div className="grid grid-cols-2 gap-[8px]">
                  <div className="relative">
                    <User size={14} className="absolute left-[11px] top-1/2 -translate-y-1/2 text-muted" />
                    <input type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)}
                      placeholder="Nama pengirim"
                      className="w-full h-[38px] pl-[32px] pr-[11px] rounded-[8px] bg-surface border border-subtle text-primary text-[13px] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-shadow"
                    />
                  </div>
                  <div className="relative">
                    <CreditCard size={14} className="absolute left-[11px] top-1/2 -translate-y-1/2 text-muted" />
                    <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="No. rek/HP"
                      className="w-full h-[38px] pl-[32px] pr-[11px] rounded-[8px] bg-surface border border-subtle text-primary text-[13px] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-shadow"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-secondary mb-[5px]">Jumlah Transfer</label>
                <div className="relative">
                  <Banknote size={14} className="absolute left-[11px] top-1/2 -translate-y-1/2 text-muted" />
                  <input type="text" inputMode="numeric" value={order.total} disabled
                    className="w-full h-[38px] pl-[32px] pr-[11px] rounded-[8px] bg-surface/50 text-primary text-[13px] border border-subtle cursor-not-allowed"
                  />
                  <span className="absolute right-[11px] top-1/2 -translate-y-1/2 text-[12px] font-medium text-brand-600">{formatPrice(order.total)}</span>
                </div>
              </div>

              <button type="submit" disabled={uploading}
                className="btn-primary w-full justify-center h-[38px] text-[13px]"
              >{uploading ? 'Mengupload...' : 'Kirim Bukti Pembayaran'}</button>

              {paymentInfo && (
                <p className="text-[12px] text-muted leading-relaxed text-center">
                  Transfer sesuai <strong className="text-primary">total pesanan</strong> agar mudah diverifikasi.
                </p>
              )}
            </form>
          </div>
        </div>
      )}

      {payment && (
        <div className="bg-card rounded-[13px] border border-subtle p-[21px]">
          <h2 className="text-[14px] font-semibold text-primary mb-[13px]">Status Pembayaran</h2>
          <div className="space-y-[8px] text-[13px]">
            <DetailRow label="Metode" value={payment.method === 'transfer' ? 'Transfer Bank' : payment.method === 'cod' ? 'COD' : 'E-Wallet'} />
            {payment.account_name && <DetailRow label="Pengirim" value={payment.account_name} />}
            {payment.account_number && <DetailRow label="No. Pengirim" value={payment.account_number} />}
            <DetailRow label="Jumlah" value={formatPrice(payment.amount)} />
            <div className="flex justify-between text-[13px]">
              <span className="text-muted">Status</span>
              <span className={`text-[12px] font-medium px-[13px] py-[4px] rounded-full ${
                payment.status === 'verified' ? 'bg-green-100 dark:bg-green-900/20 text-green-700' :
                payment.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/20 text-red-700' :
                'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700'
              }`}>
                {payment.status === 'verified' ? 'Terverifikasi' : payment.status === 'rejected' ? 'Ditolak' : 'Menunggu Verifikasi'}
              </span>
            </div>
            {payment.proof_image && (
              <div className="pt-[13px]">
                 <img src={payment.proof_image} alt="Bukti pembayaran" className="w-full rounded-[13px] border border-subtle" onError={(e) => { e.target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' }} />
              </div>
            )}
          </div>
        </div>
      )}

      {order.status === 'done' && (
        <div className="bg-card rounded-[13px] border border-subtle p-[21px]">
          <h2 className="text-[14px] font-semibold text-primary mb-[13px]">Ulasan</h2>
          {review ? (
            <div className="space-y-[8px] text-[13px]">
              <div className="flex items-center gap-[4px]">
                {Array.from({ length: 5 }, (_, s) => (
                  <Star key={s} size={15} className={s < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-subtle'} />
                ))}
              </div>
              <p className="text-secondary leading-relaxed">{review.content}</p>
              {review.reply && (
                <div className="mt-[10px] pl-[10px] border-l-[3px] border-brand-400 dark:border-brand-600">
                  <p className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold mb-[2px]">Balasan Arazel Store</p>
                  <p className="text-secondary leading-relaxed">{review.reply}</p>
                  {review.replied_at && (
                    <p className="text-[11px] text-muted mt-[2px]">{new Date(review.replied_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  )}
                </div>
              )}
              <p className="text-[11px] text-muted">{new Date(review.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          ) : (
            <form onSubmit={handleReviewSubmit} className="space-y-[12px]">
              <p className="text-[12px] text-secondary">Bagaimana pesanan kamu? Beri ulasan ya!</p>
              <div className="flex gap-[4px]">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button" onClick={() => setReviewRating(s)}
                    className="p-[4px] rounded-[4px] hover:bg-brand-50 transition-colors"
                  ><Star key={s} size={22} className={s <= reviewRating ? 'text-yellow-500 fill-yellow-500' : 'text-subtle'} /></button>
                ))}
              </div>
              <textarea value={reviewContent} onChange={(e) => setReviewContent(e.target.value)}
                placeholder="Tulis ulasan kamu..." rows={3}
                className="w-full px-[12px] py-[10px] rounded-[8px] bg-surface border border-subtle text-primary text-[13px] focus:outline-none focus:border-brand-500 resize-none"
              />
              <button type="submit" disabled={submittingReview}
                className="btn-primary w-full justify-center h-[38px] text-[13px]"
              >{submittingReview ? 'Mengirim...' : 'Kirim Ulasan'}</button>
            </form>
          )}
        </div>
      )}

      {order.status === 'pending' && order.payment_method === 'cod' && (
        <div className="flex items-start gap-[8px] p-[13px] rounded-[13px] bg-brand-50/80 dark:bg-brand-900/10 border border-brand-200/60 dark:border-brand-800/60">
          <Banknote size={16} className="text-brand-600 shrink-0 mt-[2px]" />
          <p className="text-[12px] text-brand-700 dark:text-brand-400 leading-relaxed">
            Pesanan akan segera diproses. Siapkan <strong>tunai atau QRIS</strong> saat diterima.
          </p>
        </div>
      )}

      {order.status === 'pending' && order.payment_method !== 'cod' && !needsPayment && (
        <div className="flex items-start gap-[8px] p-[13px] rounded-[13px] bg-yellow-50/80 dark:bg-yellow-900/10 border border-yellow-200/60 dark:border-yellow-800/60">
          <AlertCircle size={16} className="text-yellow-600 shrink-0 mt-[2px]" />
          <p className="text-[12px] text-yellow-700 dark:text-yellow-400 leading-relaxed">
            Lakukan pembayaran dan upload bukti transfer agar pesanan diproses.
          </p>
        </div>
      )}
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-[21px] py-[34px]">
      <Link to="/orders" className="inline-flex items-center gap-[8px] text-[13px] text-secondary hover:text-primary transition-colors mb-[21px]">
        <ArrowLeft size={14} />
        Kembali
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="md:grid md:grid-cols-[1fr_380px] md:gap-[21px] items-start">
          {leftCol}
          {rightCol}
        </div>
      </motion.div>
    </div>
  )
}

function CopyRow({ label, value, onCopy }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-primary">{label}</span>
      <button type="button" onClick={onCopy} className="flex items-center gap-[8px] text-secondary hover:text-primary transition-colors">
        {value} <Copy size={11} />
      </button>
    </div>
  )
}
