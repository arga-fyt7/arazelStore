import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, ArrowLeft, ShoppingBag, Minus, Plus, LogIn, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '../lib/useAuth'
import { useCart } from '../lib/useCart'
import { useConfirm } from '../lib/useConfirm'
import { formatPrice } from '../lib/utils'

export default function Cart() {
  const { cart, dispatch, totalItems, totalPrice } = useCart()
  const { user } = useAuth()
  const { confirm } = useConfirm()
  const navigate = useNavigate()
  const [shipInfo, setShipInfo] = useState(null)

  useEffect(() => {
    fetch('/api/shipping-info')
      .then(r => r.json())
      .then(setShipInfo)
      .catch(() => {})
  }, [])

  const freeShipMin = shipInfo?.free_shipping_minimum || 50000
  const qualifiesFreeShip = freeShipMin > 0 && totalPrice >= freeShipMin

  if (cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-[21px] py-[89px] text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-[21px]"
        >
          <div className="w-[89px] h-[89px] rounded-full bg-surface-secondary flex items-center justify-center mx-auto">
            <ShoppingBag size={34} className="text-muted" />
          </div>
          <h1 className="text-[34px] font-bold text-primary">Keranjang Kosong</h1>
          <p className="text-[16px] text-secondary max-w-[400px] mx-auto">
            Belum ada item di keranjangmu. Yuk, pilih makanan lokal favoritmu!
          </p>
          <Link to="/menu" className="btn-primary">
            <ArrowLeft size={18} />
            Mulai Belanja
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-[21px] py-[34px]">
      <Link
        to="/menu"
        className="inline-flex items-center gap-[8px] text-[14px] text-secondary hover:text-brand-600 transition-colors mb-[34px]"
      >
        <ArrowLeft size={16} />
        Lanjut Belanja
      </Link>

      <h1 className="text-[34px] font-bold text-primary mb-[34px]">
        Keranjang ({totalItems})
      </h1>

      <div className="golden-grid">
        <div className="space-y-[13px]">
          <AnimatePresence mode="popLayout">
            {cart.items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -30, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 30, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="bg-card rounded-[13px] p-[13px] flex gap-[13px] border border-subtle"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-[68px] h-[68px] rounded-[10px] object-cover shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <Link
                    to={`/product/${item.id}`}
                    className="text-[14px] font-semibold text-primary hover:text-brand-600 transition-colors line-clamp-1"
                  >
                    {item.name}
                  </Link>
                  <p className="text-[14px] font-bold text-brand-600 mt-[4px]">
                    {formatPrice(item.price)}
                  </p>

                  <div className="flex items-center gap-[8px] mt-[8px]">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() =>
                        dispatch({ type: 'UPDATE_QUANTITY', payload: { id: item.id, quantity: item.quantity - 1 } })
                      }
                      className="w-[28px] h-[28px] rounded-[8px] border border-subtle flex items-center justify-center text-secondary hover:border-brand-300 hover:text-brand-600 transition-colors"
                    >
                      <Minus size={13} />
                    </motion.button>
                    <motion.span
                      key={item.quantity}
                      initial={{ scale: 1.3 }}
                      animate={{ scale: 1 }}
                      className="text-[14px] font-semibold w-[24px] text-center text-primary"
                    >
                      {item.quantity}
                    </motion.span>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() =>
                        dispatch({ type: 'UPDATE_QUANTITY', payload: { id: item.id, quantity: item.quantity + 1 } })
                      }
                      className="w-[28px] h-[28px] rounded-[8px] border border-subtle flex items-center justify-center text-secondary hover:border-brand-300 hover:text-brand-600 transition-colors"
                    >
                      <Plus size={13} />
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => dispatch({ type: 'REMOVE_FROM_CART', payload: item.id })}
                      className="ml-auto p-[6px] rounded-[6px] text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="bg-card rounded-[13px] p-[21px] border border-subtle h-fit sticky top-[89px]">
          <h3 className="text-[16px] font-semibold text-primary mb-[21px]">
            Ringkasan
          </h3>

          <div className="space-y-[13px] text-[14px]">
            <div className="flex justify-between text-secondary">
              <span>Total Item</span>
              <span>{totalItems} item</span>
            </div>
            <div className="flex justify-between text-secondary">
              <span>Subtotal</span>
              <span className="font-medium text-primary">{formatPrice(totalPrice)}</span>
            </div>
            <div className="flex justify-between text-secondary">
              <span>Ongkir</span>
              <span className="text-accent-600 dark:text-accent-400 font-medium">
                {qualifiesFreeShip ? 'Gratis' : `Gratis*`}
              </span>
            </div>
          </div>

          <div className="border-t border-subtle mt-[13px] pt-[13px] flex justify-between">
            <span className="font-semibold text-primary">Total</span>
            <span className="text-[22px] font-bold text-brand-600">
              {formatPrice(totalPrice)}
            </span>
          </div>

          {freeShipMin > 0 && !qualifiesFreeShip && (
            <p className="text-[11px] text-muted mt-[8px]">
              *Gratis ongkir min. {formatPrice(freeShipMin)}
            </p>
          )}
          {qualifiesFreeShip && (
            <p className="text-[11px] text-green-600 font-medium mt-[8px] flex items-center gap-[4px]">
              <Check size={12} /> Gratis ongkir!
            </p>
          )}

          {user ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/checkout')}
              className="btn-primary w-full justify-center mt-[13px]"
            >
              Checkout
            </motion.button>
          ) : (
            <Link
              to="/login"
              className="btn-primary w-full justify-center mt-[13px] inline-flex"
            >
              <LogIn size={16} />
              Masuk untuk Checkout
            </Link>
          )}



          <button
            onClick={async () => {
              const ok = await confirm({
                title: 'Kosongkan Keranjang?',
                message: 'Semua item di keranjang akan dihapus. Tindakan ini tidak bisa dibatalkan.',
                confirmText: 'Kosongkan',
                variant: 'danger',
              })
              if (ok) dispatch({ type: 'CLEAR_CART' })
            }}
            className="w-full text-center text-[13px] text-muted hover:text-red-500 transition-colors mt-[13px]"
          >
            Kosongkan
          </button>
        </div>
      </div>
    </div>
  )
}
