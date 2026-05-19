import { ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-brand-700 min-h-[70vh] flex items-center">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-600/60 to-brand-800/80" />
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
        backgroundSize: '34px 34px',
      }} />

      <div className="relative w-full max-w-4xl mx-auto px-[21px] py-[89px] md:py-[144px]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="max-w-[580px]"
        >
          <span className="inline-block text-brand-200 text-[13px] font-medium tracking-[0.15em] uppercase mb-[13px]">
            Kuliner Nusantara
          </span>

          <h1 className="text-[42px] md:text-[64px] leading-[1.05] font-bold text-white">
            Makanan Lokal
            <br />
            <span className="text-brand-200">Indonesia</span>
          </h1>

          <p className="text-[16px] md:text-[17px] text-white/65 leading-relaxed mt-[21px] max-w-[460px]">
            Pesan aneka kuliner tradisional dari berbagai daerah.
            Dibuat dengan resep autentik dan bahan alami.
          </p>

          <div className="flex flex-wrap gap-[13px] mt-[34px]">
            <Link to="/menu" className="px-[34px] py-[13px] rounded-[13px] text-[15px] font-semibold bg-white text-brand-700 hover:bg-brand-50 transition-all shadow-lg">
              Jelajahi Menu
              <ArrowRight size={18} className="inline ml-[8px] -mt-[2px]" />
            </Link>
            <Link
              to="/promo"
              className="px-[34px] py-[13px] rounded-[13px] text-[15px] font-medium text-white border border-white/20 hover:bg-white/10 transition-all"
            >
              Lihat Promo
            </Link>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[55px] bg-gradient-to-t from-[var(--bg)] to-transparent" />
    </section>
  )
}
