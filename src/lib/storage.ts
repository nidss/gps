// ── ชั้นเก็บข้อมูลบน localStorage (ทำหน้าที่แทนฐานข้อมูล) ───────────
// เว็บนี้ deploy เป็น static site บน GitHub Pages จึงไม่มี server จริง
// ข้อมูลทั้งหมดอยู่ในเบราว์เซอร์ของผู้ใช้แต่ละเครื่อง ไม่ sync ข้ามอุปกรณ์

const PREFIX = 'gpx:v1:'

export const KEYS = {
  products: `${PREFIX}products`,
  banners: `${PREFIX}banners`,
  categories: `${PREFIX}categories`,
  coupons: `${PREFIX}coupons`,
  homeSections: `${PREFIX}home-sections`,
  users: `${PREFIX}users`,
  orders: `${PREFIX}orders`,
  notifications: `${PREFIX}notifications`,
  cart: `${PREFIX}cart`,
  session: `${PREFIX}session`,
  adminSession: `${PREFIX}admin-session`,
  seeded: `${PREFIX}seeded`,
  catalogVersion: `${PREFIX}catalog-version`,
  adminProductView: `${PREFIX}admin-product-view`,
} as const

/** อ่านค่าจาก localStorage แบบปลอดภัย — คืน fallback เมื่ออ่านไม่ได้ */
export function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/** เขียนค่าลง localStorage — คืน false เมื่อเขียนไม่สำเร็จ (เช่น พื้นที่เต็ม) */
export function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/** ล้างข้อมูลทั้งหมดของระบบ (ใช้ในปุ่มรีเซ็ตข้อมูลตัวอย่าง) */
export function clearAll(): void {
  try {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k))
  } catch {
    /* เบราว์เซอร์บล็อก storage — ข้ามไป */
  }
}

/**
 * แฮชรหัสผ่านแบบง่าย (djb2)
 * คำเตือน: ใช้เพื่อการสาธิตเท่านั้น ไม่ปลอดภัยพอสำหรับระบบจริง
 * ระบบจริงต้องตรวจสอบรหัสผ่านฝั่งเซิร์ฟเวอร์ด้วย bcrypt/argon2
 */
export function hashPassword(password: string): string {
  let h = 5381
  for (let i = 0; i < password.length; i++) {
    h = ((h << 5) + h + password.charCodeAt(i)) | 0
  }
  return `demo$${(h >>> 0).toString(36)}`
}
