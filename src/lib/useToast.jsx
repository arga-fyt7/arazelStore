import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { CheckCircle, AlertCircle, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

const ToastContext = createContext()

let toastId = 0

function Toast({ toast, onRemove }) {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    const start = Date.now()
    const duration = 3000
    const timer = setInterval(() => {
      const elapsed = Date.now() - start
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)
      if (remaining <= 0) clearInterval(timer)
    }, 30)
    return () => clearInterval(timer)
  }, [])

  const isSuccess = toast.type === 'success'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="pointer-events-auto relative overflow-hidden rounded-[13px] shadow-xl border border-subtle bg-card"
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-[4px] ${
          isSuccess ? 'bg-accent-500' : 'bg-red-500'
        }`}
      />
      <div className="flex items-start gap-[13px] p-[16px] pb-[13px] pl-[21px]">
        <div
          className={`shrink-0 w-[28px] h-[28px] rounded-full flex items-center justify-center ${
            isSuccess
              ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400'
              : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
          }`}
        >
          {isSuccess ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
        </div>
        <p className="text-[14px] text-primary flex-1 leading-snug pt-[3px]">{toast.message}</p>
        <button
          onClick={onRemove}
          className="text-muted hover:text-primary transition-colors shrink-0 p-[2px]"
        >
          <X size={15} />
        </button>
      </div>
      <div className="h-[3px] bg-surface-secondary relative">
        <motion.div
          className={`absolute left-0 top-0 bottom-0 ${
            isSuccess ? 'bg-accent-500' : 'bg-red-500'
          }`}
          style={{ width: `${progress}%` }}
          transition={{ duration: 0 }}
        />
      </div>
    </motion.div>
  )
}

function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    if (type === 'success') {
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.12)
    } else {
      osc.frequency.value = 380
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.2)
    }
  } catch {}
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success') => {
    playSound(type)
    const id = ++toastId
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-[21px] right-[21px] z-[100] flex flex-col gap-[8px] max-w-[360px] w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              toast={toast}
              onRemove={() => removeToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within a ToastProvider')
  return context
}
