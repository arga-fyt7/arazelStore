import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingBag, Package, Ticket, Users,
  Store, LogOut, Bell, Settings,
} from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import { cn } from '../lib/utils'
import { playNotificationSound, playOrderSound } from '../lib/sound'
import NotificationDropdown from './NotificationDropdown'
import { api } from '../lib/api'

const navItems = [
  { to: '/admin/orders', label: 'Manajemen Pesanan', icon: ShoppingBag },
  { to: '/admin/products', label: 'Produk', icon: Package },
  { to: '/admin/promos', label: 'Promo', icon: Ticket },
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/pengaturan', label: 'Pengaturan', icon: Settings },
]

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [markingRead, setMarkingRead] = useState(false)
  const prevIdsRef = useRef(null)
  const notifRef = useRef(null)

  useEffect(() => {
    const map = {
      '/admin': 'Dashboard',
      '/admin/orders': 'Pesanan',
      '/admin/products': 'Produk',
      '/admin/promos': 'Promo',
      '/admin/pengaturan': 'Pengaturan',
    }
    document.title = `${map[location.pathname] || 'Admin'} - Arazel Store (Admin)`
  }, [location.pathname])

  useEffect(() => {
    let mounted = true
    function fetchNotifs() {
      api('/admin/notifications/recent').then(d => {
        if (!mounted) return
        const items = d.notifications || []
        setNotifications(items)
        setUnreadCount(d.unread_count ?? items.length)
        const newIds = new Set(items.map(n => n.id))
        const oldIds = prevIdsRef.current
        if (oldIds) {
          const hasNew = [...newIds].some(id => !oldIds.has(id))
          if (hasNew) {
            const hasNewOrder = items.some(n => n.type === 'order_baru' && !oldIds.has(n.id))
            if (hasNewOrder) playOrderSound()
            else playNotificationSound()
          }
        }
        prevIdsRef.current = newIds
      })
    }
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30000)
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  async function markAllRead() {
    setMarkingRead(true)
    try {
      await api('/admin/notifications/read', { method: 'PUT' })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {}
    setMarkingRead(false)
  }

  if (!user || user.role !== 'admin') {
    navigate('/')
    return null
  }

  return (
    <div className="min-h-screen bg-surface-secondary">
      <header className="sticky top-0 z-40 bg-card border-b border-subtle">
        <div className="max-w-7xl mx-auto px-[24px]">
          <div className="flex items-center justify-between h-[72px]">
            <div className="flex items-center gap-[24px]">
              <div className="flex items-center gap-[10px]">
                <div className="w-[34px] h-[34px] rounded-[8px] bg-brand-600 flex items-center justify-center text-white">
                  <Store size={18} />
                </div>
                <span className="text-[18px] font-semibold text-primary">Arazel<span className="text-brand-600">Admin</span></span>
              </div>
              <nav className="hidden md:flex items-center gap-[4px] ml-[16px]">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const active = item.end
                    ? location.pathname === item.to
                    : location.pathname.startsWith(item.to)
                  return (
                    <button
                      key={item.to}
                      onClick={() => navigate(item.to)}
                      className={cn(
                        'flex items-center gap-[8px] px-[14px] py-[10px] rounded-[8px] text-[14px] font-medium transition-colors',
                        active
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-secondary hover:text-primary hover:bg-surface-secondary'
                      )}
                    >
                      <Icon size={16} />
                      {item.label}
                    </button>
                  )
                })}
              </nav>
            </div>
            <div className="flex items-center gap-[6px]">
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative p-[10px] rounded-[8px] text-secondary hover:text-primary hover:bg-surface-secondary transition-colors"
                  title="Notifikasi"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-[2px] right-[2px] w-[18px] h-[18px] rounded-full bg-accent-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                <NotificationDropdown
                  open={notifOpen}
                  onClose={() => setNotifOpen(false)}
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onMarkRead={markingRead ? undefined : markAllRead}
                  onNavigate={(n) => { navigate(n.link) }}
                />
              </div>
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-[8px] px-[14px] py-[10px] rounded-[8px] text-[14px] text-secondary hover:text-primary hover:bg-surface-secondary transition-colors"
                title="Ke Toko"
              >
                <Store size={16} />
                <span className="hidden md:inline">Toko</span>
              </button>
              <button
                onClick={() => { logout(); navigate('/') }}
                className="flex items-center gap-[8px] px-[14px] py-[10px] rounded-[8px] text-[14px] text-red-500 hover:bg-red-50 transition-colors"
                title="Keluar"
              >
                <LogOut size={16} />
                <span className="hidden md:inline">Keluar</span>
              </button>
            </div>
          </div>
          <nav className="md:hidden flex items-center justify-center gap-[2px] pb-[10px]">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = item.end
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to)
              return (
                <button
                  key={item.to}
                  onClick={() => navigate(item.to)}
                  className={cn(
                    'shrink-0 flex items-center justify-center w-[42px] h-[36px] rounded-[7px] transition-colors',
                    active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-secondary hover:text-primary hover:bg-surface-secondary'
                  )}
                  title={item.label}
                >
                  <Icon size={17} />
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-[24px] py-[24px] md:py-[34px]">
        {children}
      </div>
    </div>
  )
}
