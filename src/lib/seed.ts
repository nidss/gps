// ── ข้อมูลตัวอย่างที่ใส่ให้อัตโนมัติเมื่อเปิดเว็บครั้งแรก ─────────────
// ทำให้เว็บมีสินค้า แบนเนอร์ สมาชิก และออเดอร์ย้อนหลังให้ดูทันที
import type { Banner, Category, Coupon, Order, Product, User, AppNotification, OrderStatus } from '../types'
import { hashPassword } from './storage'
import { todayKey } from './format'
import { orderCode } from './id'
import { seedProducts } from './products.data'

export { seedProducts }

const ban = (name: string) => `images/banners/${name}`

/** เลื่อนวันจากวันนี้ (ลบ = ย้อนหลัง) แล้วคืนค่าเป็น YYYY-MM-DD */
function dayOffset(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return todayKey(d)
}

/** เลื่อนวันจากวันนี้แล้วคืนค่าเป็น ISO timestamp */
function isoOffset(days: number, hour = 10): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, (Math.abs(days) * 13) % 60, 0, 0)
  return d.toISOString()
}

/**
 * สร้างรายการหมวดหมู่จากชื่อหมวดที่สินค้าใช้อยู่ เรียงตามตัวอักษร (ลำดับเดิมก่อนมีหน้าจัดการหมวดหมู่)
 * ใช้ทั้งตอนใส่ข้อมูลตั้งต้น และตอนผู้ใช้เดิมที่ยังไม่มีข้อมูลหมวดหมู่ในเครื่อง
 */
export function categoriesFromProducts(products: Product[]): Category[] {
  return Array.from(new Set(products.map((p) => p.category)))
    .filter((name) => name.trim() !== '')
    .sort()
    .map((name, i) => ({ id: `c${String(i + 1).padStart(2, '0')}`, name, sortOrder: i + 1, active: true }))
}

export const seedCategories: Category[] = categoriesFromProducts(seedProducts)

export const seedBanners: Banner[] = [
  {
    id: 'b01', title: 'คอลเลกชันทางการ ฤดูกาล 2026',
    subtitle: 'สินค้าพรีเมี่ยมลิขสิทธิ์แท้จากสนาม Grandprix ส่งตรงถึงบ้าน',
    image: ban('banner-1.svg'), ctaLabel: 'ช้อปคอลเลกชันใหม่', ctaLink: '/products',
    startDate: dayOffset(-30), endDate: dayOffset(90), sortOrder: 1, active: true,
  },
  {
    id: 'b02', title: 'PODIUM SERIES ลดสูงสุด 30%',
    subtitle: 'รุ่นพิเศษจำนวนจำกัด เฉพาะช่วงเรซวีคเท่านั้น',
    image: ban('banner-2.svg'), ctaLabel: 'ดูสินค้าลดราคา', ctaLink: '/products',
    startDate: dayOffset(-10), endDate: dayOffset(45), sortOrder: 2, active: true,
  },
  {
    id: 'b03', title: 'ชุดทีมพิทครูมาใหม่',
    subtitle: 'แจ็กเก็ตและเสื้อโปโลสเปกเดียวกับทีมงานในสนามจริง',
    image: ban('banner-3.svg'), ctaLabel: 'ดูรายละเอียด', ctaLink: '/product/p04',
    startDate: dayOffset(-5), endDate: dayOffset(60), sortOrder: 3, active: true,
  },
  {
    id: 'b04', title: 'RACE WEEK DEALS (หมดเวลาแล้ว)',
    subtitle: 'แบนเนอร์ตัวอย่างที่เลยช่วงวันที่แสดง จึงไม่ขึ้นบนหน้าแรก',
    image: ban('banner-4.svg'), ctaLabel: 'ดูสินค้า', ctaLink: '/products',
    startDate: dayOffset(-60), endDate: dayOffset(-20), sortOrder: 4, active: true,
  },
]

export const seedCoupons: Coupon[] = [
  { code: 'GP10', type: 'percent', value: 10, description: 'ลด 10% ทั้งร้าน', minSpend: 0, expiresAt: dayOffset(60), active: true },
  { code: 'GP100', type: 'amount', value: 100, description: 'ลด 100 บาท เมื่อซื้อครบ 500 บาท', minSpend: 500, expiresAt: dayOffset(45), active: true },
  { code: 'FREESHIP', type: 'freeship', value: 0, description: 'ส่งฟรีไม่มีขั้นต่ำ', minSpend: 0, expiresAt: dayOffset(30), active: true },
  { code: 'EXPIRED', type: 'percent', value: 50, description: 'คูปองตัวอย่างที่หมดอายุแล้ว', minSpend: 0, expiresAt: dayOffset(-3), active: true },
]

export const seedUsers: User[] = [
  {
    id: 'u01', email: 'demo@grandprix.test', passwordHash: hashPassword('demo1234'),
    firstName: 'สมชาย', lastName: 'ใจเร็ว', phone: '081-234-5678',
    shipping: {
      name: 'สมชาย ใจเร็ว', phone: '081-234-5678', line1: '99/12 หมู่บ้านสปีดเวย์ ซอยพหลโยธิน 32',
      subDistrict: 'จันทรเกษม', district: 'จตุจักร', province: 'กรุงเทพมหานคร', postcode: '10900',
    },
    tax: {
      isCompany: false, taxId: '1100800123456', branch: 'สำนักงานใหญ่',
      address: {
        name: 'สมชาย ใจเร็ว', phone: '081-234-5678', line1: '99/12 หมู่บ้านสปีดเวย์ ซอยพหลโยธิน 32',
        subDistrict: 'จันทรเกษม', district: 'จตุจักร', province: 'กรุงเทพมหานคร', postcode: '10900',
      },
    },
    createdAt: isoOffset(-90),
  },
  {
    id: 'u02', email: 'pitcrew@grandprix.test', passwordHash: hashPassword('demo1234'),
    firstName: 'ณัฐพล', lastName: 'ตั้งสถิตย์', phone: '089-876-5432',
    shipping: {
      name: 'ณัฐพล ตั้งสถิตย์', phone: '089-876-5432', line1: '456 อาคารเรซซิ่งทาวเวอร์ ชั้น 12 ถนนสุขุมวิท',
      subDistrict: 'คลองเตย', district: 'คลองเตย', province: 'กรุงเทพมหานคร', postcode: '10110',
    },
    tax: {
      isCompany: true, taxId: '0105561000123', branch: 'สำนักงานใหญ่',
      address: {
        name: 'บริษัท พิทครู เรซซิ่ง จำกัด', phone: '02-123-4567', line1: '456 อาคารเรซซิ่งทาวเวอร์ ชั้น 12 ถนนสุขุมวิท',
        subDistrict: 'คลองเตย', district: 'คลองเตย', province: 'กรุงเทพมหานคร', postcode: '10110',
      },
    },
    createdAt: isoOffset(-70),
  },
  {
    id: 'u03', email: 'fan@grandprix.test', passwordHash: hashPassword('demo1234'),
    firstName: 'ปิยะดา', lastName: 'ศรีสนาม', phone: '092-555-1212',
    shipping: {
      name: 'ปิยะดา ศรีสนาม', phone: '092-555-1212', line1: '12/7 ถนนนิมมานเหมินท์ ซอย 9',
      subDistrict: 'สุเทพ', district: 'เมืองเชียงใหม่', province: 'เชียงใหม่', postcode: '50200',
    },
    tax: null,
    createdAt: isoOffset(-30),
  },
]

export const seedNotifications: AppNotification[] = [
  {
    id: 'n01', kind: 'promo', title: 'คูปอง GP10 ใช้ได้แล้ววันนี้',
    message: 'ลด 10% ทั้งร้านไม่มีขั้นต่ำ ใส่โค้ด GP10 ที่หน้าชำระเงิน', link: '/products',
    read: false, createdAt: isoOffset(-1, 9),
  },
  {
    id: 'n02', kind: 'promo', title: 'PODIUM SERIES ลดสูงสุด 30%',
    message: 'รุ่นพิเศษจำนวนจำกัดเฉพาะช่วงเรซวีค รีบก่อนของหมด', link: '/products',
    read: false, createdAt: isoOffset(-2, 15),
  },
  {
    id: 'n03', kind: 'system', title: 'ยินดีต้อนรับสู่ Grandprix Online',
    message: 'ร้านค้าสินค้าพรีเมี่ยมลิขสิทธิ์แท้ประจำการแข่งขัน Grandprix', link: null,
    read: true, createdAt: isoOffset(-5, 11),
  },
]

/** สร้างออเดอร์ย้อนหลังเพื่อให้หน้า dashboard มีตัวเลขให้ดูทันที */
export function buildSeedOrders(products: Product[], users: User[]): Order[] {
  // [วันย้อนหลัง, ดัชนีสมาชิก, [ [ดัชนีสินค้า, จำนวน], ... ], สถานะ, ขอใบกำกับภาษี]
  const plan: Array<[number, number, Array<[number, number]>, OrderStatus, boolean]> = [
    [-13, 0, [[0, 2], [4, 1]], 'completed', true],
    [-12, 2, [[1, 1]], 'completed', false],
    [-11, 1, [[3, 1], [5, 2]], 'completed', true],
    [-9, 0, [[6, 1]], 'completed', false],
    [-8, 2, [[2, 3]], 'shipped', false],
    [-6, 1, [[8, 1], [11, 2]], 'shipped', true],
    [-5, 0, [[0, 1], [1, 2], [4, 3]], 'paid', false],
    [-4, 2, [[10, 2]], 'paid', false],
    [-3, 1, [[7, 1]], 'pending', true],
    [-2, 0, [[5, 1], [9, 1]], 'pending', false],
    [-1, 2, [[1, 1], [11, 1]], 'pending', false],
    [-1, 1, [[6, 2]], 'cancelled', false],
  ]

  return plan.map((entry, index) => {
    const [days, userIndex, items, status, wantTax] = entry
    const user = users[userIndex]
    const lines = items.map(([productIndex, qty]) => {
      // วนดัชนีกลับมาต้นรายการ เผื่อจำนวนสินค้าน้อยกว่าที่แผนตัวอย่างอ้างถึง
      const p = products[productIndex % products.length]
      return {
        productId: p.id, name: p.name, sku: p.sku, image: p.images[0],
        unitPrice: p.salePrice ?? p.price, qty,
      }
    })
    const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0)
    const shippingFee = subtotal >= 1500 ? 0 : 60
    return {
      id: `o${String(index + 1).padStart(2, '0')}`,
      code: orderCode(index + 1, new Date(isoOffset(days))),
      userId: user.id,
      customerName: `${user.firstName} ${user.lastName}`,
      customerEmail: user.email,
      customerPhone: user.phone,
      lines,
      shipping: user.shipping!,
      tax: wantTax ? user.tax : null,
      couponCode: null,
      subtotal,
      discount: 0,
      shippingFee,
      total: subtotal + shippingFee,
      paymentMethod: index % 3 === 0 ? 'transfer' : index % 3 === 1 ? 'card' : 'cod',
      status,
      createdAt: isoOffset(days, 9 + (index % 9)),
    } satisfies Order
  })
}
