import { useState, useMemo, useEffect } from 'react'
import { Search, X, ArrowDownUp, SlidersHorizontal } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import ProductCard from '../components/ProductCard'
import CategoryBar from '../components/CategoryBar'
import { deriveCategories } from '../data/categories'
import { cn } from '../lib/utils'

const sortOptions = [
  { value: 'default', label: 'Terbaru' },
  { value: 'price-asc', label: 'Termurah' },
  { value: 'price-desc', label: 'Termahal' },
  { value: 'name', label: 'A-Z' },
]

export default function Menu() {
  const [allProducts, setAllProducts] = useState([])
  const [activeCategory, setActiveCategory] = useState('semua')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('default')
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(d => { setAllProducts(d.products || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const categories = useMemo(() => deriveCategories(allProducts), [allProducts])

  const filtered = useMemo(() => {
    let result = [...allProducts]
    if (activeCategory !== 'semua') result = result.filter((p) => p.category === activeCategory)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(q)),
      )
    }
    switch (sortBy) {
      case 'price-asc': result.sort((a, b) => a.price - b.price); break
      case 'price-desc': result.sort((a, b) => b.price - a.price); break
      case 'name': result.sort((a, b) => a.name.localeCompare(b.name)); break
    }
    return result
  }, [allProducts, activeCategory, searchQuery, sortBy])

  const activeLabel = categories.find((c) => c.id === activeCategory)?.label || 'Semua'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-[34px] h-[34px] border-[3px] border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-b from-brand-50 dark:from-brand-950/20 to-[var(--bg)] pt-[55px] md:pt-[89px] pb-[21px]">
        <div className="max-w-6xl mx-auto px-[21px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-[34px]"
          >
            <span className="text-[13px] text-brand-600 font-medium uppercase tracking-wider">
              Belanja
            </span>
            <h1 className="text-[34px] md:text-[42px] font-bold text-primary mt-[8px] mb-[13px]">
              Semua Menu
            </h1>
            <p className="text-[16px] text-secondary max-w-[500px] mx-auto">
              Jelajahi berbagai pilihan kuliner Nusantara.
            </p>
            <div className="golden-divider mt-[13px]" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="max-w-[500px] mx-auto mb-[21px]"
          >
            <div className="relative">
              <Search size={18} className="absolute left-[16px] top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Cari menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-phi pl-[42px] pr-[42px] text-[14px]"
              />
              <AnimatePresence>
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    onClick={() => setSearchQuery('')}
                    className="absolute right-[16px] top-1/2 -translate-y-1/2 text-muted hover:text-secondary transition-colors"
                  >
                    <X size={16} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mb-[13px]"
          >
            <CategoryBar categories={categories} active={activeCategory} onSelect={setActiveCategory} />
          </motion.div>

          <div className="flex items-center justify-between mb-[21px]">
            <p className="text-[13px] text-secondary">
              {filtered.length > 0
                ? `${filtered.length} ${searchQuery ? `hasil "${searchQuery}"` : activeLabel.toLowerCase()}`
                : 'Tidak ditemukan'}
            </p>

            <div className="flex items-center gap-[8px]">
              <div className="hidden sm:flex items-center gap-[4px] bg-card rounded-[8px] border border-subtle p-[4px]">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className={cn(
                      'px-[13px] py-[4px] rounded-[6px] text-[11px] font-medium transition-colors',
                      sortBy === opt.value
                        ? 'bg-brand-600 text-white'
                        : 'text-secondary hover:text-primary',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="sm:hidden p-[8px] rounded-[8px] border border-subtle text-secondary hover:text-primary hover:bg-surface-secondary transition-colors"
              >
                <SlidersHorizontal size={16} />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="sm:hidden mb-[21px] bg-card rounded-[13px] p-[13px] border border-subtle overflow-hidden"
              >
                <div className="flex flex-wrap gap-[4px]">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortBy(opt.value); setShowFilters(false) }}
                      className={cn(
                        'px-[13px] py-[6px] rounded-[6px] text-[12px] font-medium transition-colors',
                        sortBy === opt.value
                          ? 'bg-brand-600 text-white'
                          : 'text-secondary hover:text-primary bg-surface-secondary',
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-[21px] -mt-[8px] pb-[55px] md:pb-[89px]">
        {filtered.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[21px]"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((product, index) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                >
                  <ProductCard product={product} index={index} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-[55px]"
          >
            <div className="w-[89px] h-[89px] rounded-full bg-surface-secondary flex items-center justify-center mx-auto mb-[21px]">
              <Search size={34} className="text-muted" />
            </div>
            <h3 className="text-[22px] font-semibold text-primary mb-[8px]">
              Produk Tidak Ditemukan
            </h3>
            <p className="text-[14px] text-muted">
              Coba gunakan kata kunci lain atau pilih kategori berbeda.
            </p>
          </motion.div>
        )}
      </section>
    </div>
  )
}
