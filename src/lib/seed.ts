// ── ข้อมูลตัวอย่างที่ใส่ให้อัตโนมัติเมื่อเปิดเว็บครั้งแรก ─────────────
// ทำให้เว็บมีสินค้า แบนเนอร์ สมาชิก และออเดอร์ย้อนหลังให้ดูทันที
import type { Banner, Coupon, Order, Product, User, AppNotification, OrderStatus } from '../types'
import { hashPassword } from './storage'
import { todayKey } from './format'
import { orderCode } from './id'

const img = (name: string) => `images/products/${name}`
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

export const seedProducts: Product[] = [
  {
    id: 'p01', slug: 'team-polo', name: 'เสื้อโปโลทีมแข่ง Grandprix 2026', sku: 'GP-101',
    category: 'เสื้อผ้า',
    description:
      'เสื้อโปโลทีมแข่งรุ่นทางการประจำฤดูกาล 2026 ตัดเย็บจากผ้าพิเก้ระบายอากาศดี น้ำหนักเบา แห้งเร็ว ปักโลโก้ทีมที่อกซ้ายและแขนขวา พร้อมแถบลายธงตราหมากรุกที่ปลายแขน สวมใส่สบายทั้งวันสนาม\n\nมีให้เลือกไซซ์ S ถึง 3XL ซักเครื่องได้ สีไม่ตก',
    images: [img('polo-1.svg'), img('polo-2.svg'), img('polo-3.svg')],
    price: 1590, salePrice: 1290, stock: 48, recommended: true, active: true, createdAt: isoOffset(-60),
  },
  {
    id: 'p02', slug: 'racing-cap', name: 'หมวกแก๊ปทีมแข่ง รุ่นนักขับ', sku: 'GP-102',
    category: 'หมวกและกระเป๋า',
    description:
      'หมวกแก๊ป 6 ชิ้นทรงคลาสสิกเหมือนที่นักขับใส่บนโพเดียม ปักนูนโลโก้ด้านหน้า ปรับขนาดด้านหลังด้วยตัวล็อกโลหะ ซับในดูดซับเหงื่อ\n\nฟรีไซซ์ ปรับได้รอบศีรษะ 55–60 ซม.',
    images: [img('cap-1.svg'), img('cap-2.svg'), img('cap-3.svg')],
    price: 890, salePrice: 690, stock: 120, recommended: true, active: true, createdAt: isoOffset(-58),
  },
  {
    id: 'p03', slug: 'graphic-tee', name: 'เสื้อยืดลายรถแข่ง Limited Edition', sku: 'GP-103',
    category: 'เสื้อผ้า',
    description:
      'เสื้อยืดคอกลมผ้าคอตตอน 100% พิมพ์ลายรถแข่งเต็มหลังด้วยระบบ DTG สีคมชัด ทนการซัก ผลิตจำนวนจำกัดเฉพาะฤดูกาลนี้เท่านั้น',
    images: [img('tee-1.svg'), img('tee-2.svg'), img('tee-3.svg')],
    price: 790, salePrice: null, stock: 86, recommended: true, active: true, createdAt: isoOffset(-50),
  },
  {
    id: 'p04', slug: 'pit-jacket', name: 'แจ็กเก็ตทีมพิทครู กันลม', sku: 'GP-104',
    category: 'เสื้อผ้า',
    description:
      'แจ็กเก็ตทีมพิทครูตัวจริง ผ้าสองชั้นกันลมกันละอองน้ำ ซิปยาวตลอดตัว กระเป๋าข้างมีซิป ปักโลโก้สปอนเซอร์รอบตัว เหมาะกับสภาพอากาศสนามกลางคืน',
    images: [img('jacket-1.svg'), img('jacket-2.svg'), img('jacket-3.svg')],
    price: 3290, salePrice: 2590, stock: 24, recommended: true, active: true, createdAt: isoOffset(-45),
  },
  {
    id: 'p05', slug: 'keychain', name: 'พวงกุญแจโลหะรูปรถแข่ง', sku: 'GP-105',
    category: 'ของที่ระลึก',
    description:
      'พวงกุญแจโลหะชุบเงาขัดมัน ขึ้นรูปเป็นรถแข่งสามมิติ ด้านหลังสลักโลโก้ Grandprix พร้อมกล่องของขวัญ เหมาะเป็นของฝาก',
    images: [img('keychain-1.svg'), img('keychain-2.svg'), img('keychain-3.svg')],
    price: 350, salePrice: 259, stock: 200, recommended: true, active: true, createdAt: isoOffset(-40),
  },
  {
    id: 'p06', slug: 'tumbler', name: 'แก้วเก็บความเย็นสแตนเลส 600 มล.', sku: 'GP-106',
    category: 'ของใช้',
    description:
      'แก้วสแตนเลสสองชั้นสุญญากาศ เก็บความเย็นได้นาน 12 ชั่วโมง เก็บความร้อน 6 ชั่วโมง ฝาเกลียวกันหก พ่นสีแบรนด์พร้อมโลโก้เลเซอร์',
    images: [img('tumbler-1.svg'), img('tumbler-2.svg'), img('tumbler-3.svg')],
    price: 1190, salePrice: 950, stock: 64, recommended: true, active: true, createdAt: isoOffset(-38),
  },
  {
    id: 'p07', slug: 'diecast-143', name: 'โมเดลรถแข่ง Diecast สเกล 1:43', sku: 'GP-107',
    category: 'ของสะสม',
    description:
      'โมเดลรถแข่งไดคาสต์สเกล 1:43 รายละเอียดสูง ลายสปอนเซอร์ตรงตามรถแข่งจริงประจำฤดูกาล ฐานอะคริลิกใสพร้อมป้ายชื่อนักขับ ผลิตจำนวนจำกัด',
    images: [img('diecast-1.svg'), img('diecast-2.svg'), img('diecast-3.svg')],
    price: 2490, salePrice: 1990, stock: 18, recommended: true, active: true, createdAt: isoOffset(-35),
  },
  {
    id: 'p08', slug: 'umbrella', name: 'ร่มพับทีมแข่ง กันยูวี', sku: 'GP-108',
    category: 'ของใช้',
    description:
      'ร่มพับ 3 ตอน ผ้าเคลือบกันยูวี UPF 50+ โครงไฟเบอร์กลาสทนลม เปิด-ปิดอัตโนมัติ พร้อมซองใส่สีเดียวกัน พกติดกระเป๋าไปสนามได้สะดวก',
    images: [img('umbrella-1.svg'), img('umbrella-2.svg'), img('umbrella-3.svg')],
    price: 690, salePrice: null, stock: 95, recommended: false, active: true, createdAt: isoOffset(-30),
  },
  {
    id: 'p09', slug: 'sling-bag', name: 'กระเป๋าสะพายข้างทีมแข่ง', sku: 'GP-109',
    category: 'หมวกและกระเป๋า',
    description:
      'กระเป๋าสะพายข้างผ้าโพลีเอสเตอร์กันน้ำ ช่องหลักใส่ของได้จุ ช่องหน้ามีซิปสำหรับมือถือและกระเป๋าสตางค์ สายปรับระดับได้ แผ่นสะท้อนแสงด้านหน้า',
    images: [img('bag-1.svg'), img('bag-2.svg'), img('bag-3.svg')],
    price: 1290, salePrice: 990, stock: 42, recommended: true, active: true, createdAt: isoOffset(-28),
  },
  {
    id: 'p10', slug: 'race-gloves', name: 'ถุงมือขับรถ รุ่นซ้อม', sku: 'GP-110',
    category: 'อุปกรณ์',
    description:
      'ถุงมือขับรถหนังสังเคราะห์ผสมผ้ายืด ฝ่ามือปั๊มลายกันลื่น ตะเข็บเย็บสองชั้น ระบายอากาศที่หลังมือ เหมาะกับการซ้อมและขับสนาม',
    images: [img('gloves-1.svg'), img('gloves-2.svg'), img('gloves-3.svg')],
    price: 1590, salePrice: null, stock: 30, recommended: false, active: true, createdAt: isoOffset(-24),
  },
  {
    id: 'p11', slug: 'fan-scarf', name: 'ผ้าพันคอเชียร์ทีม', sku: 'GP-111',
    category: 'ของที่ระลึก',
    description:
      'ผ้าพันคอถักลายทีมสองด้าน เนื้อนุ่มไม่คัน ปลายทั้งสองข้างมีพู่ ยาว 140 ซม. เหมาะสำหรับเชียร์ในสนามและเก็บสะสม',
    images: [img('scarf-1.svg'), img('scarf-2.svg'), img('scarf-3.svg')],
    price: 590, salePrice: 450, stock: 150, recommended: false, active: true, createdAt: isoOffset(-20),
  },
  {
    id: 'p12', slug: 'sticker-set', name: 'ชุดสติกเกอร์ทีมแข่ง 24 ชิ้น', sku: 'GP-112',
    category: 'ของที่ระลึก',
    description:
      'ชุดสติกเกอร์ไวนิลกันน้ำ 24 ลาย ทั้งโลโก้ทีม หมายเลขนักขับ และลายธงตราหมากรุก ติดโน้ตบุ๊ก หมวกกันน็อก หรือกระจกรถได้ ไม่ทิ้งคราบกาว',
    images: [img('sticker-1.svg'), img('sticker-2.svg'), img('sticker-3.svg')],
    price: 290, salePrice: 199, stock: 300, recommended: false, active: true, createdAt: isoOffset(-14),
  },
]

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
      const p = products[productIndex]
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
