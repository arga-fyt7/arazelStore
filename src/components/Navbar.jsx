import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ShoppingCart, Menu, X, Store, User, LogIn, Package, Shield, Bell } from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import { useCart } from '../lib/useCart'
import { useConfirm } from '../lib/useConfirm'
import { cn } from '../lib/utils'
import { playNotificationSound, playOrderSound } from '../lib/sound'
import { motion, AnimatePresence } from 'motion/react'
import NotificationDropdown from './NotificationDropdown'
import { api } from '../lib/api'

const navLinks = [
  { to: '/', label: 'Beranda' },
  { to: '/menu', label: 'Menu' },
  { to: '/promo', label: 'Promo' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [activeOrders, setActiveOrders] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [readIds, setReadIds] = useState(() => new Set(JSON.parse(localStorage.getItem('notifRead') || '[]')))
  const readIdsRef = useRef(readIds)
  readIdsRef.current = readIds
  const { user } = useAuth()
  const { totalItems } = useCart()
  const { confirm } = useConfirm()
  const location = useLocation()
  const notifRef = useRef(null)
  const prevNotifIdsRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (!user) { setActiveOrders(0); return }
    api('/orders').then(d => {
      const active = d.orders?.filter(o => o.status === 'pending' || o.status === 'processing' || o.status === 'paid').length || 0
      setActiveOrders(active)
    }).catch(() => {})
  }, [user])

  useEffect(() => {
    let mounted = true
    async function fetchNotifs() {
      const items = []
      try {
        const d = await api('/announcements')
        if (d.announcements) {
          d.announcements.forEach(a => {
            items.push({
              id: `announce-${a.id}`,
              type: 'announcement',
              title: a.title,
              description: a.message,
              link: a.link || null,
              time: a.created_at,
            })
          })
        }
      } catch {}
      if (user) {
        try {
          const d = await api('/orders')
          const recent = (d.orders || []).filter(o =>
            o.status === 'pending' || o.status === 'processing' || o.status === 'paid'
          ).slice(0, 5)
          recent.forEach(o => {
            items.push({
              id: `order-${o.id}`,
              type: 'order',
              title: o.status === 'pending' ? 'Pesanan Baru' : o.status === 'paid' ? 'Pembayaran Diterima' : 'Pesanan Diproses',
              description: `#${o.order_number} — ${o.status}`,
              link: `/order/${o.id}`,
              time: o.updated_at || o.created_at,
            })
          })
        } catch {}
      }
      items.sort((a, b) => new Date(b.time) - new Date(a.time))
      const final = items.slice(0, 15).map(n => ({ ...n, read: readIdsRef.current.has(n.id) }))
      if (mounted) {
        setNotifications(final)
        const newIds = new Set(final.map(n => n.id))
        const oldIds = prevNotifIdsRef.current
        if (oldIds) {
          const hasNew = [...newIds].some(id => !oldIds.has(id))
          if (hasNew) {
            const hasNewOrder = final.some(n => n.type === 'order' && !oldIds.has(n.id))
            if (hasNewOrder) playOrderSound()
            else playNotificationSound()
          }
        }
        prevNotifIdsRef.current = newIds
      }
    }
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30000)
    return () => { mounted = false; clearInterval(interval) }
  }, [user])

  const unreadCount = notifications.filter(n => !n.read).length

  function markAllRead() {
    const ids = new Set(notifications.map(n => n.id))
    setReadIds(ids)
    localStorage.setItem('notifRead', JSON.stringify([...ids]))
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-subtle">
      <div className="max-w-6xl mx-auto px-[21px]">
        <div className="flex items-center justify-between h-[68px]">
          <Link to="/" className="flex items-center gap-[8px]">
            <div className="w-[34px] h-[34px] rounded-[8px] bg-brand-600 flex items-center justify-center text-white">
              <Store size={18} />
            </div>
            <span className="text-[22px] font-semibold text-primary">
              Arazel<span className="text-brand-600">Store</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-[34px]">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'text-[14px] font-medium transition-colors relative py-[4px]',
                  location.pathname === link.to
                    ? 'text-brand-600'
                    : 'text-secondary hover:text-primary',
                )}
              >
                {location.pathname === link.to && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute -bottom-[4px] left-0 right-0 h-[2px] bg-brand-500 rounded-full"
                  />
                )}
                {link.label}
              </Link>
            ))}
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className={cn(
                  'text-[14px] font-medium transition-colors relative py-[4px]',
                  location.pathname.startsWith('/admin')
                    ? 'text-brand-600'
                    : 'text-secondary hover:text-primary',
                )}
              >
                {location.pathname.startsWith('/admin') && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute -bottom-[4px] left-0 right-0 h-[2px] bg-brand-500 rounded-full"
                  />
                )}
                Dashboard
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-[4px]">
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-[10px] rounded-[10px] text-secondary hover:text-primary hover:bg-surface-secondary transition-colors"
                title="Notifikasi"
              >
                <Bell size={19} />
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.span
                      key={unreadCount}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-[2px] -right-[2px] w-[18px] h-[18px] rounded-full bg-accent-500 text-white text-[9px] font-bold flex items-center justify-center"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
              <NotificationDropdown
                open={notifOpen}
                onClose={() => setNotifOpen(false)}
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkRead={markAllRead}
              />
            </div>

            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="relative p-[10px] rounded-[10px] text-secondary hover:text-primary hover:bg-surface-secondary transition-colors"
                    title="Dashboard Admin"
                  >
                    <Shield size={19} />
                  </Link>
                )}
                <Link
                  to="/orders"
                  className="relative p-[10px] rounded-[10px] text-secondary hover:text-primary hover:bg-surface-secondary transition-colors"
                  title="Pesanan Saya"
                >
                  <Package size={19} />
                  <AnimatePresence>
                    {activeOrders > 0 && (
                      <motion.span
                        key={activeOrders}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-[2px] -right-[2px] w-[18px] h-[18px] rounded-full bg-accent-500 text-white text-[9px] font-bold flex items-center justify-center"
                      >
                        {activeOrders > 9 ? '9+' : activeOrders}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="hidden md:flex items-center gap-[6px] px-[13px] py-[7px] rounded-[10px] text-secondary hover:text-primary hover:bg-surface-secondary transition-colors text-[14px] font-medium"
                  >
                    <User size={17} className="text-brand-600" />
                    {user.name.split(' ')[0]}
                  </button>
                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        className="absolute right-0 top-full mt-[8px] w-[180px] bg-card rounded-[13px] border border-subtle shadow-xl overflow-hidden"
                      >
                        <Link
                          to="/profile"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-[10px] px-[16px] py-[11px] text-[13px] text-secondary hover:text-primary hover:bg-surface-secondary transition-colors"
                        >
                          <User size={15} />
                          Manajemen Akun
                        </Link>
                        <button
                          onClick={async () => {
                            const ok = await confirm({ title: 'Keluar?', message: 'Kamu akan keluar dari akun ini.', confirmText: 'Keluar', variant: 'danger' })
                            if (!ok) return
                            setProfileOpen(false)
                            localStorage.removeItem('token')
                            window.location.reload()
                          }}
                          className="w-full flex items-center gap-[10px] px-[16px] py-[11px] text-[13px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <LogIn size={15} className="rotate-180" />
                          Keluar
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="hidden md:flex items-center gap-[6px] px-[13px] py-[7px] rounded-[10px] text-secondary hover:text-primary hover:bg-surface-secondary transition-colors text-[14px] font-medium"
              >
                <LogIn size={17} />
                Masuk
              </Link>
            )}

            <Link
              to="/cart"
              className="relative p-[10px] rounded-[10px] text-secondary hover:text-primary hover:bg-surface-secondary transition-colors"
            >
              <ShoppingCart size={20} />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span
                    key={totalItems}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-[2px] -right-[2px] w-[21px] h-[21px] rounded-full bg-brand-600 text-white text-[11px] font-bold flex items-center justify-center"
                  >
                    {totalItems > 9 ? '9+' : totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            <button
              onClick={() => setOpen(!open)}
              className="md:hidden p-[10px] rounded-[10px] text-secondary hover:text-primary hover:bg-surface-secondary transition-colors"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-subtle bg-card overflow-hidden"
          >
            <div className="px-[21px] py-[13px] flex flex-col gap-[4px]">
              {user && (
                <div className="px-[13px] py-[10px] flex items-center gap-[10px] border-b border-subtle mb-[4px]">
                  <div className="w-[30px] h-[30px] rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                    <User size={15} className="text-brand-600" />
                  </div>
                  <span className="text-[14px] font-medium text-primary">{user.name}</span>
                </div>
              )}
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'px-[13px] py-[10px] rounded-[10px] text-[14px] font-medium transition-colors',
                    location.pathname === link.to
                      ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600'
                      : 'text-secondary hover:bg-surface-secondary hover:text-primary',
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {user && (
                <>
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-[10px] px-[13px] py-[10px] rounded-[10px] text-[14px] font-medium text-secondary hover:bg-surface-secondary hover:text-primary transition-colors"
                    >
                      <Shield size={16} />
                      Dashboard Admin
                    </Link>
                  )}
                  <Link
                    to="/orders"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-[10px] px-[13px] py-[10px] rounded-[10px] text-[14px] font-medium text-secondary hover:bg-surface-secondary hover:text-primary transition-colors"
                  >
                    <Package size={16} />
                    Pesanan Saya
                  </Link>
                </>
              )}
              <div className="border-t border-subtle mt-[4px] pt-[4px]">
                {user ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-[10px] px-[13px] py-[10px] rounded-[10px] text-[14px] text-secondary hover:bg-surface-secondary hover:text-primary transition-colors"
                    >
                      <User size={16} />
                      Manajemen Akun
                    </Link>
                    <button
                      onClick={async () => {
                        const ok = await confirm({ title: 'Keluar?', message: 'Kamu akan keluar dari akun ini.', confirmText: 'Keluar', variant: 'danger' })
                        if (!ok) return
                        setOpen(false)
                        localStorage.removeItem('token')
                        window.location.reload()
                      }}
                      className="w-full flex items-center gap-[10px] px-[13px] py-[10px] rounded-[10px] text-[14px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogIn size={16} className="rotate-180" />
                      Keluar
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-[10px] px-[13px] py-[10px] rounded-[10px] text-[14px] text-secondary hover:bg-surface-secondary hover:text-primary transition-colors"
                  >
                    <LogIn size={16} />
                    Masuk
                  </Link>
                )}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
