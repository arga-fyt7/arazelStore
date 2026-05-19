import { useState, useEffect, useMemo } from 'react'
import { Tag, Clock, Copy, Check, Gift, Sparkles, Percent } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { formatPrice } from '../lib/utils'
import { api } from '../lib/api'

function Countdown({ date }) {
  const [now, setNow] = useState(Date.now())
  const diff = new Date(date).getTime() - now

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(id)
  }, [])

  if (diff <= 0) return <span className="text-red-500 font-medium">Berakhir</span>

  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  return <span className="text-accent-600 dark:text-accent-400 font-medium">{days}h {hours}j lagi</span>
}

function PromoCard({ promo, index }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(promo.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isValid = !promo.end_date || new Date(promo.end_date) > new Date()

  const discountLabel = promo.type === 'percentage' ? `${promo.value}% OFF`
    : promo.type === 'free_shipping' ? 'GRATIS ONGKIR'
    : promo.type === 'fixed' ? `Diskon Rp${promo.value.toLocaleString()}`
    : ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      whileHover={{ y: -4 }}
      className="group bg-card rounded-[13px] overflow-hidden border border-subtle hover:border-brand-200 hover:shadow-xl transition-all duration-300"
    >
      <div className="relative h-[160px] bg-gradient-to-br from-brand-100 to-accent-100 dark:from-brand-950 dark:to-accent-950 flex items-center justify-center overflow-hidden">
        <div className="text-center">
          {promo.type === 'free_shipping' ? (
            <div className="w-[64px] h-[64px] rounded-full bg-white/80 dark:bg-white/10 flex items-center justify-center mx-auto mb-[8px]">
              <Tag size={32} className="text-brand-600" />
            </div>
          ) : (
            <span className="text-[40px] font-bold text-brand-600 drop-shadow-sm">
              {promo.type === 'percentage' ? `${promo.value}%` : ''}
            </span>
          )}
          <p className="text-[12px] text-stone-500 dark:text-stone-400 font-medium px-[16px]">
            {promo.type === 'free_shipping' ? 'Gratis Ongkir' : promo.type === 'percentage' ? 'Diskon' : 'Promo'}
          </p>
        </div>
        {promo.type === 'free_shipping' && (
          <span className="absolute bottom-[12px] right-[12px] bg-accent-600 text-white text-[10px] font-bold px-[8px] py-[4px] rounded-full">
            FREE
          </span>
        )}
        {!isValid && (
          <span className="absolute top-[8px] right-[8px] bg-stone-700/80 text-white text-[10px] font-medium px-[8px] py-[4px] rounded-full backdrop-blur-sm">
            Kadaluarsa
          </span>
        )}
      </div>

      <div className="p-[21px] space-y-[13px]">
        <h3 className="text-[16px] md:text-[18px] font-bold text-primary leading-snug">
          {promo.title}
        </h3>
        <p className="text-[13px] text-secondary leading-relaxed">
          {promo.description}
        </p>

        <div className="flex flex-wrap gap-x-[16px] gap-y-[6px] text-[12px]">
          {promo.min_purchase > 0 && (
            <span className="flex items-center gap-[4px] text-muted">
              <Tag size={12} />
              Min. {formatPrice(promo.min_purchase)}
            </span>
          )}
          {promo.end_date && (
            <span className="flex items-center gap-[4px] text-muted">
              <Clock size={12} />
              <Countdown date={promo.end_date} />
            </span>
          )}
        </div>

        <div className="flex items-center gap-[8px] pt-[4px]">
          <div className="flex-1 bg-surface-secondary border border-dashed border-stone-300 dark:border-stone-600 rounded-[8px] px-[13px] py-[8px] text-center">
            <span className="text-[15px] font-bold tracking-wider text-brand-600 dark:text-brand-400 font-mono">
              {promo.code}
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleCopy}
            className={`p-[10px] rounded-[8px] transition-all ${
              copied
                ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-600'
                : 'bg-brand-600 text-white hover:bg-brand-700'
            }`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

export default function Promo() {
  useEffect(() => { document.title = 'Promo - Arazel Store' }, [])
  const [allPromos, setAllPromos] = useState([])

  useEffect(() => {
    api('/promos')
      .then(d => setAllPromos(d.promos || []))
      .catch(() => {})
  }, [])

  const active = allPromos.filter(p => !p.end_date || new Date(p.end_date) > new Date())
  const featured = active.filter((_, i) => i < 2)
  const regular = active.filter(p => !featured.includes(p))

  return (
    <div className="min-h-screen">
      <section className="bg-brand-700 text-white">
        <div className="max-w-6xl mx-auto px-[21px] py-[55px] md:py-[89px] text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-[21px]"
          >
            <div className="inline-flex items-center gap-[8px] bg-white/15 text-white text-[13px] font-medium px-[21px] py-[8px] rounded-full">
              <Gift size={14} />
              Promo & Diskon
            </div>

            <h1 className="text-[34px] md:text-[55px] font-bold leading-[1.1]">
              Promo Spesial{' '}
              <span className="text-brand-200">Untukmu</span>
            </h1>

            <p className="text-[16px] text-white/65 max-w-[500px] mx-auto leading-relaxed">
              Manfaatkan berbagai promo dan diskon menarik untuk menikmati
              kuliner Nusantara favoritmu dengan harga lebih hemat.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-[21px] -mt-[21px] pb-[55px] md:pb-[89px]">
        <AnimatePresence mode="wait">
          {featured.length > 0 && (
            <motion.div
              key="featured"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h2 className="text-[22px] font-bold text-primary mb-[21px] flex items-center gap-[8px]">
                <Sparkles size={20} className="text-brand-500" />
                Promo Unggulan
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[21px] mb-[34px]">
                {featured.map((promo, i) => (
                  <PromoCard key={promo.id} promo={promo} index={i} />
                ))}
              </div>
            </motion.div>
          )}

          {regular.length > 0 && (
            <motion.div
              key="regular"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h2 className="text-[22px] font-bold text-primary mb-[21px] flex items-center gap-[8px]">
                <Percent size={18} className="text-brand-500" />
                Promo Lainnya
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[21px]">
                {regular.map((promo, i) => (
                  <PromoCard key={promo.id} promo={promo} index={i + featured.length} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {allPromos.length === 0 && (
          <div className="text-center py-[55px]">
            <p className="text-[16px] text-muted">Tidak ada promo saat ini.</p>
          </div>
        )}
      </section>

      <section className="bg-surface-secondary border-y border-subtle">
        <div className="max-w-4xl mx-auto px-[21px] py-[34px] md:py-[55px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-[700px] mx-auto text-center space-y-[21px]"
          >
            <h2 className="text-[22px] md:text-[26px] font-bold text-primary">
              Cara Pakai Kode Promo
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[21px] text-left">
              {[
                { step: '1', title: 'Pilih Promo', desc: 'Cari promo & salin kode.' },
                { step: '2', title: 'Pesan Menu', desc: 'Tambah menu ke keranjang.' },
                { step: '3', title: 'Masukkan Kode', desc: 'Tempel kode promo saat checkout.' },
              ].map((item) => (
                <div
                  key={item.step}
                  className="bg-card rounded-[13px] p-[21px] border border-subtle"
                >
                  <span className="w-[34px] h-[34px] rounded-full bg-brand-600 text-white font-bold text-[14px] flex items-center justify-center mb-[8px]">
                    {item.step}
                  </span>
                  <h3 className="text-[14px] font-semibold text-primary mb-[4px]">{item.title}</h3>
                  <p className="text-[13px] text-secondary leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
