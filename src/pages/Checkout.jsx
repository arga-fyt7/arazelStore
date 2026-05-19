import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  ArrowLeft, User, Phone, MapPin, Bike, Store, CreditCard,
  Wallet, Tag, ShoppingBag, X, AlertCircle, Copy, Banknote,
  Check, Package, Info,
} from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import { useCart } from '../lib/useCart'
import { useToast } from '../lib/useToast'
import { formatPrice } from '../lib/utils'
import { api } from '../lib/api'

function StepBadge({ num, active }) {
  return (
    <div className={`w-[24px] h-[24px] rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors ${
      active ? 'bg-brand-600 text-white' : 'bg-surface-secondary text-muted'
    }`}>
      {active ? <Check size={12} /> : num}
    </div>
  )
}

function SectionCard({ num, title, icon: Icon, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-card rounded-[13px] border border-subtle overflow-hidden"
    >
      <div className="flex items-center gap-[10px] px-[16px] pt-[14px] pb-[6px] border-b border-subtle">
        <StepBadge num={num} active />
        {Icon && <Icon size={16} className="text-brand-600" />}
        <h2 className="text-[14px] font-semibold text-primary">{title}</h2>
      </div>
      <div className="p-[16px]">
        {children}
      </div>
    </motion.div>
  )
}

function OptionCard({ selected, onClick, icon: Icon, title, subtitle, children }) {
  return (
    <button type="button" onClick={onClick}
      className={`relative flex flex-col gap-[8px] p-[14px] rounded-[10px] border text-left transition-all w-full ${
        selected
          ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-900/15 text-primary shadow-sm'
          : 'border-subtle bg-surface text-secondary hover:border-brand-300 hover:shadow-sm'
      }`}
    >
      {selected && (
        <div className="absolute top-[6px] right-[6px] w-[18px] h-[18px] rounded-full bg-brand-600 text-white flex items-center justify-center shadow-xs">
          <Check size={11} />
        </div>
      )}
      <div className="flex items-center gap-[10px]">
        <div className={`w-[36px] h-[36px] rounded-full flex items-center justify-center shrink-0 transition-colors ${
          selected ? 'bg-brand-600 text-white shadow-sm' : 'bg-surface-secondary text-muted'
        }`}>
          <Icon size={17} />
        </div>
        <div>
          <div className="text-[13px] font-semibold text-primary">{title}</div>
          {subtitle && <div className="text-[11px] text-muted">{subtitle}</div>}
        </div>
      </div>
      {children}
    </button>
  )
}

export default function Checkout() {
  const { user } = useAuth()
  const { cart, totalPrice, clearCart } = useCart()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [customerName, setCustomerName] = useState(user?.name || '')
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '')
  const [deliveryMethod, setDeliveryMethod] = useState('antar')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('transfer')
  const [promoInput, setPromoInput] = useState('')
  const [promoApplied, setPromoApplied] = useState(null)
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [shipInfo, setShipInfo] = useState(null)
  const [payInfo, setPayInfo] = useState({ transfer: [], ewallet: [] })
  const [loadingConfig, setLoadingConfig] = useState(true)

  useEffect(() => {
    Promise.all([
      api('/shipping-info'),
      api('/payment-info'),
    ]).then(([ship, pay]) => {
      setShipInfo(ship)
      setPayInfo(pay)
    }).catch(() => {
      setShipInfo({ shipping_fee: 10000, free_shipping_minimum: 50000, store_address_full: 'Jl. Merdeka No. 123, Bandung', pickup_estimate: '30-45 menit', cod_enabled: true })
    }).finally(() => setLoadingConfig(false))
  }, [])

  const shippingFee = deliveryMethod === 'antar' ? (shipInfo?.shipping_fee || 10000) : 0
  const freeShipMin = shipInfo?.free_shipping_minimum || 0
  const qualifiesFreeShip = freeShipMin > 0 && totalPrice >= freeShipMin
  const effectiveShipping = promoApplied?.freeShipping || qualifiesFreeShip ? 0 : shippingFee
  const discountAmount = promoApplied?.discountAmount || 0
  const total = Math.max(0, totalPrice - discountAmount + effectiveShipping)
  const codEnabled = shipInfo?.cod_enabled === true || shipInfo?.cod_enabled === 'true'
  const storeAddress = shipInfo?.store_address_full || 'Jl. Merdeka No. 123, Bandung'
  const pickupEstimate = shipInfo?.pickup_estimate || '30-45 menit'
  const storeName = 'Arazel Store'

  const transferAccounts = payInfo?.transfer || []
  const ewalletAccounts = payInfo?.ewallet || []
  const hasNonCod = transferAccounts.length > 0 || ewalletAccounts.length > 0

  useEffect(() => {
    if (!codEnabled && paymentMethod === 'cod') {
      setPaymentMethod(hasNonCod ? 'transfer' : 'transfer')
    }
  }, [codEnabled, hasNonCod])

  async function applyPromo() {
    if (!promoInput.trim()) return
    setPromoLoading(true)
    setPromoError('')
    try {
      const data = await api('/promos/validate', {
        method: 'POST',
        body: JSON.stringify({ code: promoInput.trim(), subtotal: totalPrice, deliveryMethod }),
      })
      setPromoApplied(data.promo)
      addToast(`Promo ${data.promo.title} berhasil!`)
    } catch (err) {
      setPromoError(err.message)
    } finally {
      setPromoLoading(false)
    }
  }

  function removePromo() {
    setPromoApplied(null)
    setPromoInput('')
    setPromoError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (cart.items.length === 0) {
      addToast('Keranjang belanja kosong', 'error')
      return
    }
    setSubmitting(true)
    try {
      const items = cart.items.map((item) => ({
        productId: item.id,
        productName: item.name,
        productPrice: item.price,
        quantity: item.quantity,
      }))
      const data = await api('/orders', {
        method: 'POST',
        body: JSON.stringify({
          items, customerName, customerPhone, deliveryMethod,
          deliveryAddress: deliveryMethod === 'antar' ? deliveryAddress : null,
          paymentMethod, promoCode: promoApplied?.code || null,
        }),
      })
      clearCart()
      addToast('Pesanan berhasil dibuat!')
      navigate(`/order/${data.order.id}`)
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (user) {
      setCustomerName(user.name)
      setCustomerPhone(user.phone || '')
    }
  }, [user])

  if (cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-[21px] py-[55px] text-center">
        <div className="w-[89px] h-[89px] rounded-full bg-surface-secondary flex items-center justify-center mx-auto mb-[16px]">
          <ShoppingBag size={34} className="text-muted" />
        </div>
        <h2 className="text-[22px] font-bold text-primary mb-[8px]">Keranjang Kosong</h2>
        <p className="text-[14px] text-secondary mb-[21px]">Tambahkan menu dulu sebelum checkout</p>
        <Link to="/menu" className="btn-primary inline-flex">Lihat Menu</Link>
      </div>
    )
  }

  const formContent = (
    <>
      <SectionCard num={1} title="Informasi Pelanggan" icon={User} delay={0}>
        <div className="space-y-[10px]">
          <InputField icon={User} value={customerName} onChange={setCustomerName} placeholder="Nama lengkap" required />
          <InputField icon={Phone} value={customerPhone} onChange={setCustomerPhone} placeholder="Nomor HP" type="tel" required />
        </div>
      </SectionCard>

      <SectionCard num={2} title="Metode Pengiriman" icon={Bike} delay={0.04}>
        <div className="grid grid-cols-2 gap-[8px] mb-[10px]">
          <OptionCard selected={deliveryMethod === 'antar'} onClick={() => setDeliveryMethod('antar')} icon={Bike} title="Antar"
            subtitle={formatPrice(shippingFee)} />
          <OptionCard selected={deliveryMethod === 'jemput'} onClick={() => setDeliveryMethod('jemput')} icon={Store} title="Jemput" subtitle="Ambil di toko" />
        </div>
        {deliveryMethod === 'antar' ? (
          <div className="space-y-[8px]">
            <InputField icon={MapPin} value={deliveryAddress} onChange={setDeliveryAddress} placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota" textarea required />
            {freeShipMin > 0 && !qualifiesFreeShip && (
              <div className="flex items-center gap-[6px] text-[11px] text-muted">
                <Info size={12} />
                Gratis ongkir min. {formatPrice(freeShipMin)} ({formatPrice(freeShipMin - totalPrice)} lagi)
              </div>
            )}
            {freeShipMin > 0 && qualifiesFreeShip && (
              <div className="flex items-center gap-[6px] text-[11px] text-green-600 font-medium">
                <Check size={12} />
                Gratis ongkir!
              </div>
            )}
          </div>
        ) : (
          <div className="p-[12px] rounded-[10px] bg-brand-50/80 dark:bg-brand-900/10 border border-brand-200/60 dark:border-brand-800/60 text-[12px] text-secondary leading-relaxed flex items-start gap-[8px]">
            <Store size={15} className="text-brand-600 shrink-0 mt-[2px]" />
            <span>Ambil di <strong className="text-primary">{storeName}</strong>, {storeAddress}. Estimasi <strong className="text-primary">{pickupEstimate}</strong>.</span>
          </div>
        )}
      </SectionCard>

      <SectionCard num={3} title="Metode Pembayaran" icon={CreditCard} delay={0.08}>
        <div className={`grid grid-cols-2 gap-[8px] mb-[10px] ${codEnabled ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
          {transferAccounts.length > 0 && (
            <OptionCard selected={paymentMethod === 'transfer'} onClick={() => setPaymentMethod('transfer')} icon={CreditCard} title="Transfer"
              subtitle={transferAccounts.map(a => a.bank).filter(Boolean).join(' / ') || 'Bank'} />
          )}
          {ewalletAccounts.length > 0 && (
            <OptionCard selected={paymentMethod === 'e-wallet'} onClick={() => setPaymentMethod('e-wallet')} icon={Wallet} title="E-Wallet"
              subtitle={ewalletAccounts.map(a => a.provider).filter(Boolean).join(' / ') || 'Dompet digital'} />
          )}
          {codEnabled && (
            <OptionCard selected={paymentMethod === 'cod'} onClick={() => setPaymentMethod('cod')} icon={Banknote} title="COD" subtitle="Bayar di tempat" />
          )}
        </div>
        {paymentMethod === 'transfer' && transferAccounts.length > 0 && (
          <div className="p-[12px] rounded-[10px] bg-surface-secondary border border-subtle space-y-[6px] text-[12px]">
            <p className="font-medium text-primary mb-[4px]">Transfer ke:</p>
            {transferAccounts.map((acc, i) => (
              <CopyRow key={i} label={acc.bank || 'Bank'} value={acc.account || '-'}
                onCopy={() => { navigator.clipboard.writeText(acc.account || ''); addToast('Tersalin!') }} />
            ))}
            {transferAccounts.some(a => a.name) && (
              <div className="text-[11px] text-muted">a.n. {transferAccounts.map(a => a.name).filter(Boolean).join(' / ')}</div>
            )}
          </div>
        )}
        {paymentMethod === 'e-wallet' && ewalletAccounts.length > 0 && (
          <div className="p-[12px] rounded-[10px] bg-surface-secondary border border-subtle space-y-[6px] text-[12px]">
            <p className="font-medium text-primary mb-[4px]">Pembayaran via E-Wallet:</p>
            {ewalletAccounts.map((acc, i) => (
              <CopyRow key={i} label={acc.provider || 'Provider'} value={acc.account || '-'}
                onCopy={() => { navigator.clipboard.writeText(acc.account || ''); addToast('Tersalin!') }} />
            ))}
            {ewalletAccounts.some(a => a.name) && (
              <div className="text-[11px] text-muted">a.n. {ewalletAccounts.map(a => a.name).filter(Boolean).join(' / ')}</div>
            )}
          </div>
        )}
        {paymentMethod === 'cod' && (
          <div className="p-[12px] rounded-[10px] bg-brand-50/80 dark:bg-brand-900/10 border border-brand-200/60 dark:border-brand-800/60 flex items-start gap-[8px] text-[12px] text-secondary leading-relaxed">
            <Banknote size={15} className="text-brand-600 shrink-0 mt-[2px]" />
            <span>Bayar <strong className="text-primary">Cash</strong> atau <strong className="text-primary">QRIS</strong> saat pesanan diterima.
              {deliveryMethod === 'antar' ? ' Pembayaran ke kurir.' : ' Pembayaran di kasir.'}</span>
          </div>
        )}
      </SectionCard>

      <SectionCard num={4} title="Kode Promo" icon={Tag} delay={0.12}>
        {promoApplied ? (
          <div className="flex items-center justify-between p-[12px] rounded-[10px] bg-accent-50/80 dark:bg-accent-900/10 border border-accent-200/60 dark:border-accent-800/60">
            <div className="flex items-center gap-[8px]">
              <Tag size={14} className="text-accent-500" />
              <div>
                <div className="text-[12px] font-medium text-accent-700 dark:text-accent-400">{promoApplied.title}</div>
                <div className="text-[11px] text-accent-600 dark:text-accent-500">
                  {promoApplied.freeShipping ? 'Gratis ongkir' : `Diskon ${formatPrice(promoApplied.discountAmount)}`}
                </div>
              </div>
            </div>
            <button type="button" onClick={removePromo} className="text-muted hover:text-red-500 transition-colors p-[4px]">
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-[8px]">
              <input type="text" value={promoInput} onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                placeholder="Kode promo"
                className="flex-1 h-[40px] px-[12px] rounded-[8px] bg-surface border border-subtle text-primary text-[12px] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 uppercase transition-shadow"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyPromo())}
              />
              <button type="button" onClick={applyPromo} disabled={promoLoading || !promoInput.trim()}
                className="btn-primary h-[40px] px-[16px] text-[12px]"
              >{promoLoading ? '...' : 'Pakai'}</button>
            </div>
            {promoError && (
              <div className="flex items-center gap-[6px] mt-[8px] text-[11px] text-red-500">
                <AlertCircle size={12} />
                {promoError}
              </div>
            )}
          </>
        )}
      </SectionCard>
    </>
  )

  const summaryContent = (
    <div className="space-y-[10px]">
      <div className="bg-card rounded-[13px] border border-subtle overflow-hidden">
        <div className="flex items-center gap-[8px] px-[16px] pt-[14px] pb-[6px] border-b border-subtle">
          <div className="w-[24px] h-[24px] rounded-full bg-brand-600 text-white flex items-center justify-center">
            <Check size={12} />
          </div>
          <Package size={15} className="text-brand-600" />
          <h2 className="text-[14px] font-semibold text-primary">Pesanan</h2>
          <span className="text-[11px] text-muted ml-auto">{cart.items.length} item</span>
        </div>
        <div className="p-[16px] space-y-[8px]">
          {cart.items.map((item) => (
            <div key={item.id} className="flex items-center gap-[10px]">
              <div className="relative shrink-0">
                <img src={item.image} alt={item.name} className="w-[40px] h-[40px] rounded-[8px] object-cover" />
                <span className="absolute -top-[5px] -right-[5px] w-[18px] h-[18px] rounded-full bg-brand-600 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                  {item.quantity}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-medium text-primary truncate">{item.name}</div>
                <div className="text-[11px] text-muted">{formatPrice(item.price)}</div>
              </div>
              <div className="text-[12px] font-semibold text-primary shrink-0">{formatPrice(item.price * item.quantity)}</div>
            </div>
          ))}
        </div>
        <div className="px-[16px] pb-[16px] space-y-[6px] text-[12px] border-t border-subtle pt-[10px]">
          <SummaryRow label="Subtotal" value={formatPrice(totalPrice)} />
          {discountAmount > 0 && (
            <SummaryRow label="Diskon" value={`-${formatPrice(discountAmount)}`} accent />
          )}
          <SummaryRow label={deliveryMethod === 'antar' ? 'Ongkir' : 'Biaya Jemput'} value={effectiveShipping === 0 ? 'Gratis' : formatPrice(shippingFee)} accent={effectiveShipping === 0} />
        </div>
      </div>

      <div className="bg-card rounded-[13px] border border-subtle p-[16px]">
        <div className="flex items-center justify-between mb-[3px]">
          <span className="text-[11px] text-secondary">Total Pesanan</span>
          {paymentMethod === 'cod' && (
            <span className="flex items-center gap-[4px] text-[10px] font-medium text-brand-600 bg-brand-50 dark:bg-brand-900/20 px-[8px] py-[3px] rounded-full">
              <Banknote size={11} />
              COD
            </span>
          )}
        </div>
        <div className="text-[24px] font-bold text-brand-600 mb-[12px]">{formatPrice(total)}</div>
        <motion.button
          type="submit"
          disabled={submitting || loadingConfig}
          whileTap={{ scale: 0.98 }}
          className="btn-primary w-full justify-center h-[46px] text-[14px] font-semibold"
        >
          {submitting ? 'Memproses...' : 'Pesan Sekarang'}
        </motion.button>
        <p className="text-[10px] text-muted text-center mt-[8px]">Dengan memesan, kamu menyetujui syarat & ketentuan</p>
      </div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-[16px] py-[24px] md:py-[34px]">
      <Link to="/cart" className="inline-flex items-center gap-[6px] text-[12px] text-secondary hover:text-primary transition-colors mb-[16px]">
        <ArrowLeft size={14} />
        Kembali
      </Link>
      <h1 className="text-[24px] font-bold text-primary mb-[21px]">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="md:grid md:grid-cols-[1fr_340px] md:gap-[21px] items-start">
          <div className="space-y-[12px] mb-[16px] md:mb-0">
            {formContent}
          </div>
          <div className="md:sticky md:top-[88px]">
            {summaryContent}
          </div>
        </div>
      </form>
    </div>
  )
}

function InputField({ icon: Icon, value, onChange, placeholder, type, textarea, required }) {
  const Tag = textarea ? 'textarea' : 'input'
  return (
    <div>
      <div className="relative">
        {Icon && (
          <div className="absolute left-[12px] top-1/2 -translate-y-1/2 text-muted">
            <Icon size={14} />
          </div>
        )}
        <Tag
          type={type || 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          rows={textarea ? 3 : undefined}
          className={`w-full rounded-[8px] bg-surface border border-subtle text-primary text-[13px] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-shadow placeholder:text-muted ${
            textarea ? 'pl-[36px] pr-[12px] pt-[10px] resize-none' : 'h-[40px] pl-[36px] pr-[12px]'
          }`}
        />
      </div>
    </div>
  )
}

function CopyRow({ label, value, onCopy }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-medium text-primary">{label}</span>
      <button type="button" onClick={onCopy} className="flex items-center gap-[4px] text-secondary hover:text-primary transition-colors">
        {value} <Copy size={11} />
      </button>
    </div>
  )
}

function SummaryRow({ label, value, accent }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className={accent ? 'text-accent-600 dark:text-accent-400 font-medium' : 'text-primary font-medium'}>{value}</span>
    </div>
  )
}
