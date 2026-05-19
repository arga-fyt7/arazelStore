import { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Store, Clock, Calendar, AlertTriangle, Shield, X, LogIn } from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import { api } from '../lib/api'

const dayLabels = { senin: 'Senin', selasa: 'Selasa', rabu: 'Rabu', kamis: 'Kamis', jumat: 'Jumat', sabtu: 'Sabtu', minggu: 'Minggu' }
const daysOfWeek = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']

function nowInJakarta() {
  const now = new Date()
  return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
}

function getTimeStr(date) {
  return String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0')
}

function parseTime(str) {
  if (!str) return null
  const [h, m] = str.split(':').map(Number)
  return h * 60 + m
}

function isTimeBetween(now, openStr, closeStr) {
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const openMin = parseTime(openStr)
  const closeMin = parseTime(closeStr)
  if (openMin === null || closeMin === null) return null
  if (closeMin <= openMin) return nowMin >= openMin || nowMin < closeMin
  return nowMin >= openMin && nowMin < closeMin
}

function formatTime(ms) {
  const totalM = Math.floor(ms / 60000)
  const m = totalM % 60
  const h = Math.floor(totalM / 60) % 24
  const d = Math.floor(totalM / 1440)
  if (d > 0) return `${d}h ${h}j ${m}m`
  if (h > 0) return `${h}j ${m}m`
  return `${m} menit`
}

function getNextOpenTime(hours, todayKey) {
  const keys = Object.keys(dayLabels)
  for (let i = 0; i < 7; i++) {
    const key = keys[(keys.indexOf(todayKey) + i) % 7]
    const day = hours[key]
    if (day?.active !== false && day?.open) return { day: key, time: day.open, offset: i }
  }
  return null
}

export default function MaintenanceOverlay({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  const [status, setStatus] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [timeLeft, setTimeLeft] = useState(null)
  const [dismissBanner, setDismissBanner] = useState(false)
  const [currentTime, setCurrentTime] = useState(nowInJakarta())

  useEffect(() => {
    api('/store-status')
      .then(d => {
        setStatus(d)
        if (d.maintenance_until) {
          const until = new Date(d.maintenance_until).getTime()
          if (until > Date.now()) {
            const update = () => setTimeLeft(Math.max(0, until - Date.now()))
            update()
            const t = setInterval(update, 1000)
            return () => clearInterval(t)
          }
        }
      })
      .catch(() => setStatus({ store_status: 'open' }))
      .finally(() => setLoaded(true))
  }, [])

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(nowInJakarta()), 10000)
    return () => clearInterval(t)
  }, [])

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-[34px] h-[34px] border-[3px] border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (location.pathname === '/login') return children

  const now = currentTime
  const todayKey = daysOfWeek[now.getDay()]
  const hours = status?.operational_hours || {}
  const today = hours[todayKey]
  const todayActive = today?.active !== false && !!today?.open
  const withinHours = todayActive ? isTimeBetween(now, today.open, today.close) : false
  const isTutupManual = status?.store_status === 'tutup'
  const isTutupSementara = status?.store_status === 'tutup_sementara'
  const until = status?.maintenance_until ? new Date(status.maintenance_until) : null
  const isMaintenanceActive = until && until.getTime() > Date.now()
  const isOutsideHours = status?.store_status === 'open' && todayActive && !withinHours

  const isClosed = isTutupManual || isTutupSementara || isOutsideHours
  const showOverlay = isTutupManual || (isTutupSementara && isMaintenanceActive) || isOutsideHours

  const isAdmin = user?.role === 'admin'

  if (isAdmin) {
    return (
      <>
        {showOverlay && !dismissBanner && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border-b border-yellow-200"
          >
            <div className="max-w-6xl mx-auto px-[21px] py-[8px] flex items-center justify-between">
              <div className="flex items-center gap-[8px] text-[13px] text-yellow-700 flex-wrap">
                <AlertTriangle size={15} />
                <span className="font-medium">
                  {isOutsideHours ? 'Di Luar Jam Operasional' : isTutupSementara ? 'Mode Maintenance Aktif' : 'Toko Sedang Tutup'}
                </span>
                {isTutupSementara && timeLeft !== null && timeLeft > 0 && (
                  <span className="text-yellow-600">&mdash; Buka kembali dalam {formatTime(timeLeft)}</span>
                )}
                {isOutsideHours && today?.open && (
                  <span className="text-yellow-600">&mdash; Buka pukul {today.open}</span>
                )}
                <Shield size={14} className="ml-[4px]" />
                <span className="text-yellow-600">Akses Admin</span>
              </div>
              <button onClick={() => setDismissBanner(true)} className="p-[4px] rounded-[4px] text-yellow-500 hover:text-yellow-700 hover:bg-yellow-100 transition-colors">
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
        {children}
      </>
    )
  }

  if (showOverlay) {
    const nextOpen = isOutsideHours ? getNextOpenTime(hours, todayKey) : null

    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-[24px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[520px]"
        >
          <div className="text-center mb-[24px]">
            <div className="w-[72px] h-[72px] rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-[24px]">
              <Store size={34} className="text-brand-600" />
            </div>
            <h1 className="text-[28px] font-bold text-primary mb-[4px]">{status?.store_name || 'Arazel Store'}</h1>

            {isTutupSementara && (
              <div className="inline-flex items-center gap-[8px] px-[16px] py-[8px] rounded-full bg-yellow-50 border border-yellow-200 text-yellow-700 text-[14px] font-medium mb-[16px]">
                <div className="w-[8px] h-[8px] rounded-full bg-yellow-500 animate-pulse" />
                Tutup Sementara
              </div>
            )}
            {isTutupManual && (
              <div className="inline-flex items-center gap-[8px] px-[16px] py-[8px] rounded-full bg-red-50 border border-red-200 text-red-700 text-[14px] font-medium mb-[16px]">
                <AlertTriangle size={16} />
                Toko Sedang Tutup
              </div>
            )}
            {isOutsideHours && (
              <div className="inline-flex items-center gap-[8px] px-[16px] py-[8px] rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[14px] font-medium mb-[16px]">
                <Clock size={16} />
                Di Luar Jam Operasional
              </div>
            )}

            <p className="text-[16px] text-secondary mb-[24px] max-w-[400px] mx-auto">
              {isTutupSementara && 'Saat ini kami sedang melakukan perbaikan dan pemeliharaan sistem. Silakan kembali lagi nanti.'}
              {isTutupManual && 'Saat ini toko sedang tutup. Silakan lihat jam operasional kami untuk informasi lebih lanjut.'}
              {isOutsideHours && today?.open && `Saat ini di luar jam operasional. Kami buka setiap ${dayLabels[todayKey]} pukul ${today.open} - ${today.close}.`}
              {isOutsideHours && !today?.open && 'Saat ini di luar jam operasional.'}
            </p>
          </div>

          {isTutupSementara && timeLeft !== null && timeLeft > 0 && (
            <div className="bg-card rounded-[13px] border border-subtle p-[24px] mb-[16px]">
              <div className="flex items-center gap-[8px] justify-center text-muted text-[13px] mb-[12px]">
                <Clock size={16} />
                <span>Perkiraan buka kembali</span>
              </div>
              <div className="text-[36px] font-bold text-primary tabular-nums tracking-tight font-mono text-center">
                {formatTime(timeLeft)}
              </div>
              <p className="text-[13px] text-muted mt-[8px] text-center">
                {until?.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}

          {isOutsideHours && nextOpen && (
            <div className="bg-card rounded-[13px] border border-subtle p-[24px] mb-[16px]">
              <div className="flex items-center gap-[8px] justify-center text-muted text-[13px] mb-[12px]">
                <Calendar size={16} />
                <span>{nextOpen.offset === 0 ? 'Akan buka hari ini' : 'Akan buka'}</span>
              </div>
              <p className="text-[18px] font-semibold text-primary text-center capitalize">
                {dayLabels[nextOpen.day]} {nextOpen.time}
              </p>
            </div>
          )}

          <div className="bg-card rounded-[13px] border border-subtle p-[24px]">
            <div className="flex items-center gap-[8px] justify-center text-muted text-[13px] mb-[12px]">
              <Calendar size={16} />
              <span>Jam Operasional</span>
            </div>
            <div className="space-y-[6px]">
              {Object.entries(dayLabels).map(([key, label]) => {
                const day = hours[key]
                const isToday = key === todayKey
                const isNow = isToday && (isOutsideHours || (withinHours !== false))
                return (
                  <div key={key} className={`flex items-center justify-between px-[12px] py-[6px] rounded-[6px] text-[14px] ${
                    isNow ? 'bg-brand-50 text-brand-700 font-medium' : ''
                  } ${isToday && isOutsideHours ? 'bg-yellow-50 text-yellow-700 font-medium' : ''}`}>
                    <span className={isNow || (isToday && isOutsideHours) ? 'font-medium' : 'text-secondary'}>{label}</span>
                    <span className={day?.active !== false && day?.open ? 'text-primary' : 'text-muted'}>
                      {day?.active !== false && day?.open ? `${day.open} - ${day.close}` : 'Libur'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {status?.store_description && (
            <p className="text-[13px] text-muted mt-[16px] text-center">{status.store_description}</p>
          )}

          <div className="mt-[24px] text-center">
            <Link to="/login"
              className="inline-flex items-center gap-[6px] px-[20px] py-[10px] rounded-[8px] border border-subtle text-[13px] text-secondary hover:text-primary hover:bg-card transition-colors"
            >
              <LogIn size={15} />
              Login Administrator
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return children
}
