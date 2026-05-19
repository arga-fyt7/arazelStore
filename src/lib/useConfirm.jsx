import { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { AlertTriangle, X } from 'lucide-react'

const ConfirmContext = createContext()

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({ open: false, resolve: null })

  const confirm = useCallback(({ title, message, confirmText = 'Ya', cancelText = 'Batal', variant = 'danger' } = {}) => {
    return new Promise((resolve) => {
      setState({ open: true, resolve, title, message, confirmText, cancelText, variant })
    })
  }, [])

  const handleClose = useCallback(() => {
    setState((prev) => {
      prev.resolve?.(false)
      return { open: false, resolve: null }
    })
  }, [])

  const handleConfirm = useCallback(() => {
    setState((prev) => {
      prev.resolve?.(true)
      return { open: false, resolve: null }
    })
  }, [])

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {state.open && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-[21px]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={handleClose}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="relative w-full max-w-[380px] bg-card rounded-[16px] border border-subtle shadow-2xl p-[24px]"
            >
              <button onClick={handleClose} className="absolute top-[16px] right-[16px] text-muted hover:text-primary transition-colors">
                <X size={18} />
              </button>
              <div className={`w-[44px] h-[44px] rounded-full flex items-center justify-center mb-[16px] ${
                state.variant === 'danger' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                state.variant === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600' :
                'bg-brand-100 dark:bg-brand-900/30 text-brand-600'
              }`}>
                <AlertTriangle size={22} />
              </div>
              <h3 className="text-[16px] font-bold text-primary mb-[6px]">{state.title}</h3>
              {state.message && (
                <p className="text-[13px] text-secondary leading-relaxed mb-[21px]">{state.message}</p>
              )}
              <div className="flex gap-[8px]">
                <button onClick={handleClose}
                  className="flex-1 h-[42px] rounded-[10px] border border-subtle text-secondary hover:text-primary hover:bg-surface-secondary transition-colors text-[13px] font-medium"
                >
                  {state.cancelText}
                </button>
                <button onClick={handleConfirm}
                  className={`flex-1 h-[42px] rounded-[10px] text-white text-[13px] font-medium transition-colors ${
                    state.variant === 'danger' ? 'bg-red-600 hover:bg-red-700' :
                    state.variant === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' :
                    'bg-brand-600 hover:bg-brand-700'
                  }`}
                >
                  {state.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) throw new Error('useConfirm must be used within a ConfirmProvider')
  return context
}
