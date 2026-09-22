// ── เส้นทางทั้งหมดของเว็บไซต์ ───────────────────────────────────────
// ใช้ HashRouter เพราะ GitHub Pages เสิร์ฟไฟล์ static ล้วน
// การรีเฟรชหน้าลึก ๆ จึงไม่เจอ 404
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider } from './store/AppStore'
import { FlyToCartProvider } from './components/FlyToCart'
import { Layout } from './components/Layout'
import { AdminLayout } from './components/AdminLayout'

import { Home } from './pages/Home'
import { Products } from './pages/Products'
import { ProductDetail } from './pages/ProductDetail'
import { Cart } from './pages/Cart'
import { Checkout } from './pages/Checkout'
import { CheckoutSuccess } from './pages/CheckoutSuccess'
import { Register } from './pages/Register'
import { Login } from './pages/Login'
import { Account } from './pages/Account'

import { AdminLogin } from './pages/admin/AdminLogin'
import { Dashboard } from './pages/admin/Dashboard'
import { AdminBanners } from './pages/admin/AdminBanners'
import { AdminProducts } from './pages/admin/AdminProducts'
import { AdminMembers } from './pages/admin/AdminMembers'

export default function App() {
  return (
    <AppProvider>
      <FlyToCartProvider>
        <HashRouter>
          <Routes>
            {/* หน้าเข้าสู่ระบบหลังบ้าน อยู่นอกโครง AdminLayout เพราะยังไม่ได้ล็อกอิน */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* ระบบหลังบ้าน */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="banners" element={<AdminBanners />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="members" element={<AdminMembers />} />
            </Route>

            {/* หน้าฝั่งลูกค้า */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="products" element={<Products />} />
              <Route path="product/:id" element={<ProductDetail />} />
              <Route path="cart" element={<Cart />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="checkout/success/:orderId" element={<CheckoutSuccess />} />
              <Route path="register" element={<Register />} />
              <Route path="login" element={<Login />} />
              <Route path="account" element={<Account />} />
              {/* เส้นทางที่ไม่รู้จักให้กลับหน้าแรก */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </FlyToCartProvider>
    </AppProvider>
  )
}
