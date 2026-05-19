import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { LogIn, Mail, Lock, Eye, EyeOff, Store } from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import { useToast } from '../lib/useToast'
import { api } from '../lib/api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [storeStatus, setStoreStatus] = useState(null)
  const [statusLoaded, setStatusLoaded] = useState(false)
  const { login } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    api('/store-status')
      .then(d => setStoreStatus(d))
      .catch(() => {})
      .finally(() => setStatusLoaded(true))
  }, [])

  const isTutup = storeStatus?.store_status === 'tutup'
  const isTutupSementara = storeStatus?.store_status === 'tutup_sementara' &&
    storeStatus?.maintenance_until && new Date(storeStatus.maintenance_until).getTime() > Date.now()
  const isOutsideHours = storeStatus?.store_status === 'open' && (() => {
    const hours = storeStatus?.operational_hours || {}
    const days = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']
    const now = new Date()
    const jakarta = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
    const todayKey = days[jakarta.getDay()]
    const today = hours[todayKey]
    if (today?.active === false || !today?.open) return true
    const nowMin = jakarta.getHours() * 60 + jakarta.getMinutes()
    const [oh, om] = today.open.split(':').map(Number)
    const [ch, cm] = today.close.split(':').map(Number)
    const openMin = oh * 60 + om
    const closeMin = ch * 60 + cm
    if (closeMin <= openMin) return !(nowMin >= openMin || nowMin < closeMin)
    return !(nowMin >= openMin && nowMin < closeMin)
  })()

  const maintenanceActive = isTutup || isTutupSementara || isOutsideHours

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await login(email, password)
      addToast('Login berhasil')
      navigate('/')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-[21px] py-[55px]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px]"
      >
        {statusLoaded && maintenanceActive && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-[24px] p-[16px] rounded-[10px] bg-yellow-50 border border-yellow-200"
          >
            <div className="flex items-start gap-[10px]">
              <Store size={18} className="text-yellow-600 mt-[2px] shrink-0" />
              <div>
                <p className="text-[14px] font-semibold text-yellow-800">{storeStatus?.store_name || 'Arazel Store'}</p>
                <p className="text-[13px] text-yellow-700 mt-[4px]">
                  Toko sedang tutup. Saat ini hanya{' '}
                  <span className="font-medium">Administrator</span> yang dapat login.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="text-center mb-[34px]">
          <div className="w-[55px] h-[55px] rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mx-auto mb-[16px]">
            <LogIn size={24} className="text-brand-600" />
          </div>
          <h1 className="text-[26px] font-bold text-primary">Masuk</h1>
          <p className="text-[14px] text-secondary mt-[5px]">Masuk ke akun Arazel Store kamu</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-[16px]">
          <div>
            <label className="block text-[13px] font-medium text-primary mb-[5px]">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-[13px] top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full h-[44px] pl-[40px] pr-[13px] rounded-[8px] bg-surface border border-subtle text-primary text-[14px] placeholder:text-muted focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-primary mb-[5px]">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-[13px] top-1/2 -translate-y-1/2 text-muted" />
              <input
                type={show ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full h-[44px] pl-[40px] pr-[40px] rounded-[8px] bg-surface border border-subtle text-primary text-[14px] placeholder:text-muted focus:outline-none focus:border-brand-500"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-[13px] top-1/2 -translate-y-1/2 text-muted hover:text-primary"
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full justify-center h-[44px] text-[14px] disabled:opacity-50"
          >
            {submitting ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p className="text-center text-[13px] text-secondary mt-[21px]">
          Belum punya akun?{' '}
          <Link to="/register" className="text-brand-600 hover:text-brand-700 font-medium">
            Daftar
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
