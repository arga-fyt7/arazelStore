import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  ShoppingBag, Package, Users, DollarSign, Clock, CreditCard,
  TrendingUp, ArrowRight, AlertCircle, Percent, PackageOpen, BarChart3,
} from 'lucide-react'
import AdminLayout from '../../components/AdminLayout'
import { formatPrice } from '../../lib/utils'
import { api } from '../../lib/api'

const statusLabel = { pending: 'Menunggu', paid: 'Dibayar', processing: 'Diproses', done: 'Selesai', cancelled: 'Dibatalkan' }
const statusColor = {
  pending: 'bg-yellow-50 text-yellow-700', paid: 'bg-blue-50 text-blue-700',
  processing: 'bg-brand-50 text-brand-700', done: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'baru saja'
  if (m < 60) return `${m}m lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}j lalu`
  const d = Math.floor(h / 24)
  return `${d}h lalu`
}

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('/admin/dashboard').then((d) => {
      if (d.stats) setData(d)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[300px]">
          <div className="w-[34px] h-[34px] border-[3px] border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  if (!data) return <AdminLayout><p className="text-[15px] text-secondary">Gagal memuat data</p></AdminLayout>

  const revenueMax = Math.max(...data.revenueByMonth.map(r => Number(r.revenue)), 1)
  const totalByStatus = data.ordersByStatus.reduce((s, o) => s + o.count, 0) || 1

  return (
    <AdminLayout>
      <div className="space-y-[24px]">
        <div>
          <h1 className="text-[24px] md:text-[28px] font-bold text-primary">Dashboard</h1>
          <p className="text-[14px] md:text-[15px] text-secondary mt-[4px]">Ringkasan operasional toko</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-[12px] md:gap-[16px]">
          {[
            { label: 'Total Pesanan', value: data.stats.totalOrders, icon: ShoppingBag, color: 'text-blue-600 bg-blue-50', sub: `${data.stats.todayOrders} hari ini` },
            { label: 'Pendapatan', value: formatPrice(data.stats.totalRevenue), icon: DollarSign, color: 'text-green-600 bg-green-50', sub: null },
            { label: 'Produk Aktif', value: data.stats.activeProducts, icon: Package, color: 'text-brand-600 bg-brand-50', sub: `${data.stats.totalProducts} total` },
            { label: 'Pelanggan', value: data.stats.totalUsers, icon: Users, color: 'text-purple-600 bg-purple-50', sub: null },
            { label: 'Promo Aktif', value: data.stats.activePromos, icon: Percent, color: 'text-rose-600 bg-rose-50', sub: null },
            { label: 'Pesanan Hari Ini', value: data.stats.todayOrders, icon: TrendingUp, color: 'text-amber-600 bg-amber-50', sub: `${data.stats.todayOrders > 0 ? formatPrice(data.stats.totalRevenue / Math.max(1, data.stats.totalOrders) * data.stats.todayOrders) : 'Rp0'} estimasi` },
          ].map((card, idx) => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="bg-card rounded-[13px] border border-subtle p-[16px] md:p-[20px]"
              >
                <div className={`w-[36px] h-[36px] md:w-[40px] md:h-[40px] rounded-[10px] flex items-center justify-center ${card.color}`}>
                  <Icon size={18} className="md:size-[20px]" />
                </div>
                <p className="text-[18px] md:text-[22px] font-bold text-primary mt-[10px] md:mt-[14px] leading-tight">{card.value}</p>
                <p className="text-[12px] md:text-[13px] text-muted mt-[2px]">{card.label}</p>
                {card.sub && <p className="text-[10px] md:text-[11px] text-muted/70 mt-[1px]">{card.sub}</p>}
              </motion.div>
            )
          })}
        </div>

        {(data.stats.pendingOrders > 0 || data.stats.pendingPayments > 0) && (
          <div className="flex flex-wrap gap-[8px] md:gap-[10px]">
            {data.stats.pendingOrders > 0 && (
              <Link to="/admin/orders?status=pending"
                className="flex items-center gap-[6px] md:gap-[8px] px-[14px] md:px-[16px] py-[9px] md:py-[10px] rounded-[8px] bg-yellow-50 border border-yellow-200 text-[13px] md:text-[14px] text-yellow-700 font-medium hover:bg-yellow-100 transition-colors"
              >
                <AlertCircle size={14} className="md:size-[16px]" />
                {data.stats.pendingOrders} pesanan menunggu
                <ArrowRight size={13} className="md:size-[14px]" />
              </Link>
            )}
            {data.stats.pendingPayments > 0 && (
              <Link to="/admin/orders?tab=pembayaran&status=pending"
                className="flex items-center gap-[6px] md:gap-[8px] px-[14px] md:px-[16px] py-[9px] md:py-[10px] rounded-[8px] bg-blue-50 border border-blue-200 text-[13px] md:text-[14px] text-blue-700 font-medium hover:bg-blue-100 transition-colors"
              >
                <CreditCard size={14} className="md:size-[16px]" />
                {data.stats.pendingPayments} pembayaran menunggu
                <ArrowRight size={13} className="md:size-[14px]" />
              </Link>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-[16px]">
          <div className="lg:col-span-2 bg-card rounded-[13px] border border-subtle overflow-hidden">
            <div className="px-[16px] md:px-[24px] py-[14px] md:py-[16px] border-b border-subtle">
              <h2 className="text-[15px] md:text-[16px] font-semibold text-primary flex items-center gap-[8px] md:gap-[10px]">
                <BarChart3 size={16} className="md:size-[18px] text-brand-600" />
                Pendapatan 6 Bulan
              </h2>
            </div>
            <div className="p-[16px] md:p-[24px]">
              {data.revenueByMonth.length > 0 ? (
                <div className="flex items-end gap-[4px] md:gap-[8px] h-[100px] md:h-[130px]">
                  {data.revenueByMonth.toReversed().map((m) => {
                    const pct = (Number(m.revenue) / revenueMax) * 100
                    return (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-[4px] md:gap-[6px]">
                        <span className="text-[8px] md:text-[10px] font-medium text-muted truncate max-w-full">{formatPrice(m.revenue)}</span>
                        <div className="w-full bg-brand-100 dark:bg-brand-900/30 rounded-[4px] overflow-hidden" style={{ height: '60px' }}>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(pct, 4)}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="w-full bg-brand-500 rounded-[4px] self-end"
                            style={{ marginTop: `${60 - Math.max(pct, 4)}px` }}
                          />
                        </div>
                        <span className="text-[9px] md:text-[10px] text-muted/70">{m.month.slice(5)}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-[14px] text-muted text-center py-[24px]">Belum ada data pendapatan</p>
              )}
            </div>
          </div>

          <div className="bg-card rounded-[13px] border border-subtle overflow-hidden">
            <div className="px-[16px] md:px-[24px] py-[14px] md:py-[16px] border-b border-subtle">
              <h2 className="text-[15px] md:text-[16px] font-semibold text-primary flex items-center gap-[8px] md:gap-[10px]">
                <ShoppingBag size={16} className="md:size-[18px] text-brand-600" />
                Status Pesanan
              </h2>
            </div>
            <div className="p-[16px] md:p-[24px] space-y-[8px] md:space-y-[10px]">
              {data.ordersByStatus.length > 0 ? (
                data.ordersByStatus.map((s) => {
                  const pct = (s.count / totalByStatus) * 100
                  return (
                    <div key={s.status}>
                      <div className="flex items-center justify-between text-[13px] mb-[4px]">
                        <span className="text-secondary">{statusLabel[s.status] || s.status}</span>
                        <span className="font-medium text-primary">{s.count}</span>
                      </div>
                      <div className="w-full h-[6px] bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className={`h-full rounded-full ${
                            s.status === 'pending' ? 'bg-yellow-400' :
                            s.status === 'paid' ? 'bg-blue-400' :
                            s.status === 'processing' ? 'bg-brand-500' :
                            s.status === 'done' ? 'bg-green-500' :
                            s.status === 'cancelled' ? 'bg-red-400' : 'bg-stone-400'
                          }`}
                        />
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-[14px] text-muted text-center py-[12px]">Belum ada pesanan</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-[16px]">
          <div className="lg:col-span-2 bg-card rounded-[13px] border border-subtle overflow-hidden">
            <div className="px-[16px] md:px-[24px] py-[14px] md:py-[16px] border-b border-subtle flex items-center justify-between">
              <h2 className="text-[15px] md:text-[16px] font-semibold text-primary flex items-center gap-[8px] md:gap-[10px]">
                <Clock size={16} className="md:size-[18px] text-brand-600" />
                Pesanan Terbaru
              </h2>
              <Link to="/admin/orders" className="text-[13px] md:text-[14px] text-brand-600 hover:text-brand-700 font-medium flex items-center gap-[4px]">
                Lihat Semua <ArrowRight size={13} className="md:size-[14px]" />
              </Link>
            </div>
            <div className="divide-y divide-subtle">
              {data.recentOrders.map((order) => (
                <Link key={order.id} to="/admin/orders"
                  className="flex items-center justify-between px-[16px] md:px-[24px] py-[12px] md:py-[14px] hover:bg-surface-secondary transition-colors group"
                >
                  <div className="flex items-center gap-[10px] md:gap-[14px] min-w-0">
                    <div className={`w-[32px] h-[32px] md:w-[36px] md:h-[36px] rounded-[8px] flex items-center justify-center shrink-0 ${
                      order.status === 'done' ? 'bg-green-50 text-green-600' :
                      order.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                      order.status === 'processing' ? 'bg-brand-50 text-brand-600' :
                      'bg-yellow-50 text-yellow-600'
                    }`}>
                      <ShoppingBag size={14} className="md:size-[16px]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] md:text-[15px] font-medium text-primary group-hover:text-brand-600 transition-colors truncate">#{order.order_number}</p>
                      <p className="text-[11px] md:text-[12px] text-muted">{order.customer_name} &bull; {order.item_count} item &bull; {timeAgo(order.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-[6px] md:gap-[12px] shrink-0">
                    <span className="text-[13px] md:text-[14px] font-semibold text-primary">{formatPrice(order.total)}</span>
                    <span className={`text-[11px] md:text-[12px] font-medium px-[8px] md:px-[10px] py-[3px] md:py-[4px] rounded-full ${statusColor[order.status] || ''}`}>
                      {statusLabel[order.status] || order.status}
                    </span>
                  </div>
                </Link>
              ))}
              {data.recentOrders.length === 0 && (
                <p className="text-[14px] md:text-[15px] text-muted text-center py-[24px] md:py-[32px]">Belum ada pesanan</p>
              )}
            </div>
          </div>

          <div className="bg-card rounded-[13px] border border-subtle overflow-hidden">
            <div className="px-[16px] md:px-[24px] py-[14px] md:py-[16px] border-b border-subtle">
              <h2 className="text-[15px] md:text-[16px] font-semibold text-primary flex items-center gap-[8px] md:gap-[10px]">
                <PackageOpen size={16} className="md:size-[18px] text-amber-600" />
                Stok Menipis
              </h2>
            </div>
            <div className="divide-y divide-subtle">
              {data.lowStock.length > 0 ? (
                data.lowStock.map((p) => (
                  <Link key={p.id} to={`/admin/products`}
                    className="flex items-center justify-between px-[16px] md:px-[20px] py-[10px] md:py-[12px] hover:bg-surface-secondary transition-colors"
                  >
                    <div className="flex items-center gap-[8px] md:gap-[10px] min-w-0">
                      <div className="w-[28px] h-[28px] md:w-[32px] md:h-[32px] rounded-[6px] bg-surface overflow-hidden shrink-0">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" onError={(e) => { e.target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' }} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted"><Package size={12} className="md:size-[14px]" /></div>
                        )}
                      </div>
                      <span className="text-[12px] md:text-[13px] font-medium text-primary truncate">{p.name}</span>
                    </div>
                    <span className={`text-[11px] md:text-[12px] font-semibold shrink-0 ml-[8px] ${
                      p.stock <= 2 ? 'text-red-600' : 'text-amber-600'
                    }`}>Stok {p.stock}</span>
                  </Link>
                ))
              ) : (
                <p className="text-[13px] md:text-[14px] text-muted text-center py-[16px] md:py-[20px]">Semua stok aman</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
