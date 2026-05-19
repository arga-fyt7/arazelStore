import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ShoppingCart, Check, Package, Clock, Shield, Plus, Minus } from 'lucide-react'
import { motion } from 'motion/react'
import { useState, useEffect } from 'react'
import { useCart } from '../lib/useCart'
import { useToast } from '../lib/useToast'
import { formatPrice } from '../lib/utils'

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const { dispatch, cart } = useCart()
  const { addToast } = useToast()
  const [qty, setQty] = useState(1)

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(r => r.json())
      .then(d => {
        setProduct(d.product)
        if (d.product) {
          fetch('/api/products')
            .then(r => r.json())
            .then(all => {
              setRelated((all.products || []).filter(p => p.category === d.product.category && p.id !== d.product.id).slice(0, 4))
            })
            .catch(() => {})
        }
      })
      .catch(() => setProduct(null))
  }, [id])

  const inCart = cart.items.find((item) => item.id === Number(id))

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-[21px] py-[89px] text-center">
        <h1 className="text-[34px] font-bold text-primary mb-[13px]">Produk Tidak Ditemukan</h1>
        <Link to="/" className="btn-primary">Kembali ke Beranda</Link>
      </div>
    )
  }

  const cartPrice = product.discounted_price && product.discounted_price < Number(product.price) ? product.discounted_price : product.price

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) {
      dispatch({
        type: 'ADD_TO_CART',
        payload: { id: product.id, name: product.name, price: cartPrice, image: product.image },
      })
    }
    addToast(`${qty}x ${product.name} ditambahkan ke keranjang`)
    setQty(1)
  }

  return (
    <div className="max-w-6xl mx-auto px-[21px] py-[34px]">
      <Link
        to="/menu"
        className="inline-flex items-center gap-[8px] text-[14px] text-secondary hover:text-brand-600 transition-colors mb-[34px] group"
      >
        <motion.span whileHover={{ x: -4 }}>
          <ArrowLeft size={16} />
        </motion.span>
        Kembali ke Menu
      </Link>

      <div className="golden-grid">
        <div className="relative rounded-[13px] overflow-hidden bg-surface-secondary aspect-[1.3] md:aspect-auto md:h-full">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' }}
          />
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[2px]">
              <span className="text-white text-[16px] font-medium bg-black/60 px-[21px] py-[8px] rounded-full">
                Stok Habis
              </span>
            </div>
          )}
        </div>

        <div className="space-y-[21px]">
          <div>
            {(product.tags || []).map((tag) => (
              <span
                key={tag}
                className="inline-block text-[10px] font-medium text-brand-600 bg-brand-50 dark:bg-brand-900/20 px-[8px] py-[4px] rounded-full mr-[4px] capitalize"
              >
                {tag}
              </span>
            ))}
          </div>

          <h1 className="text-[34px] md:text-[42px] font-bold text-primary leading-[1.1]">
            {product.name}
          </h1>

          <p className="text-[16px] text-secondary leading-relaxed">
            {product.description}
          </p>

          <div className="flex flex-wrap gap-[21px] py-[13px] border-y border-subtle">
            <div className="flex items-center gap-[8px] text-[13px] text-secondary">
              <Package size={16} className="text-brand-400" />
              <span>{product.weight}g</span>
            </div>
            <div className="flex items-center gap-[8px] text-[13px] text-secondary">
              <Clock size={16} className="text-brand-400" />
              <span>30-45 menit</span>
            </div>
            <div className="flex items-center gap-[8px] text-[13px] text-secondary">
              <Shield size={16} className="text-brand-400" />
              <span>Halal</span>
            </div>
          </div>

          <div className="space-y-[13px]">
            <div className="flex items-center gap-[10px] flex-wrap">
              {product.discounted_price && product.discounted_price < Number(product.price) ? (
                <>
                  <span className="text-[34px] font-bold text-brand-600">{formatPrice(product.discounted_price)}</span>
                  <span className="text-[18px] text-muted line-through">{formatPrice(product.price)}</span>
                  <span className="text-[12px] font-medium px-[8px] py-[3px] rounded-full bg-red-50 text-red-600">
                    Diskon {product.discount_type === 'percentage' ? `${product.discount_value}%` : `Rp${Number(product.discount_value).toLocaleString('id-ID')}`}
                  </span>
                </>
              ) : (
                <span className="text-[34px] font-bold text-brand-600">{formatPrice(product.price)}</span>
              )}
            </div>
            <p className="text-[13px] text-muted">
              Stok: {product.stock > 0 ? product.stock : 'Habis'}
            </p>
          </div>

          {product.stock > 0 && (
            <div className="flex items-center gap-[13px]">
              <span className="text-[14px] font-medium text-primary">Jumlah:</span>
              <div className="flex items-center gap-[8px]">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-[34px] h-[34px] rounded-[8px] border border-subtle flex items-center justify-center text-secondary hover:border-brand-300 hover:text-brand-600 transition-colors"
                >
                  <Minus size={14} />
                </motion.button>
                <motion.span
                  key={qty}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-[18px] font-semibold w-[30px] text-center text-primary"
                >
                  {qty}
                </motion.span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setQty(Math.min(product.stock, qty + 1))}
                  className="w-[34px] h-[34px] rounded-[8px] border border-subtle flex items-center justify-center text-secondary hover:border-brand-300 hover:text-brand-600 transition-colors"
                >
                  <Plus size={14} />
                </motion.button>
              </div>
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleAdd}
            disabled={product.stock === 0}
            className={`btn-primary w-full justify-center text-[15px] ${
              product.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {inCart ? (
              <>
                <Check size={18} />
                Tambah Lagi ({qty})
              </>
            ) : (
              <>
                <ShoppingCart size={18} />
                {qty > 1 ? `Tambah ${qty} ke Keranjang` : 'Tambah ke Keranjang'}
              </>
            )}
          </motion.button>

          <Link
            to="/cart"
            className="block text-center text-[14px] text-brand-600 dark:text-brand-400 hover:text-brand-700 underline underline-offset-4"
          >
            Lihat Keranjang & Checkout &rarr;
          </Link>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-[55px] md:mt-[89px]">
          <h2 className="text-[22px] font-bold text-primary mb-[21px]">
            Produk Lainnya
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[13px] md:gap-[21px]">
            {related.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ y: -4 }}
              >
                <Link
                  to={`/product/${item.id}`}
                  className="group block bg-card rounded-[13px] overflow-hidden border border-subtle hover:border-brand-200 hover:shadow-lg transition-all"
                >
                  <div className="aspect-[1.3] bg-surface-secondary overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => { e.target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' }}
                    />
                  </div>
                  <div className="p-[13px]">
                    <p className="text-[13px] font-semibold text-primary line-clamp-1">
                      {item.name}
                    </p>
                    <p className="text-[14px] font-bold text-brand-600 mt-[4px]">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
