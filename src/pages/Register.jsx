import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { UserPlus, Mail, Lock, Eye, EyeOff, User, Phone } from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import { useToast } from '../lib/useToast'

export default function Register() {
  useEffect(() => { document.title = 'Daftar - Arazel Store' }, [])
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [show, setShow] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { register } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await register(form.name, form.email, form.password, form.phone)
      addToast('Registrasi berhasil')
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
        <div className="text-center mb-[34px]">
          <div className="w-[55px] h-[55px] rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mx-auto mb-[16px]">
            <UserPlus size={24} className="text-brand-600" />
          </div>
          <h1 className="text-[26px] font-bold text-primary">Daftar</h1>
          <p className="text-[14px] text-secondary mt-[5px]">Buat akun Arazel Store baru</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-[16px]">
          <div>
            <label className="block text-[13px] font-medium text-primary mb-[5px]">Nama</label>
            <div className="relative">
              <User size={16} className="absolute left-[13px] top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                required
                value={form.name}
                onChange={update('name')}
                placeholder="Nama lengkap"
                className="w-full h-[44px] pl-[40px] pr-[13px] rounded-[8px] bg-surface border border-subtle text-primary text-[14px] placeholder:text-muted focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-primary mb-[5px]">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-[13px] top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="email"
                required
                value={form.email}
                onChange={update('email')}
                placeholder="email@example.com"
                className="w-full h-[44px] pl-[40px] pr-[13px] rounded-[8px] bg-surface border border-subtle text-primary text-[14px] placeholder:text-muted focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-primary mb-[5px]">Nomor HP (opsional)</label>
            <div className="relative">
              <Phone size={16} className="absolute left-[13px] top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="tel"
                value={form.phone}
                onChange={update('phone')}
                placeholder="0812xxxxxxx"
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
                value={form.password}
                onChange={update('password')}
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
            className="btn-primary w-full justify-center h-[44px] text-[14px]"
          >
            {submitting ? 'Memproses...' : 'Daftar'}
          </button>
        </form>

        <p className="text-center text-[13px] text-secondary mt-[21px]">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium">
            Masuk
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
