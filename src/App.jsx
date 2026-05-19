import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Menu from './pages/Menu'
import Promo from './pages/Promo'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import AdminDashboard from './pages/admin/Dashboard'
import ManageOrders from './pages/admin/ManageOrders'
import ManageProducts from './pages/admin/ManageProducts'
import ManagePromos from './pages/admin/ManagePromos'

import ManageSettings from './pages/admin/ManageSettings'
import ProtectedRoute from './components/ProtectedRoute'
import MaintenanceOverlay from './components/MaintenanceOverlay'

function PageWrap({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

export default function App() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])

  if (isAdmin) {
    return (
      <Routes location={location} key={location.pathname}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/orders" element={<ManageOrders />} />
        <Route path="/admin/products" element={<ManageProducts />} />
        <Route path="/admin/promos" element={<ManagePromos />} />

        <Route path="/admin/users" element={<Navigate to="/admin/pengaturan?tab=pengguna" replace />} />
        <Route path="/admin/reviews" element={<Navigate to="/admin/orders?tab=testimonial" replace />} />
        <Route path="/admin/pengaturan" element={<ManageSettings />} />
      </Routes>
    )
  }

  return (
    <MaintenanceOverlay>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PageWrap><Home /></PageWrap>} />
              <Route path="/menu" element={<PageWrap><Menu /></PageWrap>} />
              <Route path="/promo" element={<PageWrap><Promo /></PageWrap>} />
              <Route path="/product/:id" element={<PageWrap><ProductDetail /></PageWrap>} />
              <Route path="/cart" element={<PageWrap><Cart /></PageWrap>} />
              <Route path="/checkout" element={<PageWrap><ProtectedRoute><Checkout /></ProtectedRoute></PageWrap>} />
              <Route path="/orders" element={<PageWrap><ProtectedRoute><Orders /></ProtectedRoute></PageWrap>} />
              <Route path="/order/:id" element={<PageWrap><ProtectedRoute><OrderDetail /></ProtectedRoute></PageWrap>} />
              <Route path="/login" element={<PageWrap><Login /></PageWrap>} />
              <Route path="/register" element={<PageWrap><Register /></PageWrap>} />
              <Route path="/profile" element={<PageWrap><ProtectedRoute><Profile /></ProtectedRoute></PageWrap>} />
            </Routes>
          </AnimatePresence>
        </main>
        <Footer />
      </div>
    </MaintenanceOverlay>
  )
}
