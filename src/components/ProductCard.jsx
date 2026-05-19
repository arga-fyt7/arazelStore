import { Link } from 'react-router-dom'
import { Plus, Check } from 'lucide-react'
import { motion } from 'motion/react'
import { useCart } from '../lib/useCart'
import { useToast } from '../lib/useToast'
import { formatPrice } from '../lib/utils'

export default function ProductCard({ product, index = 0 }) {
  const { dispatch, cart } = useCart()
  const { addToast } = useToast()
  const inCart = cart.items.find((item) => item.id === product.id)

  const cartPrice = product.discounted_price && product.discounted_price < Number(product.price) ? product.discounted_price : product.price

  const handleAdd = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch({
      type: 'ADD_TO_CART',
      payload: { id: product.id, name: product.name, price: cartPrice, image: product.image },
    })
    addToast(`${product.name} ditambahkan ke keranjang`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.4, delay: (index % 4) * 0.08 }}
      className="group bg-card rounded-[13px] overflow-hidden border border-subtle hover:border-brand-200 hover:shadow-lg transition-all duration-300"
    >
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-[1.3] overflow-hidden bg-surface-secondary">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => { e.target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' }}
          />
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-[13px] font-medium bg-black/60 px-[13px] py-[4px] rounded-full">
                Habis
              </span>
            </div>
          )}
          <div className="absolute top-[8px] left-[8px] flex flex-col gap-[4px]">
            {(product.sold_count > 0) && (
              <span className="bg-brand-600 text-white text-[10px] font-medium px-[8px] py-[3px] rounded-full">
                Best Seller
              </span>
            )}
            {product.tags?.includes('irit') && (
              <span className="bg-accent-600 text-white text-[10px] font-medium px-[8px] py-[3px] rounded-full">
                Irit!
              </span>
            )}
            {product.discount_type && product.discount_value > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-medium px-[8px] py-[3px] rounded-full">
                Diskon {product.discount_type === 'percentage' ? `${product.discount_value}%` : `Rp${Number(product.discount_value).toLocaleString('id-ID')}`}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="p-[21px] space-y-[13px]">
        <div>
          <Link
            to={`/product/${product.id}`}
            className="text-[16px] font-semibold text-primary hover:text-brand-600 transition-colors line-clamp-1"
          >
            {product.name}
          </Link>
          <p className="text-[13px] text-muted line-clamp-2 mt-[4px] leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            {product.discounted_price && product.discounted_price < Number(product.price) ? (
              <div className="flex items-center gap-[6px] flex-wrap">
                <span className="text-[18px] font-bold text-brand-600">{formatPrice(product.discounted_price)}</span>
                <span className="text-[12px] text-muted line-through">{formatPrice(product.price)}</span>
              </div>
            ) : (
              <span className="text-[18px] font-bold text-brand-600">{formatPrice(product.price)}</span>
            )}
          </div>
          <button
            onClick={handleAdd}
            disabled={product.stock === 0}
            className={`p-[10px] rounded-[10px] transition-all duration-200 ${
              product.stock === 0
                ? 'bg-surface-secondary text-muted cursor-not-allowed'
                : inCart
                  ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600'
                  : 'bg-brand-600 text-white hover:bg-brand-700'
            }`}
          >
            {inCart ? (
              <span className="flex items-center gap-[4px] text-[12px] font-semibold px-[4px]">
                <Check size={14} /> {inCart.quantity}
              </span>
            ) : (
              <Plus size={18} />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
