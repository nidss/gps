// ── ศูนย์กลางข้อมูลของแอป ───────────────────────────────────────────
// ใช้ Context เดียวเก็บ state ทั้งหมด แล้วแยกเป็น hook ตามหมวดการใช้งาน
// ทุก action จะเขียนลง localStorage และอัปเดต state พร้อมกัน
import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from 'react'
import type {
  Address, AppNotification, Banner, CartItem, Category, Coupon, Order, OrderStatus,
  PaymentMethod, Product, TaxInfo, User,
} from '../types'
import { KEYS, clearAll, hashPassword, read, write } from '../lib/storage'
import { effectivePrice, todayKey } from '../lib/format'
import { orderCode, uid } from '../lib/id'
import { bySortOrder, moveBySortOrder } from '../lib/sortOrder'
import {
  buildSeedOrders, categoriesFromProducts, seedBanners, seedCategories, seedCoupons, seedNotifications,
  seedProducts, seedUsers,
} from '../lib/seed'

/** ค่าจัดส่งมาตรฐาน และยอดซื้อขั้นต่ำที่ส่งฟรี */
export const SHIPPING_FEE = 60
export const FREE_SHIPPING_MIN = 1500
/** อัตราภาษีมูลค่าเพิ่ม ใช้แยกแสดงจากยอดที่รวม VAT แล้ว */
export const VAT_RATE = 0.07

/**
 * บัญชีผู้ดูแลระบบสำหรับสาธิต
 * คำเตือน: static site ไม่มีเซิร์ฟเวอร์ตรวจสิทธิ์ การล็อกอินนี้จึงกันได้แค่ระดับ UI
 * ห้ามใช้รูปแบบนี้กับข้อมูลจริง
 */
export const ADMIN_USERNAME = 'admin'
export const ADMIN_PASSWORD = 'admin1234'

interface AppState {
  products: Product[]
  categories: Category[]
  banners: Banner[]
  coupons: Coupon[]
  users: User[]
  orders: Order[]
  notifications: AppNotification[]
  cart: CartItem[]
  currentUserId: string | null
  adminLoggedIn: boolean
}

const AppContext = createContext<{
  state: AppState
  setState: React.Dispatch<React.SetStateAction<AppState>>
} | null>(null)

/**
 * เลขรุ่นของแคตตาล็อกตั้งต้น (สินค้า แบนเนอร์ คูปอง)
 *
 * ต้องบวกเลขนี้ทุกครั้งที่แก้ข้อมูลใน products.data.ts หรือ seed.ts
 * ไม่งั้นคนที่เคยเข้าเว็บมาก่อนจะเห็นข้อมูลชุดเดิมค้างอยู่ตลอดไป
 * เพราะข้อมูลถูกเก็บไว้ใน localStorage ของเบราว์เซอร์ตั้งแต่ครั้งแรกที่เข้า
 *
 * รุ่น 2: เปลี่ยนจากสินค้าตัวอย่างมาเป็นสินค้าจริงของร้าน ROD
 */
const CATALOG_VERSION = 2

/**
 * หมวดหมู่ของผู้ใช้ที่เข้าเว็บมาก่อนจะมีหน้าจัดการหมวดหมู่ยังไม่มีข้อมูลนี้ในเครื่อง
 * จึงสร้างจากสินค้าที่เก็บอยู่ (รวมสินค้าที่แอดมินเพิ่มเอง) แล้วบันทึกไว้เลย
 * เพื่อให้ id หมวดคงที่ ไม่เปลี่ยนไปตามสินค้าในการโหลดครั้งต่อ ๆ ไป
 */
function loadCategories(products: Product[]): Category[] {
  const stored = read<Category[] | null>(KEYS.categories, null)
  if (stored) return stored
  const derived = categoriesFromProducts(products)
  write(KEYS.categories, derived)
  return derived
}

/** โหลดข้อมูลจาก localStorage ครั้งแรก พร้อมใส่ข้อมูลตัวอย่างถ้ายังไม่เคยมี */
function loadInitialState(): AppState {
  const seeded = read<boolean>(KEYS.seeded, false)
  if (!seeded) {
    const orders = buildSeedOrders(seedProducts, seedUsers)
    write(KEYS.products, seedProducts)
    write(KEYS.categories, seedCategories)
    write(KEYS.banners, seedBanners)
    write(KEYS.coupons, seedCoupons)
    write(KEYS.users, seedUsers)
    write(KEYS.orders, orders)
    write(KEYS.notifications, seedNotifications)
    write(KEYS.seeded, true)
    write(KEYS.catalogVersion, CATALOG_VERSION)
    return {
      products: seedProducts, categories: seedCategories, banners: seedBanners, coupons: seedCoupons,
      users: seedUsers, orders, notifications: seedNotifications,
      cart: read<CartItem[]>(KEYS.cart, []),
      currentUserId: read<string | null>(KEYS.session, null),
      adminLoggedIn: read<boolean>(KEYS.adminSession, false),
    }
  }
  // เคยเข้าเว็บมาแล้ว แต่แคตตาล็อกในเครื่องเป็นรุ่นเก่า ให้อัปเดตเฉพาะ
  // สินค้า หมวดหมู่ แบนเนอร์ และคูปอง ส่วนบัญชีสมาชิก ออเดอร์ และการแจ้งเตือน
  // ซึ่งเป็นข้อมูลที่ผู้ใช้สร้างเองยังเก็บไว้เหมือนเดิม
  const storedVersion = read<number>(KEYS.catalogVersion, 1)
  if (storedVersion !== CATALOG_VERSION) {
    write(KEYS.products, seedProducts)
    write(KEYS.categories, seedCategories)
    write(KEYS.banners, seedBanners)
    write(KEYS.coupons, seedCoupons)
    // ตะกร้าต้องล้างทิ้ง เพราะเก็บไว้แค่รหัสสินค้า ไม่ได้เก็บราคา
    // ถ้าแคตตาล็อกใหม่ใช้รหัสซ้ำกับของเดิม ผู้ใช้จะเห็นสินค้าคนละตัว
    // ในราคาคนละราคาโดยที่ไม่เคยกดเพิ่มเอง
    write(KEYS.cart, [])
    write(KEYS.catalogVersion, CATALOG_VERSION)
    return {
      products: seedProducts,
      categories: seedCategories,
      banners: seedBanners,
      coupons: seedCoupons,
      users: read<User[]>(KEYS.users, seedUsers),
      orders: read<Order[]>(KEYS.orders, []),
      notifications: read<AppNotification[]>(KEYS.notifications, seedNotifications),
      cart: [],
      currentUserId: read<string | null>(KEYS.session, null),
      adminLoggedIn: read<boolean>(KEYS.adminSession, false),
    }
  }

  const products = read<Product[]>(KEYS.products, seedProducts)
  return {
    products,
    categories: loadCategories(products),
    banners: read<Banner[]>(KEYS.banners, seedBanners),
    coupons: read<Coupon[]>(KEYS.coupons, seedCoupons),
    users: read<User[]>(KEYS.users, seedUsers),
    orders: read<Order[]>(KEYS.orders, []),
    notifications: read<AppNotification[]>(KEYS.notifications, seedNotifications),
    cart: read<CartItem[]>(KEYS.cart, []),
    currentUserId: read<string | null>(KEYS.session, null),
    adminLoggedIn: read<boolean>(KEYS.adminSession, false),
  }
}

/** คีย์ใน localStorage ที่ตรงกับ state แต่ละส่วน ใช้ซิงก์ข้อมูลระหว่างแท็บ */
const SYNCED_SLICES: Array<[string, keyof AppState]> = [
  [KEYS.products, 'products'],
  [KEYS.categories, 'categories'],
  [KEYS.banners, 'banners'],
  [KEYS.coupons, 'coupons'],
  [KEYS.users, 'users'],
  [KEYS.orders, 'orders'],
  [KEYS.notifications, 'notifications'],
  [KEYS.cart, 'cart'],
  [KEYS.session, 'currentUserId'],
  [KEYS.adminSession, 'adminLoggedIn'],
]

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadInitialState)

  // เปิดหลายแท็บพร้อมกัน (เช่น หน้าร้านกับหลังบ้าน) ให้เห็นข้อมูลที่อีกแท็บแก้ทันที
  // และกันแท็บที่ถือข้อมูลเก่าอยู่เขียนทับของใหม่ในครั้งถัดไปที่บันทึก
  // event นี้ยิงเฉพาะแท็บอื่น ไม่ยิงในแท็บที่เป็นคนเขียนเอง
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      const slice = SYNCED_SLICES.find(([key]) => key === e.key)
      // newValue เป็น null เมื่ออีกแท็บกดรีเซ็ตข้อมูล — แท็บนั้นรีโหลดเอง ปล่อยแท็บนี้ไว้ตามเดิม
      if (!slice || e.newValue === null) return
      try {
        const value = JSON.parse(e.newValue)
        setState((prev) => ({ ...prev, [slice[1]]: value }))
      } catch {
        /* ข้อมูลเสีย — ข้ามไป */
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const value = useMemo(() => ({ state, setState }), [state])
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('ต้องใช้ hook นี้ภายใน <AppProvider> เท่านั้น')
  return ctx
}

/** ตัวช่วยอัปเดต state หนึ่งส่วน พร้อมบันทึกลง localStorage */
function useSlice<K extends keyof AppState>(key: K, storageKey: string) {
  const { state, setState } = useApp()
  const update = useCallback(
    (next: AppState[K] | ((prev: AppState[K]) => AppState[K])) => {
      setState((prev) => {
        const resolved =
          typeof next === 'function' ? (next as (p: AppState[K]) => AppState[K])(prev[key]) : next
        write(storageKey, resolved)
        return { ...prev, [key]: resolved }
      })
    },
    [key, storageKey, setState],
  )
  return [state[key], update] as const
}

// ── สมาชิกและการเข้าสู่ระบบ ─────────────────────────────────────────

export function useAuth() {
  const { state, setState } = useApp()
  const [users, setUsers] = useSlice('users', KEYS.users)

  const currentUser = useMemo(
    () => state.users.find((u) => u.id === state.currentUserId) ?? null,
    [state.users, state.currentUserId],
  )

  const setCurrentUserId = useCallback(
    (id: string | null) => {
      write(KEYS.session, id)
      setState((prev) => ({ ...prev, currentUserId: id }))
    },
    [setState],
  )

  /** สมัครสมาชิกใหม่ — คืนข้อความผิดพลาดถ้าอีเมลซ้ำ */
  const register = useCallback(
    (input: { email: string; password: string; firstName: string; lastName: string; phone: string }):
      | { ok: true; user: User }
      | { ok: false; error: string } => {
      const email = input.email.trim().toLowerCase()
      if (state.users.some((u) => u.email.toLowerCase() === email)) {
        return { ok: false, error: 'อีเมลนี้ถูกใช้สมัครสมาชิกไปแล้ว' }
      }
      const user: User = {
        id: uid('u'), email, passwordHash: hashPassword(input.password),
        firstName: input.firstName.trim(), lastName: input.lastName.trim(),
        phone: input.phone.trim(), shipping: null, tax: null,
        createdAt: new Date().toISOString(),
      }
      setUsers((prev) => [...prev, user])
      setCurrentUserId(user.id)
      return { ok: true, user }
    },
    [state.users, setUsers, setCurrentUserId],
  )

  const login = useCallback(
    (email: string, password: string): { ok: true } | { ok: false; error: string } => {
      const found = state.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
      if (!found || found.passwordHash !== hashPassword(password)) {
        return { ok: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }
      }
      setCurrentUserId(found.id)
      return { ok: true }
    },
    [state.users, setCurrentUserId],
  )

  const logout = useCallback(() => setCurrentUserId(null), [setCurrentUserId])

  /** อัปเดตโปรไฟล์ของสมาชิกที่ล็อกอินอยู่ */
  const updateProfile = useCallback(
    (patch: Partial<Pick<User, 'firstName' | 'lastName' | 'phone' | 'shipping' | 'tax'>>) => {
      if (!state.currentUserId) return
      setUsers((prev) =>
        prev.map((u) => (u.id === state.currentUserId ? { ...u, ...patch } : u)),
      )
    },
    [state.currentUserId, setUsers],
  )

  // ── ผู้ดูแลระบบ (สาธิตเท่านั้น) ──
  const adminLogin = useCallback(
    (username: string, password: string): { ok: true } | { ok: false; error: string } => {
      if (username.trim() !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
        return { ok: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านผู้ดูแลระบบไม่ถูกต้อง' }
      }
      write(KEYS.adminSession, true)
      setState((prev) => ({ ...prev, adminLoggedIn: true }))
      return { ok: true }
    },
    [setState],
  )

  const adminLogout = useCallback(() => {
    write(KEYS.adminSession, false)
    setState((prev) => ({ ...prev, adminLoggedIn: false }))
  }, [setState])

  return {
    users, currentUser, isLoggedIn: currentUser !== null,
    adminLoggedIn: state.adminLoggedIn,
    register, login, logout, updateProfile, adminLogin, adminLogout,
  }
}

// ── สินค้า แบนเนอร์ คูปอง ───────────────────────────────────────────

export function useCatalog() {
  const [products, setProducts] = useSlice('products', KEYS.products)
  const [categoryRecords, setCategories] = useSlice('categories', KEYS.categories)
  const [banners, setBanners] = useSlice('banners', KEYS.banners)
  const [coupons] = useSlice('coupons', KEYS.coupons)

  const getProduct = useCallback(
    (id: string) => products.find((p) => p.id === id) ?? null,
    [products],
  )

  /** สินค้าที่เปิดขายอยู่ */
  const activeProducts = useMemo(() => products.filter((p) => p.active), [products])

  /** สินค้าแนะนำสำหรับหน้าแรก */
  const recommendedProducts = useMemo(
    () => activeProducts.filter((p) => p.recommended),
    [activeProducts],
  )

  /** หมวดหมู่ทั้งหมดเรียงตามลำดับที่ตั้งไว้ — สำหรับหลังบ้าน */
  const categoryList = useMemo(() => [...categoryRecords].sort(bySortOrder), [categoryRecords])

  /**
   * ชื่อหมวดหมู่ที่แสดงบนหน้าร้าน (เมนู ปุ่มลัด ตัวกรอง)
   * เงื่อนไข: เปิดแสดง และมีสินค้าเปิดขายอยู่อย่างน้อย 1 ชิ้น — เรียงตามลำดับที่ตั้งไว้
   */
  const categories = useMemo(() => {
    const inUse = new Set(activeProducts.map((p) => p.category))
    return categoryList.filter((c) => c.active && inUse.has(c.name)).map((c) => c.name)
  }, [categoryList, activeProducts])

  /**
   * แบนเนอร์ที่แสดงได้จริงบนหน้าแรก
   * เงื่อนไข: เปิดใช้งาน และวันนี้อยู่ในช่วงวันที่กำหนด — เรียงตามลำดับที่ตั้งไว้
   */
  const liveBanners = useMemo(() => {
    const today = todayKey()
    return banners
      .filter((b) => b.active && b.startDate <= today && today <= b.endDate)
      .sort(bySortOrder)
  }, [banners])

  const saveProduct = useCallback(
    (product: Product) => {
      setProducts((prev) =>
        prev.some((p) => p.id === product.id)
          ? prev.map((p) => (p.id === product.id ? product : p))
          : [...prev, product],
      )
    },
    [setProducts],
  )

  const deleteProduct = useCallback(
    (id: string) => setProducts((prev) => prev.filter((p) => p.id !== id)),
    [setProducts],
  )

  const saveBanner = useCallback(
    (banner: Banner) => {
      setBanners((prev) =>
        prev.some((b) => b.id === banner.id)
          ? prev.map((b) => (b.id === banner.id ? banner : b))
          : [...prev, banner],
      )
    },
    [setBanners],
  )

  const deleteBanner = useCallback(
    (id: string) => setBanners((prev) => prev.filter((b) => b.id !== id)),
    [setBanners],
  )

  /** สลับลำดับการแสดงแบนเนอร์ขึ้น/ลงหนึ่งขั้น */
  const moveBanner = useCallback(
    (id: string, direction: -1 | 1) => {
      setBanners((prev) => moveBySortOrder(prev, id, direction))
    },
    [setBanners],
  )

  /**
   * บันทึกหมวดหมู่ ถ้าเป็นการเปลี่ยนชื่อ สินค้าทุกตัวในหมวดเดิมจะย้ายตามไปใช้ชื่อใหม่
   * เพราะสินค้าอ้างอิงหมวดด้วยชื่อ
   */
  const saveCategory = useCallback(
    (category: Category) => {
      const previous = categoryRecords.find((c) => c.id === category.id)
      if (previous && previous.name !== category.name) {
        setProducts((prev) =>
          prev.map((p) => (p.category === previous.name ? { ...p, category: category.name } : p)),
        )
      }
      setCategories((prev) =>
        prev.some((c) => c.id === category.id)
          ? prev.map((c) => (c.id === category.id ? category : c))
          : [...prev, category],
      )
    },
    [categoryRecords, setCategories, setProducts],
  )

  /** ลบหมวดหมู่ — ถ้ามีสินค้าอยู่ต้องระบุหมวดปลายทางเพื่อย้ายสินค้าไปก่อน */
  const deleteCategory = useCallback(
    (id: string, moveProductsTo: string | null) => {
      const target = categoryRecords.find((c) => c.id === id)
      if (!target) return
      if (moveProductsTo) {
        setProducts((prev) =>
          prev.map((p) => (p.category === target.name ? { ...p, category: moveProductsTo } : p)),
        )
      }
      setCategories((prev) => prev.filter((c) => c.id !== id))
    },
    [categoryRecords, setCategories, setProducts],
  )

  const moveCategory = useCallback(
    (id: string, direction: -1 | 1) => setCategories((prev) => moveBySortOrder(prev, id, direction)),
    [setCategories],
  )

  /**
   * ตรวจสอบคูปองกับยอดซื้อ — คืนส่วนลดและส่วนลดค่าส่ง
   * ยอดที่ส่งเข้ามาคือยอดสินค้าก่อนหักส่วนลด
   */
  const validateCoupon = useCallback(
    (code: string, subtotal: number):
      | { ok: true; coupon: Coupon; discount: number; freeShipping: boolean }
      | { ok: false; error: string } => {
      const normalized = code.trim().toUpperCase()
      if (!normalized) return { ok: false, error: 'กรุณากรอกรหัสคูปอง' }
      const coupon = coupons.find((c) => c.code === normalized)
      if (!coupon || !coupon.active) return { ok: false, error: 'ไม่พบรหัสคูปองนี้ในระบบ' }
      if (coupon.expiresAt < todayKey()) return { ok: false, error: 'คูปองนี้หมดอายุแล้ว' }
      if (subtotal < coupon.minSpend) {
        return {
          ok: false,
          error: `ต้องซื้อครบ ${coupon.minSpend.toLocaleString('th-TH')} บาทขึ้นไปจึงใช้คูปองนี้ได้`,
        }
      }
      if (coupon.type === 'freeship') {
        return { ok: true, coupon, discount: 0, freeShipping: true }
      }
      const discount =
        coupon.type === 'percent'
          ? Math.round((subtotal * coupon.value) / 100)
          : Math.min(coupon.value, subtotal)
      return { ok: true, coupon, discount, freeShipping: false }
    },
    [coupons],
  )

  return {
    products, activeProducts, recommendedProducts, categories, categoryList, getProduct,
    banners, liveBanners, coupons,
    saveProduct, deleteProduct, saveBanner, deleteBanner, moveBanner, validateCoupon,
    saveCategory, deleteCategory, moveCategory,
  }
}

// ── ตะกร้าสินค้า ────────────────────────────────────────────────────

export function useCart() {
  const [cart, setCart] = useSlice('cart', KEYS.cart)
  const { products } = useCatalog()

  /** รายการในตะกร้าพร้อมข้อมูลสินค้าเต็ม (ตัดสินค้าที่ถูกลบออกแล้ว) */
  const items = useMemo(
    () =>
      cart
        .map((item) => {
          const product = products.find((p) => p.id === item.productId)
          if (!product) return null
          const unitPrice = effectivePrice(product.price, product.salePrice)
          return { product, qty: item.qty, unitPrice, lineTotal: unitPrice * item.qty }
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
    [cart, products],
  )

  const count = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items])
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.lineTotal, 0), [items])

  const add = useCallback(
    (productId: string, qty = 1) => {
      setCart((prev) => {
        const existing = prev.find((i) => i.productId === productId)
        if (existing) {
          return prev.map((i) => (i.productId === productId ? { ...i, qty: i.qty + qty } : i))
        }
        return [...prev, { productId, qty }]
      })
    },
    [setCart],
  )

  const setQty = useCallback(
    (productId: string, qty: number) => {
      setCart((prev) =>
        qty <= 0
          ? prev.filter((i) => i.productId !== productId)
          : prev.map((i) => (i.productId === productId ? { ...i, qty } : i)),
      )
    },
    [setCart],
  )

  const remove = useCallback(
    (productId: string) => setCart((prev) => prev.filter((i) => i.productId !== productId)),
    [setCart],
  )

  const clear = useCallback(() => setCart([]), [setCart])

  return { items, count, subtotal, add, setQty, remove, clear }
}

// ── ออเดอร์ ─────────────────────────────────────────────────────────

export interface CreateOrderInput {
  shipping: Address
  tax: TaxInfo | null
  couponCode: string | null
  discount: number
  shippingFee: number
  paymentMethod: PaymentMethod
  customerName: string
  customerEmail: string
  customerPhone: string
}

export function useOrders() {
  const { state } = useApp()
  const [orders, setOrders] = useSlice('orders', KEYS.orders)
  const [products, setProducts] = useSlice('products', KEYS.products)
  const { items, subtotal, clear } = useCart()
  const { push: pushNotification } = useNotifications()

  /** ออเดอร์ของสมาชิกที่ล็อกอินอยู่ เรียงใหม่สุดก่อน */
  const myOrders = useMemo(
    () =>
      orders
        .filter((o) => o.userId === state.currentUserId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [orders, state.currentUserId],
  )

  const getOrder = useCallback((id: string) => orders.find((o) => o.id === id) ?? null, [orders])

  const ordersOfUser = useCallback(
    (userId: string) =>
      orders
        .filter((o) => o.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [orders],
  )

  /** สร้างออเดอร์จากตะกร้าปัจจุบัน แล้วตัดสต็อกและล้างตะกร้า */
  const createOrder = useCallback(
    (input: CreateOrderInput): Order => {
      const lines = items.map((i) => ({
        productId: i.product.id, name: i.product.name, sku: i.product.sku,
        image: i.product.images[0] ?? '', unitPrice: i.unitPrice, qty: i.qty,
      }))
      const total = Math.max(0, subtotal - input.discount) + input.shippingFee
      const order: Order = {
        id: uid('o'),
        code: orderCode(orders.length + 1),
        userId: state.currentUserId,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        lines,
        shipping: input.shipping,
        tax: input.tax,
        couponCode: input.couponCode,
        subtotal,
        discount: input.discount,
        shippingFee: input.shippingFee,
        total,
        paymentMethod: input.paymentMethod,
        // โอนเงินถือว่ารอชำระ ส่วนบัตรเครดิตถือว่าชำระแล้วทันที (จำลอง)
        status: input.paymentMethod === 'card' ? 'paid' : 'pending',
        createdAt: new Date().toISOString(),
      }
      setOrders((prev) => [...prev, order])
      // ตัดสต็อกตามจำนวนที่สั่ง
      setProducts((prev) =>
        prev.map((p) => {
          const line = lines.find((l) => l.productId === p.id)
          return line ? { ...p, stock: Math.max(0, p.stock - line.qty) } : p
        }),
      )
      clear()
      pushNotification({
        kind: 'order',
        title: `รับคำสั่งซื้อ ${order.code} แล้ว`,
        message:
          order.status === 'paid'
            ? 'ชำระเงินสำเร็จ กำลังเตรียมจัดส่งสินค้า'
            : 'กรุณาชำระเงินเพื่อยืนยันคำสั่งซื้อ',
        link: `/account`,
      })
      return order
    },
    [items, subtotal, orders.length, state.currentUserId, setOrders, setProducts, clear, pushNotification],
  )

  const updateStatus = useCallback(
    (orderId: string, status: OrderStatus) => {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)))
    },
    [setOrders],
  )

  // ── ตัวเลขสรุปสำหรับหน้า dashboard ──
  const stats = useMemo(() => {
    // ยอดขายนับเฉพาะออเดอร์ที่ชำระแล้วเป็นต้นไป ไม่รวมที่ยกเลิก
    const revenueStatuses: OrderStatus[] = ['paid', 'shipped', 'completed']
    const paidOrders = orders.filter((o) => revenueStatuses.includes(o.status))
    const pendingOrders = orders.filter((o) => o.status === 'pending')

    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0)
    const pendingAmount = pendingOrders.reduce((sum, o) => sum + o.total, 0)

    // ยอดขายรายวัน 14 วันล่าสุด สำหรับกราฟแท่ง
    const daily: Array<{ date: string; total: number }> = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = todayKey(d)
      const total = paidOrders
        .filter((o) => o.createdAt.slice(0, 10) === key)
        .reduce((sum, o) => sum + o.total, 0)
      daily.push({ date: key, total })
    }

    // สินค้าที่ขายได้ เรียงตามจำนวนชิ้น
    const soldMap = new Map<string, { name: string; sku: string; qty: number; revenue: number }>()
    for (const order of paidOrders) {
      for (const line of order.lines) {
        const current = soldMap.get(line.productId) ?? {
          name: line.name, sku: line.sku, qty: 0, revenue: 0,
        }
        current.qty += line.qty
        current.revenue += line.unitPrice * line.qty
        soldMap.set(line.productId, current)
      }
    }
    const topProducts = Array.from(soldMap.entries())
      .map(([productId, v]) => ({ productId, ...v }))
      .sort((a, b) => b.qty - a.qty)

    const itemsSold = topProducts.reduce((sum, p) => sum + p.qty, 0)
    const recentOrders = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8)

    return {
      totalRevenue,
      orderCount: orders.length,
      paidCount: paidOrders.length,
      pendingCount: pendingOrders.length,
      pendingAmount,
      itemsSold,
      lowStockCount: products.filter((p) => p.active && p.stock <= 20).length,
      daily,
      topProducts,
      recentOrders,
    }
  }, [orders, products])

  return { orders, myOrders, getOrder, ordersOfUser, createOrder, updateStatus, stats }
}

// ── การแจ้งเตือน ────────────────────────────────────────────────────

export function useNotifications() {
  const [notifications, setNotifications] = useSlice('notifications', KEYS.notifications)

  const sorted = useMemo(
    () => [...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [notifications],
  )
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  const push = useCallback(
    (input: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => {
      setNotifications((prev) => [
        ...prev,
        { ...input, id: uid('n'), read: false, createdAt: new Date().toISOString() },
      ])
    },
    [setNotifications],
  )

  const markRead = useCallback(
    (id: string) => setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n))),
    [setNotifications],
  )

  const markAllRead = useCallback(
    () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))),
    [setNotifications],
  )

  return { notifications: sorted, unreadCount, push, markRead, markAllRead }
}

// ── ยูทิลิตี้สำหรับหน้า admin ────────────────────────────────────────

/** รีเซ็ตข้อมูลทั้งหมดกลับเป็นข้อมูลตัวอย่างตั้งต้น */
export function useResetDemoData() {
  return useCallback(() => {
    clearAll()
    window.location.reload()
  }, [])
}

/** ปิด scroll ของหน้าเว็บขณะเปิด modal */
export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [locked])
}
