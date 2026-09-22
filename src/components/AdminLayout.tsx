// ── โครงหน้าระบบหลังบ้าน ────────────────────────────────────────────
import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth, useResetDemoData } from '../store/AppStore'
import { asset } from '../lib/asset'
import { BoxIcon, DashboardIcon, ImageIcon, LogoutIcon, UsersIcon } from './Icons'
import { Button, cx } from './ui'

const menu = [
  { to: '/admin', label: 'ภาพรวมยอดขาย', icon: DashboardIcon, end: true },
  { to: '/admin/banners', label: 'จัดการแบนเนอร์', icon: ImageIcon, end: false },
  { to: '/admin/products', label: 'จัดการสินค้า', icon: BoxIcon, end: false },
  { to: '/admin/members', label: 'ข้อมูลสมาชิก', icon: UsersIcon, end: false },
]

export function AdminLayout() {
  const { adminLoggedIn, adminLogout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const resetDemo = useResetDemoData()

  // ยังไม่ได้ล็อกอินผู้ดูแลระบบ ให้เด้งไปหน้าเข้าสู่ระบบหลังบ้าน
  useEffect(() => {
    if (!adminLoggedIn) navigate('/admin/login', { replace: true })
  }, [adminLoggedIn, navigate])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  if (!adminLoggedIn) return null

  return (
    <div className="flex min-h-screen flex-col bg-gp-surface lg:flex-row">
      <aside className="bg-gp-ink lg:w-64 lg:shrink-0">
        <div className="speed-lines flex h-full flex-col">
          <div className="border-b border-white/10 px-5 py-5">
            <Link to="/" className="block">
              <img src={asset('logo-grandprix.png')} alt="Grandprix Online" className="h-8 w-auto" />
            </Link>
            <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-gp-red-light">
              ระบบหลังบ้าน
            </p>
          </div>

          <nav className="flex gap-1 overflow-x-auto p-3 lg:flex-col lg:overflow-visible">
            {menu.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cx(
                    'flex shrink-0 items-center gap-3 rounded-md px-3.5 py-2.5 text-sm font-medium transition-colors',
                    isActive ? 'bg-gp-red text-white' : 'text-white/70 hover:bg-white/10 hover:text-white',
                  )
                }
              >
                <Icon className="h-4.5 w-4.5" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto hidden gap-2 p-3 lg:grid">
            <Link
              to="/"
              className="rounded-md px-3.5 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              ← กลับไปหน้าร้าน
            </Link>
            <button
              type="button"
              onClick={resetDemo}
              className="rounded-md px-3.5 py-2.5 text-left text-xs text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
            >
              รีเซ็ตข้อมูลตัวอย่างทั้งหมด
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-4 border-b border-gp-line bg-white px-4 py-3.5 lg:px-8">
          <p className="text-sm text-gp-ink-soft">
            เข้าสู่ระบบในฐานะ <span className="font-bold text-gp-ink">ผู้ดูแลระบบ</span>
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => {
              adminLogout()
              navigate('/')
            }}
          >
            <LogoutIcon className="h-4 w-4" />
            ออกจากระบบ
          </Button>
        </header>

        <main className="min-w-0 flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

/** หัวข้อของแต่ละหน้าในระบบหลังบ้าน */
export function AdminPageHeader({
  title, description, action,
}: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="section-title text-xl font-bold text-gp-ink sm:text-2xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-gp-ink-soft">{description}</p>}
      </div>
      {action}
    </div>
  )
}
