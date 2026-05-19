import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { CartProvider } from './lib/useCart.jsx'
import { ToastProvider } from './lib/useToast.jsx'
import { AuthProvider } from './lib/useAuth.jsx'
import { ConfirmProvider } from './lib/useConfirm.jsx'
import ErrorBoundary from './components/ErrorBoundary'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <CartProvider>
          <AuthProvider>
            <ConfirmProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </ConfirmProvider>
          </AuthProvider>
        </CartProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>,
)
