// ── แถบนำทางด้านบน: มีส่วนแจ้งเตือน สมาชิก และตะกร้าสินค้า ───────────
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, useCart, useCatalog, useNotifications } from '../store/AppStore'
import { asset } from '../lib/asset'
import { baht, thaiDateTime } from '../lib/format'
import { BellIcon, CartIcon, ChevronDownIcon, CloseIcon, MenuIcon, SearchIcon, UserIcon } from './Icons'
import { Badge, Button, cx } from './ui'
import { useCartTarget } from './FlyToCart'

/** ปิด dropdown เมื่อคลิกนอกพื้นที่ หรือกด Escape */
function useDismiss(onDismiss: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onDismiss()
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onDismiss()
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onDismiss])
  return ref
}

const iconButton =
  'relative flex h-10 w-10 items-center justify-center rounded-md text-white/85 transition-colors hover:bg-white/10 hover:text-white'

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="gp-cart-badge absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gp-red px-1 text-[11px] font-bold text-white ring-2 ring-gp-ink">
      {count > 99 ? '99+' : count}
    </span>
  )
}

export function Navbar() {
  const navigate = useNavigate()
  const { categories } = useCatalog()
  const { count: cartCount, subtotal } = useCart()
  const { currentUser, isLoggedIn, logout } = useAuth()
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()

  const [openMenu, setOpenMenu] = useState<'none' | 'bell' | 'user' | 'cart'>('none')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')

  const dropdownRef = useDismiss(() => setOpenMenu('none'))
  // ปลายทางของแอนิเมชันรูปสินค้าวิ่งเข้าตะกร้า
  const cartTargetRef = useCartTarget()

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/products?q=${encodeURIComponent(q)}` : '/products')
    setMobileOpen(false)
  }

  function handleLogout() {
    logout()
    setOpenMenu('none')
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 bg-gp-ink shadow-lg">
      <div className="speed-lines">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-5 lg:h-20 lg:px-6">
          {/* ปุ่มเมนูสำหรับจอเล็ก */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="เปิดเมนู"
            aria-expanded={mobileOpen}
            className={cx(iconButton, 'lg:hidden')}
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>

          <Link to="/" className="shrink-0" aria-label="Grandprix Online หน้าแรก">
            <img
              src={asset('logo-grandprix.png')}
              alt="Grandprix Online"
              width={340}
              height={110}
              className="h-9 w-auto lg:h-11"
            />
          </Link>

          {/* ช่องค้นหา (จอใหญ่) */}
          <form onSubmit={submitSearch} className="ml-2 hidden flex-1 lg:block">
            <div className="relative max-w-md">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gp-ink-soft" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหาสินค้า เช่น เสื้อโปโล หมวก"
                aria-label="ค้นหาสินค้า"
                className="w-full rounded-md border border-white/10 bg-white/95 py-2.5 pl-10 pr-4 text-sm text-gp-ink placeholder:text-gp-ink-soft/70 focus:border-gp-red focus:outline-none focus:ring-2 focus:ring-gp-red/40"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1 sm:gap-2" ref={dropdownRef}>
            {/* ── 1. แจ้งเตือน ── */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenMenu((m) => (m === 'bell' ? 'none' : 'bell'))}
                aria-label={`การแจ้งเตือน ${unreadCount} รายการที่ยังไม่อ่าน`}
                aria-expanded={openMenu === 'bell'}
                className={iconButton}
              >
                <BellIcon />
                <CountBadge count={unreadCount} />
              </button>
              {openMenu === 'bell' && (
                <div className="absolute right-0 top-12 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-gp-line bg-white shadow-2xl">
                  <div className="flex items-center justify-between border-b border-gp-line px-4 py-3">
                    <span className="text-sm font-bold text-gp-ink">การแจ้งเตือน</span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="text-xs font-semibold text-gp-red hover:underline"
                      >
                        อ่านทั้งหมด
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 && (
                      <p className="px-4 py-8 text-center text-sm text-gp-ink-soft">ยังไม่มีการแจ้งเตือน</p>
                    )}
                    {notifications.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          markRead(n.id)
                          if (n.link) {
                            navigate(n.link)
                            setOpenMenu('none')
                          }
                        }}
                        className={cx(
                          'flex w-full gap-3 border-b border-gp-line px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-gp-surface',
                          !n.read && 'bg-gp-red-tint/40',
                        )}
                      >
                        <span
                          className={cx(
                            'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                            n.read ? 'bg-transparent' : 'bg-gp-red',
                          )}
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-gp-ink">{n.title}</span>
                          <span className="mt-0.5 block text-xs text-gp-ink-soft">{n.message}</span>
                          <span className="mt-1 block text-[11px] text-gp-ink-soft/80">{thaiDateTime(n.createdAt)}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── 2. สมาชิก ── */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenMenu((m) => (m === 'user' ? 'none' : 'user'))}
                aria-label="เมนูสมาชิก"
                aria-expanded={openMenu === 'user'}
                className={cx(iconButton, 'sm:w-auto sm:gap-2 sm:px-3')}
              >
                <UserIcon />
                <span className="hidden max-w-24 truncate text-sm font-semibold sm:inline">
                  {isLoggedIn ? currentUser!.firstName : 'สมาชิก'}
                </span>
                <ChevronDownIcon className="hidden h-4 w-4 sm:inline" />
              </button>
              {openMenu === 'user' && (
                <div className="absolute right-0 top-12 w-64 overflow-hidden rounded-lg border border-gp-line bg-white shadow-2xl">
                  {isLoggedIn ? (
                    <>
                      <div className="border-b border-gp-line bg-gp-surface px-4 py-3">
                        <p className="truncate text-sm font-bold text-gp-ink">
                          {currentUser!.firstName} {currentUser!.lastName}
                        </p>
                        <p className="truncate text-xs text-gp-ink-soft">{currentUser!.email}</p>
                      </div>
                      <Link to="/account" onClick={() => setOpenMenu('none')} className="block px-4 py-2.5 text-sm font-medium text-gp-ink hover:bg-gp-surface">
                        ข้อมูลส่วนตัว
                      </Link>
                      <Link to="/account?tab=orders" onClick={() => setOpenMenu('none')} className="block px-4 py-2.5 text-sm font-medium text-gp-ink hover:bg-gp-surface">
                        ประวัติการสั่งซื้อ
                      </Link>
                      <Link to="/admin" onClick={() => setOpenMenu('none')} className="block border-t border-gp-line px-4 py-2.5 text-sm font-medium text-gp-ink-soft hover:bg-gp-surface">
                        ระบบหลังบ้าน
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="block w-full border-t border-gp-line px-4 py-2.5 text-left text-sm font-semibold text-gp-red hover:bg-gp-red-tint"
                      >
                        ออกจากระบบ
                      </button>
                    </>
                  ) : (
                    <div className="p-4">
                      <p className="mb-3 text-sm text-gp-ink-soft">เข้าสู่ระบบเพื่อสั่งซื้อและดูประวัติคำสั่งซื้อ</p>
                      <div className="grid gap-2">
                        <Button onClick={() => { setOpenMenu('none'); navigate('/login') }} size="sm">
                          เข้าสู่ระบบ
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { setOpenMenu('none'); navigate('/register') }}>
                          สมัครสมาชิก
                        </Button>
                      </div>
                      <Link
                        to="/admin"
                        onClick={() => setOpenMenu('none')}
                        className="mt-3 block text-center text-xs font-semibold text-gp-ink-soft hover:text-gp-red"
                      >
                        เข้าสู่ระบบหลังบ้าน
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── 3. ตะกร้าสินค้า ── */}
            <div className="relative">
              <button
                type="button"
                ref={cartTargetRef as React.RefObject<HTMLButtonElement>}
                onClick={() => setOpenMenu((m) => (m === 'cart' ? 'none' : 'cart'))}
                aria-label={`ตะกร้าสินค้า ${cartCount} ชิ้น`}
                aria-expanded={openMenu === 'cart'}
                className={iconButton}
              >
                <CartIcon />
                <CountBadge count={cartCount} />
              </button>
              {openMenu === 'cart' && (
                <div className="absolute right-0 top-12 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-gp-line bg-white p-4 shadow-2xl">
                  <p className="mb-3 text-sm font-bold text-gp-ink">ตะกร้าสินค้า</p>
                  {cartCount === 0 ? (
                    <p className="py-4 text-center text-sm text-gp-ink-soft">ยังไม่มีสินค้าในตะกร้า</p>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gp-ink-soft">จำนวน</span>
                        <span className="tnum font-semibold text-gp-ink">{cartCount} ชิ้น</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-sm">
                        <span className="text-gp-ink-soft">ยอดรวม</span>
                        <span className="tnum font-bold text-gp-red">{baht(subtotal)}</span>
                      </div>
                    </>
                  )}
                  <Button
                    className="mt-4 w-full"
                    size="sm"
                    onClick={() => { setOpenMenu('none'); navigate('/cart') }}
                  >
                    ไปที่ตะกร้าสินค้า
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* แถบหมวดหมู่ (จอใหญ่) */}
        <nav className="hidden border-t border-white/10 lg:block">
          <div className="mx-auto flex max-w-7xl items-center gap-1 px-6">
            <Link
              to="/products"
              className="px-3 py-2.5 text-sm font-semibold text-white/90 transition-colors hover:text-gp-red-light"
            >
              สินค้าทั้งหมด
            </Link>
            {categories.map((c) => (
              <Link
                key={c}
                to={`/products?category=${encodeURIComponent(c)}`}
                className="px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:text-white"
              >
                {c}
              </Link>
            ))}
            <Badge tone="red" className="ml-auto">ส่งฟรีเมื่อซื้อครบ 1,500 ฿</Badge>
          </div>
        </nav>
      </div>

      {/* เมนูสำหรับจอเล็ก */}
      {mobileOpen && (
        <div className="border-t border-white/10 bg-gp-ink-dark lg:hidden">
          <form onSubmit={submitSearch} className="p-4">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gp-ink-soft" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหาสินค้า"
                aria-label="ค้นหาสินค้า"
                className="w-full rounded-md bg-white py-2.5 pl-10 pr-4 text-sm text-gp-ink placeholder:text-gp-ink-soft/70 focus:outline-none"
              />
            </div>
          </form>
          <nav className="grid gap-0.5 px-2 pb-4">
            <Link to="/products" onClick={() => setMobileOpen(false)} className="rounded-md px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
              สินค้าทั้งหมด
            </Link>
            {categories.map((c) => (
              <Link
                key={c}
                to={`/products?category=${encodeURIComponent(c)}`}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-4 py-2.5 text-sm text-white/80 hover:bg-white/10"
              >
                {c}
              </Link>
            ))}
            <Link to="/admin" onClick={() => setMobileOpen(false)} className="rounded-md px-4 py-2.5 text-sm text-white/60 hover:bg-white/10">
              ระบบหลังบ้าน
            </Link>
          </nav>
        </div>
      )}
      <div className="checker-strip" aria-hidden="true" />
    </header>
  )
}
