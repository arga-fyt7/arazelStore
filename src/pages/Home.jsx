import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, TrendingUp } from 'lucide-react'
import Hero from '../components/Hero'
import ProductCard from '../components/ProductCard'
import Testimonials from '../components/Testimonials'
import { deriveCategories } from '../data/categories'
import { motion } from 'motion/react'
import { formatPrice } from '../lib/utils'

export default function Home() {
  const [products, setProducts] = useState([])

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(d => setProducts(d.products || []))
      .catch(() => {})
  }, [])

  const categories = deriveCategories(products).filter(c => c.id !== 'semua')
  const featuredProducts = [...products].sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0)).slice(0, 4)

  return (
    <>
      <Hero />

      <section className="max-w-4xl mx-auto px-[21px] -mt-[34px] relative z-10">
        <div className="grid grid-cols-3 gap-[13px] md:gap-[21px]">
          {categories.map((cat, i) => {
            const count = products.filter((p) => p.category === cat.id).length
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
                whileHover={{ y: -4 }}
              >
                <Link
                  to={`/menu?category=${cat.id}`}
                  className="block bg-card rounded-[13px] p-[21px] md:p-[34px] text-center border border-subtle hover:border-brand-200 hover:shadow-md transition-all duration-300"
                >
                  <div className="w-[48px] h-[48px] md:w-[60px] md:h-[60px] rounded-[13px] bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center mx-auto mb-[13px]"
                  >
                    <span className="text-[26px]">{cat.icon}</span>
                    </div>
                  <h3 className="text-[13px] md:text-[16px] font-semibold text-primary">
                    {cat.label}
                  </h3>
                  <p className="text-[11px] md:text-[13px] text-muted mt-[4px]">
                    {count} menu
                  </p>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-[21px] py-[55px] md:py-[89px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-[34px]"
        >
          <div>
            <span className="text-[13px] text-brand-600 font-medium uppercase tracking-wider flex items-center gap-[6px]">
              <TrendingUp size={14} />
              Best Seller
            </span>
            <h2 className="text-[26px] md:text-[34px] font-bold text-primary mt-[4px]">
              Paling Populer
            </h2>
          </div>
          <Link
            to="/menu"
            className="hidden md:inline-flex items-center gap-[8px] text-[14px] font-medium text-muted hover:text-brand-600 transition-colors"
          >
            Lihat Semua
            <ArrowRight size={16} />
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[13px] md:gap-[21px]">
          {featuredProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-[21px] md:hidden"
        >
          <Link
            to="/menu"
            className="inline-flex items-center gap-[8px] text-[14px] font-medium text-brand-600 dark:text-brand-400 transition-colors"
          >
            Lihat Semua Menu
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </section>

      <Testimonials />

      <section className="bg-brand-700 text-white">
        <div className="max-w-4xl mx-auto px-[21px] py-[55px] md:py-[89px] text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-[21px]"
          >
            <h2 className="text-[26px] md:text-[34px] font-bold leading-[1.1]">
              Siap Mencicipi?
            </h2>
            <p className="text-[15px] text-white/70 max-w-[380px] mx-auto leading-relaxed">
              Mulai dari {formatPrice(5000)} aja. Pesan sekarang dan nikmati
              kelezatan kuliner Nusantara.
            </p>
            <div className="pt-[8px]">
              <Link
                to="/menu"
                className="inline-flex items-center gap-[8px] bg-white text-brand-700 px-[34px] py-[13px] rounded-[13px] font-semibold hover:bg-brand-50 transition-all shadow-lg text-[15px]"
              >
                Pesan Sekarang
                <ArrowRight size={18} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}
