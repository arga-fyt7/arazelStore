import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Package, Clock, CheckCircle, X, ArrowRight } from 'lucide-react'
import { formatPrice } from '../lib/utils'
import { api } from '../lib/api'

const statusConfig = {
  pending: { label: 'Menunggu Pembayaran', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/20', icon: Clock },
  paid: { label: 'Sudah Dibayar', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/20', icon: CheckCircle },
  processing: { label: 'Diproses', color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-100 dark:bg-brand-900/20', icon: Package },
  done: { label: 'Selesai', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/20', icon: CheckCircle },
  cancelled: { label: 'Dibatalkan', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/20', icon: X },
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('/orders').then((data) => setOrders(data.orders)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center">
        <div className="w-[34px] h-[34px] border-[3px] border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-[500px] mx-auto px-[21px] py-[34px]">
      <h1 className="text-[26px] font-bold text-primary mb-[34px]">Pesanan Saya</h1>

      {orders.length === 0 ? (
        <div className="text-center py-[55px]">
          <div className="w-[89px] h-[89px] rounded-full bg-surface-secondary flex items-center justify-center mx-auto mb-[16px]">
            <Package size={34} className="text-muted" />
          </div>
          <h2 className="text-[18px] font-semibold text-primary mb-[8px]">Belum Ada Pesanan</h2>
          <p className="text-[14px] text-secondary mb-[21px]">Kamu belum melakukan pemesanan apapun</p>
          <Link to="/menu" className="btn-primary inline-flex">Mulai Pesan</Link>
        </div>
      ) : (
        <div className="space-y-[13px]">
          {orders.map((order, i) => {
            const cfg = statusConfig[order.status]
            const Icon = cfg.icon
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link to={`/order/${order.id}`} className="block bg-card rounded-[13px] p-[16px] border border-subtle hover:border-brand-300 transition-colors">
                  <div className="flex items-center justify-between mb-[8px]">
                    <span className="text-[13px] font-semibold text-primary">#{order.order_number}</span>
                    <span className={`inline-flex items-center gap-[4px] text-[11px] font-medium px-[10px] py-[3px] rounded-full ${cfg.bg} ${cfg.color}`}>
                      <Icon size={12} />
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-secondary">{new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="font-semibold text-primary">{formatPrice(order.total)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-[8px] pt-[8px] border-t border-subtle">
                    <span className="text-[11px] text-muted capitalize">{order.delivery_method === 'antar' ? 'Di antar' : 'Di jemput'} · {order.payment_method === 'transfer' ? 'Transfer' : order.payment_method === 'cod' ? 'COD' : 'E-Wallet'}</span>
                    <ArrowRight size={14} className="text-muted" />
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
