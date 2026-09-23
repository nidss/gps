// ── ชนิดข้อมูลกลางของระบบ Grandprix Online ──────────────────────────

/** ที่อยู่ ใช้ได้ทั้งที่อยู่จัดส่งและที่อยู่สำหรับออกใบกำกับภาษี */
export interface Address {
  /** ชื่อผู้รับ หรือชื่อผู้เสียภาษี (บุคคล/นิติบุคคล) */
  name: string
  phone: string
  line1: string
  subDistrict: string
  district: string
  province: string
  postcode: string
}

/** ข้อมูลเพิ่มเติมสำหรับการออกใบกำกับภาษี */
export interface TaxInfo {
  /** true = นิติบุคคล, false = บุคคลธรรมดา */
  isCompany: boolean
  /** เลขประจำตัวผู้เสียภาษี 13 หลัก */
  taxId: string
  /** สาขา เช่น "สำนักงานใหญ่" หรือ "สาขา 00001" */
  branch: string
  address: Address
}

export interface User {
  id: string
  email: string
  /** เดโมเท่านั้น: เก็บเป็น hash แบบง่าย ไม่ใช่ระบบรักษาความปลอดภัยจริง */
  passwordHash: string
  firstName: string
  lastName: string
  phone: string
  shipping: Address | null
  tax: TaxInfo | null
  createdAt: string
}

export interface Product {
  id: string
  name: string
  slug: string
  sku: string
  category: string
  description: string
  /** รูปภาพสินค้าได้มากกว่า 1 รูป รูปแรกคือรูปปก */
  images: string[]
  /** ราคาเต็ม (บาท) */
  price: number
  /** ราคาลด (บาท) - null คือไม่ลดราคา */
  salePrice: number | null
  /** จำนวนสินค้าคงเหลือ */
  stock: number
  /** ติ๊กเพื่อให้ขึ้นส่วน "สินค้าแนะนำ" หน้าแรก */
  recommended: boolean
  active: boolean
  createdAt: string
}

/**
 * หมวดหมู่สินค้า
 * สินค้าอ้างอิงหมวดด้วยชื่อ (Product.category) ไม่ใช่ id - เปลี่ยนชื่อหมวดแล้วต้องอัปเดตสินค้าตาม
 */
export interface Category {
  id: string
  name: string
  /** ลำดับในเมนูและปุ่มลัด เลขน้อยแสดงก่อน */
  sortOrder: number
  /** ปิด = ซ่อนจากเมนูและปุ่มลัดเท่านั้น สินค้าในหมวดยังขายและค้นหาเจอตามปกติ */
  active: boolean
}

export interface Banner {
  id: string
  title: string
  subtitle: string
  image: string
  ctaLabel: string
  ctaLink: string
  /** ช่วงวันที่ที่อนุญาตให้แสดง (รูปแบบ YYYY-MM-DD) */
  startDate: string
  endDate: string
  /** ลำดับการแสดงผล เลขน้อยแสดงก่อน */
  sortOrder: number
  active: boolean
  /**
   * true = แสดงรูปล้วน ไม่มีหัวข้อ คำโปรย ปุ่ม และแถบไล่สีทับ (สำหรับรูปที่ออกแบบข้อความมาในรูปแล้ว)
   * ทั้งรูปจะกดไปที่ ctaLink แทนปุ่ม - ไม่มีฟิลด์นี้ (ข้อมูลเก่า) ถือว่าแสดงข้อความตามปกติ
   */
  hideText?: boolean
}

/** ชนิดของ section บนหน้าแรก (ใต้ hero banner) */
export type HomeSectionKind = 'categories' | 'coupon' | 'products'

/** แหล่งสินค้าของ section ชนิด products */
export type ProductSource = 'recommended' | 'sale' | 'new' | 'category' | 'manual'

/**
 * section บนหน้าแรก - มีฟิลด์ครบทุกตัวเสมอไม่ว่าชนิดไหน
 * ฟอร์มหลังบ้านจึงสลับชนิดไปมาได้โดยไม่ต้องแปลงโครงข้อมูล
 */
export interface HomeSection {
  id: string
  kind: HomeSectionKind
  /** หัวข้อที่แสดง (ชนิด coupon ใช้เป็นป้ายเล็กเหนือข้อความ) */
  title: string
  /** ลำดับการแสดงผล เลขน้อยแสดงก่อน */
  sortOrder: number
  active: boolean
  /** ใช้เมื่อ kind = products */
  source: ProductSource
  /** ใช้เมื่อ source = category */
  categoryId: string | null
  /** ใช้เมื่อ source = manual - แสดงตามลำดับในอาร์เรย์ */
  productIds: string[]
  /** จำนวนสินค้าสูงสุดที่แสดง */
  limit: number
  /** ใช้เมื่อ kind = coupon */
  couponCode: string
}

export type CouponType = 'percent' | 'amount' | 'freeship'

export interface Coupon {
  code: string
  type: CouponType
  /** percent = เปอร์เซ็นต์, amount = จำนวนบาท, freeship = ไม่ใช้ค่านี้ */
  value: number
  description: string
  /** ยอดซื้อขั้นต่ำที่ใช้คูปองได้ */
  minSpend: number
  expiresAt: string
  active: boolean
}

export interface CartItem {
  productId: string
  qty: number
}

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled'

export type PaymentMethod = 'transfer' | 'card' | 'cod'

export interface OrderLine {
  productId: string
  name: string
  sku: string
  image: string
  /** ราคาต่อชิ้นที่ใช้จริงตอนสั่งซื้อ */
  unitPrice: number
  qty: number
}

export interface Order {
  id: string
  /** เลขที่ออเดอร์ที่ลูกค้าเห็น เช่น GP26090001 */
  code: string
  userId: string | null
  customerName: string
  customerEmail: string
  customerPhone: string
  lines: OrderLine[]
  shipping: Address
  /** ข้อมูลใบกำกับภาษี - null คือไม่ขอออกใบกำกับภาษี */
  tax: TaxInfo | null
  couponCode: string | null
  /** ยอดรวมสินค้าก่อนหักส่วนลด */
  subtotal: number
  discount: number
  shippingFee: number
  /** ยอดสุทธิที่ต้องชำระ (รวม VAT แล้ว) */
  total: number
  paymentMethod: PaymentMethod
  status: OrderStatus
  createdAt: string
  /** ข้อมูลพัสดุจากผู้ให้บริการขนส่ง - ไม่มี/null คือยังไม่ได้ส่งพัสดุ (ออเดอร์เก่าก่อนมีระบบขนส่งไม่มีฟิลด์นี้) */
  shipment?: Shipment | null
}

// ── การจัดส่ง ───────────────────────────────────────────────────────

/**
 * สถานะพัสดุ (ใช้ชุดเดียวกันทุกผู้ให้บริการ - adapter ของแต่ละเจ้าต้องแปลงสถานะของตัวเองมาเป็นชุดนี้)
 * booking = สั่งส่งแล้วแต่ยังรอเลขพัสดุจากผู้ให้บริการ
 */
export type ShipmentStatus =
  | 'booking' | 'created' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed'

/** บริษัทขนส่งที่รับพัสดุ */
export type CarrierId = 'thaipost' | 'flash' | 'kex' | 'jt'

export interface ShipmentEvent {
  status: ShipmentStatus
  description: string
  location: string
  at: string
}

export interface Shipment {
  /** id ของผู้ให้บริการใน lib/shipping.ts (ตัวเชื่อมระบบ อาจดูแลได้หลายบริษัทขนส่ง) */
  provider: string
  /** บริษัทขนส่งที่รับพัสดุ - พัสดุที่สร้างก่อนมีฟิลด์นี้ไม่มีค่า ใช้ carrierOf() ใน lib/shipping.ts อ่านแทน */
  carrier?: CarrierId
  /** เลขพัสดุ - ว่างระหว่างสถานะ booking */
  trackingNo: string
  status: ShipmentStatus
  /** ประวัติการเคลื่อนไหวของพัสดุ เก่าสุดก่อน */
  events: ShipmentEvent[]
  createdAt: string
  updatedAt: string
  /** เวลาที่จะถามสถานะจากผู้ให้บริการครั้งถัดไป - null คือจบแล้ว ไม่ต้องถามอีก */
  nextCheckAt: string | null
}

export interface AppNotification {
  id: string
  title: string
  message: string
  link: string | null
  read: boolean
  createdAt: string
  kind: 'promo' | 'order' | 'system'
}

// ── แชท ─────────────────────────────────────────────────────────────
// ข้อความเก็บใน localStorage จึงเห็นกันได้เฉพาะในเบราว์เซอร์เดียวกัน (ระบบสาธิต)

export interface ChatMessage {
  id: string
  from: 'customer' | 'bot' | 'admin'
  text: string
  createdAt: string
}

/** ห้องแชท 1 ห้องต่อลูกค้า 1 คน (สมาชิกหรือผู้เยี่ยมชม) */
export interface ChatThread {
  id: string
  /** user.id ของสมาชิก หรือ id ของผู้เยี่ยมชม (ChatGuest.id) */
  ownerId: string
  /** null = ผู้เยี่ยมชมที่ไม่ได้ล็อกอิน */
  userId: string | null
  name: string
  messages: ChatMessage[]
  updatedAt: string
  /** เวลาที่ลูกค้า/แอดมินเปิดอ่านล่าสุด ใช้นับข้อความที่ยังไม่อ่าน */
  customerReadAt: string
  adminReadAt: string
}

/** ผู้เยี่ยมชมที่เริ่มแชทโดยไม่ได้ล็อกอิน */
export interface ChatGuest {
  id: string
  name: string
}

/** คำถาม-คำตอบของบอทตอบอัตโนมัติ */
export interface ChatFaq {
  id: string
  /** คำถามที่แสดงเป็นปุ่มคำถามด่วนในหน้าต่างแชท */
  question: string
  /** ข้อความลูกค้ามีคำใดคำหนึ่งในนี้ บอทจะตอบด้วยคำตอบของข้อนี้ */
  keywords: string[]
  answer: string
  sortOrder: number
  active: boolean
}
