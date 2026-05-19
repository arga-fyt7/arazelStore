import { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  Bell, ShoppingCart, Package, DollarSign, Info, Megaphone,
  AlertTriangle, CheckCheck, Store, ShoppingBag,
} from 'lucide-react'

const notifIcons = {
  order_baru: { icon: ShoppingCart, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
  order_update: { icon: Package, color: 'text-brand-600 bg-brand-100 dark:bg-brand-900/30 dark:text-brand-400' },
  pembayaran: { icon: DollarSign, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
  info: { icon: Info, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
  promo: { icon: Megaphone, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
  alert: { icon: AlertTriangle, color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' },
  announcement: { icon: Store, color: 'text-brand-600 bg-brand-100 dark:bg-brand-900/30 dark:text-brand-400' },
  order: { icon: ShoppingBag, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
}

export default function NotificationDropdown({ open, onClose, notifications = [], unreadCount = 0, onMarkRead, onNavigate }) {
  const navigate = useNavigate()
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  function handleClick(n) {
    if (onNavigate) {
      onNavigate(n)
    } else if (n.link) {
      navigate(n.link)
    }
    onClose()
  }

  return (
    <div ref={ref}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            className="fixed left-1/2 -translate-x-1/2 top-[76px] w-[calc(100vw-32px)] md:absolute md:left-auto md:right-0 md:top-full md:mt-[8px] md:w-[380px] md:translate-x-0 bg-card rounded-[13px] border border-subtle shadow-xl max-h-[520px] overflow-hidden z-50"
          >
            <div className="px-[20px] py-[14px] border-b border-subtle flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-primary">Notifikasi</h3>
              <div className="flex items-center gap-[8px]">
                {onMarkRead && unreadCount > 0 && (
                  <button onClick={onMarkRead}
                    className="flex items-center gap-[4px] text-[12px] text-brand-600 hover:text-brand-700 font-medium"
                  ><CheckCheck size={14} /> Tandai dibaca</button>
                )}
                <button onClick={onClose} className="text-[12px] text-muted hover:text-primary font-medium">Tutup</button>
              </div>
            </div>
            <div className="overflow-y-auto max-h-[440px]">
              {notifications.length === 0 ? (
                <div className="px-[20px] py-[40px] text-center">
                  <Bell size={28} className="mx-auto text-muted mb-[10px]" />
                  <p className="text-[14px] text-muted">Tidak ada notifikasi</p>
                </div>
              ) : (
                <div className="divide-y divide-subtle">
                  {notifications.map((n) => {
                    const ni = notifIcons[n.type] || notifIcons.info
                    const NI = ni.icon
                    return (
                      <button
                        key={n.id}
                        onClick={() => handleClick(n)}
                        className={`w-full flex items-start gap-[12px] px-[20px] py-[13px] hover:bg-surface-secondary transition-colors text-left ${!n.read ? 'bg-brand-50/40 dark:bg-brand-900/10' : ''}`}
                      >
                        <div className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shrink-0 ${ni.color}`}>
                          <NI size={17} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-[6px]">
                            <p className="text-[14px] font-medium text-primary">{n.title}</p>
                            {!n.read && <span className="w-[8px] h-[8px] rounded-full bg-brand-500 shrink-0" />}
                          </div>
                          <p className="text-[13px] text-secondary mt-[3px] line-clamp-2">{n.description}</p>
                          <p className="text-[11px] text-muted mt-[3px]">{new Date(n.time).toLocaleString('id-ID')}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
