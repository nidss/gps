// ── ระบบจัดส่ง: ตัวกลางเชื่อมผู้ให้บริการขนส่ง ───────────────────────
//
// หน้าจอและ store คุยกับขนส่งผ่าน interface ShippingProvider เท่านั้น
// จะเปลี่ยนไปใช้ขนส่งจริง (Kerry Express, Flash Express, ไปรษณีย์ไทย ฯลฯ) ให้เขียน adapter ใหม่
// ที่แปลงสถานะของเจ้านั้นมาเป็น ShipmentStatus แล้วเพิ่มลง PROVIDERS และเปลี่ยน ACTIVE_PROVIDER_ID
//
// ข้อจำกัด: เว็บนี้เป็น static site ไม่มี server จึงเก็บ API key ของขนส่งไว้ในโค้ดฝั่ง client ไม่ได้
// และรับ webhook จากขนส่งไม่ได้ ขนส่งจริงต้องมี backend เล็ก ๆ (เช่น serverless function)
// เป็นตัวกลาง - adapter ฝั่งนี้จะเรียก backend นั้นแทนการเรียก API ของขนส่งตรง ๆ
// ตอนนี้จึงใช้ขนส่งจำลองที่ขยับสถานะพัสดุเองตามเวลา เพื่อสาธิตการอัปเดตแบบ real-time
import type { CarrierId, Order, OrderStatus, Shipment, ShipmentEvent, ShipmentStatus } from '../types'

export interface ShippingProvider {
  id: string
  name: string
  /** true = ไม่ได้ต่อขนส่งจริง */
  simulated: boolean
  /** ขอเลขพัสดุ/นัดเข้ารับสำหรับออเดอร์ - คืนพัสดุสถานะ created ขึ้นไป */
  createShipment(order: Order, now: Date): Promise<Shipment>
  /** ถามสถานะล่าสุดของพัสดุ - คืนพัสดุเดิมพร้อม nextCheckAt ใหม่ถ้ายังไม่มีอะไรเปลี่ยน */
  track(shipment: Shipment, order: Order, now: Date): Promise<Shipment>
}

// ── บริษัทขนส่ง ─────────────────────────────────────────────────────
// ผู้ให้บริการ (ShippingProvider) คือตัวเชื่อมระบบ ส่วนบริษัทขนส่งคือเจ้าที่รับพัสดุจริง
// แยกกันเพราะบริการรวมขนส่ง (aggregator) เจ้าเดียวส่งได้หลายบริษัท

export const CARRIERS: Array<{ id: CarrierId; name: string }> = [
  { id: 'thaipost', name: 'ไปรษณีย์ไทย' },
  { id: 'flash', name: 'Flash Express' },
  { id: 'kex', name: 'KEX Express' },
  { id: 'jt', name: 'J&T Express' },
]

export const CARRIER_NAME: Record<CarrierId, string> = Object.fromEntries(
  CARRIERS.map((c) => [c.id, c.name]),
) as Record<CarrierId, string>

/** บริษัทขนส่งที่ใช้เมื่อเปลี่ยนสถานะเป็น "จัดส่งแล้ว" จากตารางโดยไม่ได้เลือก */
export const DEFAULT_CARRIER: CarrierId = 'thaipost'

/** ตัวเลขในเลขออเดอร์ ใช้สร้างค่าที่คงที่ต่อออเดอร์ */
function orderDigits(order: Order): string {
  return order.code.replace(/\D/g, '')
}

/** บริษัทขนส่งของพัสดุ - พัสดุรุ่นแรกที่ยังไม่มีฟิลด์ carrier ให้เลือกตามเลขออเดอร์แบบคงที่ */
export function carrierOf(order: Order): CarrierId | null {
  if (!order.shipment) return null
  return order.shipment.carrier ?? CARRIERS[Number(orderDigits(order)) % CARRIERS.length].id
}

// ── ป้ายกำกับ ───────────────────────────────────────────────────────

export const SHIPMENT_STATUS_LABEL: Record<ShipmentStatus, string> = {
  booking: 'กำลังขอเลขพัสดุ',
  created: 'รอขนส่งเข้ารับ',
  picked_up: 'ขนส่งเข้ารับแล้ว',
  in_transit: 'อยู่ระหว่างขนส่ง',
  out_for_delivery: 'กำลังนำส่ง',
  delivered: 'ส่งถึงผู้รับแล้ว',
  failed: 'นำส่งไม่สำเร็จ',
}

export const SHIPMENT_STATUS_TONE: Record<ShipmentStatus, 'amber' | 'blue' | 'ink' | 'green' | 'slate' | 'red'> = {
  booking: 'slate',
  created: 'amber',
  picked_up: 'blue',
  in_transit: 'blue',
  out_for_delivery: 'ink',
  delivered: 'green',
  failed: 'red',
}

/**
 * ตัวเลือกของฟิลเตอร์สถานะจัดส่ง
 * none = ยังไม่มีพัสดุ ส่วน booking นับรวมกับ created เพราะเป็นแค่จังหวะสั้น ๆ ระหว่างรอเลขพัสดุ
 */
export type ShipmentFilter = 'none' | Exclude<ShipmentStatus, 'booking'>

export const SHIPMENT_FILTER_OPTIONS: Array<{ value: ShipmentFilter; label: string }> = [
  { value: 'none', label: 'ยังไม่จัดส่ง' },
  { value: 'created', label: SHIPMENT_STATUS_LABEL.created },
  { value: 'picked_up', label: SHIPMENT_STATUS_LABEL.picked_up },
  { value: 'in_transit', label: SHIPMENT_STATUS_LABEL.in_transit },
  { value: 'out_for_delivery', label: SHIPMENT_STATUS_LABEL.out_for_delivery },
  { value: 'delivered', label: SHIPMENT_STATUS_LABEL.delivered },
  { value: 'failed', label: SHIPMENT_STATUS_LABEL.failed },
]

export function shipmentFilterKey(order: Order): ShipmentFilter {
  const status = order.shipment?.status
  if (!status) return 'none'
  return status === 'booking' ? 'created' : status
}

// ── ขนส่งจำลอง ──────────────────────────────────────────────────────

const SIM_ID = 'simulated'

/** ช่วงเวลาระหว่างการขยับสถานะแต่ละขั้นของขนส่งจำลอง (มิลลิวินาที) - สั้นพอให้เห็นการอัปเดตสด ๆ */
const SIM_STEP_MIN_MS = 15_000
const SIM_STEP_MAX_MS = 35_000

/** โอกาสที่ขนส่งจำลองจะนำส่งไม่สำเร็จในรอบแรก แล้วนัดส่งใหม่ */
const SIM_FAIL_CHANCE = 0.15

function simDelay(): number {
  return SIM_STEP_MIN_MS + Math.random() * (SIM_STEP_MAX_MS - SIM_STEP_MIN_MS)
}

/**
 * เลขพัสดุจำลองรูปแบบคล้ายของแต่ละบริษัท คงที่ตามเลขออเดอร์ - สองแท็บสร้างพร้อมกันก็ได้เลขเดียวกัน
 * ขึ้นต้นด้วย SIM ทุกเจ้า ให้รู้ว่าไม่ใช่เลขพัสดุจริง
 */
function simTrackingNo(order: Order, carrier: CarrierId): string {
  const n = orderDigits(order)
  switch (carrier) {
    case 'thaipost': return `SIM${n}TH`
    case 'flash': return `SIMF${n}A`
    case 'kex': return `SIMK${n}`
    case 'jt': return `SIMJ${n}`
  }
}

/** ขั้นถัดไปของพัสดุจำลอง นับจากประวัติที่มีอยู่ - null คือจบแล้ว */
function simNextEvent(shipment: Shipment, order: Order): Omit<ShipmentEvent, 'at'> | null {
  const { province, district } = order.shipping
  const has = (status: ShipmentStatus) => shipment.events.filter((e) => e.status === status).length
  switch (shipment.status) {
    case 'created':
      return { status: 'picked_up', description: 'ขนส่งเข้ารับพัสดุจากร้านแล้ว', location: 'Grandprix Online' }
    case 'picked_up':
      return { status: 'in_transit', description: 'พัสดุถึงศูนย์คัดแยกสินค้า', location: 'ศูนย์คัดแยก กรุงเทพฯ' }
    case 'in_transit':
      return has('in_transit') < 2
        ? { status: 'in_transit', description: 'พัสดุถึงศูนย์กระจายสินค้าปลายทาง', location: `ศูนย์กระจายสินค้า ${province}` }
        : { status: 'out_for_delivery', description: 'พนักงานกำลังนำส่งพัสดุ', location: `สาขา ${district}` }
    case 'out_for_delivery':
      return has('failed') === 0 && Math.random() < SIM_FAIL_CHANCE
        ? { status: 'failed', description: 'ติดต่อผู้รับไม่ได้ จะนำส่งใหม่อีกครั้ง', location: `สาขา ${district}` }
        : { status: 'delivered', description: 'ผู้รับได้รับพัสดุเรียบร้อยแล้ว', location: district }
    case 'failed':
      return { status: 'out_for_delivery', description: 'นำส่งพัสดุอีกครั้ง', location: `สาขา ${district}` }
    default:
      return null
  }
}

function withEvent(shipment: Shipment, event: ShipmentEvent, nextCheckAt: string | null): Shipment {
  return {
    ...shipment,
    status: event.status,
    events: [...shipment.events, event],
    updatedAt: event.at,
    nextCheckAt,
  }
}

export const simulatedProvider: ShippingProvider = {
  id: SIM_ID,
  name: 'ขนส่งจำลอง (Demo)',
  simulated: true,

  async createShipment(order, now) {
    const at = now.toISOString()
    const carrier = order.shipment?.carrier ?? DEFAULT_CARRIER
    return {
      provider: SIM_ID,
      carrier,
      trackingNo: simTrackingNo(order, carrier),
      status: 'created',
      events: [{ status: 'created', description: 'ร้านค้าสร้างเลขพัสดุและแจ้งเข้ารับ', location: 'Grandprix Online', at }],
      createdAt: at,
      updatedAt: at,
      nextCheckAt: new Date(now.getTime() + simDelay()).toISOString(),
    }
  },

  async track(shipment, order, now) {
    // ยังไม่ถึงเวลาขยับขั้นถัดไป (nextCheckAt ของขนส่งจำลองคือเวลาที่ขั้นถัดไปจะเกิด)
    if (!shipment.nextCheckAt || new Date(shipment.nextCheckAt) > now) return shipment
    const next = simNextEvent(shipment, order)
    if (!next) return { ...shipment, nextCheckAt: null }
    const done = next.status === 'delivered'
    return withEvent(
      shipment,
      { ...next, at: now.toISOString() },
      done ? null : new Date(now.getTime() + simDelay()).toISOString(),
    )
  },
}

/**
 * สร้างประวัติพัสดุย้อนหลังให้ออเดอร์ที่จัดส่งไปก่อนมีระบบขนส่ง (ข้อมูลตัวอย่างและออเดอร์เดิมในเครื่อง)
 * ทำได้เฉพาะขนส่งจำลอง - ขนส่งจริงไม่มีข้อมูลย้อนหลังของพัสดุที่ไม่ได้ส่งผ่านระบบ
 * delivered = ส่งถึงแล้ว (ออเดอร์สำเร็จ) / ไม่งั้นหยุดไว้ระหว่างทาง แล้วให้ขยับต่อแบบสด ๆ
 */
export function backfillShipment(order: Order, now: Date, delivered: boolean): Shipment {
  const base = new Date(order.createdAt).getTime()
  const hour = 3_600_000
  // เวลาในประวัติต้องไม่เลยปัจจุบัน (ออเดอร์เมื่อวานอาจยังไม่ถึงชั่วโมงที่วางไว้)
  const at = (hours: number) => new Date(Math.min(base + hours * hour, now.getTime())).toISOString()

  // ออเดอร์เก่าไม่มีข้อมูลว่าส่งกับใคร จึงกระจายไปตามเลขออเดอร์แบบคงที่
  const carrier = CARRIERS[Number(orderDigits(order)) % CARRIERS.length].id
  let shipment: Shipment = {
    provider: SIM_ID,
    carrier,
    trackingNo: simTrackingNo(order, carrier),
    status: 'created',
    events: [{ status: 'created', description: 'ร้านค้าสร้างเลขพัสดุและแจ้งเข้ารับ', location: 'Grandprix Online', at: at(20) }],
    createdAt: at(20),
    updatedAt: at(20),
    nextCheckAt: null,
  }
  // ถ้ายังไม่ส่งถึง พักไว้ที่ศูนย์คัดแยก (2 ขั้นหลังสร้าง) แล้วให้ขยับต่อเองตั้งแต่ตอนนี้
  const steps = delivered ? 5 : 2
  for (let i = 1; i <= steps; i++) {
    const next = simNextEvent(shipment, order)
    if (!next) break
    // ออเดอร์ที่สำเร็จแล้วส่งถึงในรอบแรกเสมอ ไม่สุ่มส่งไม่สำเร็จย้อนหลัง
    const event = next.status === 'failed'
      ? { status: 'delivered' as const, description: 'ผู้รับได้รับพัสดุเรียบร้อยแล้ว', location: order.shipping.district }
      : next
    shipment = withEvent(shipment, { ...event, at: at(20 + i * 10) }, null)
  }
  return { ...shipment, nextCheckAt: delivered ? null : now.toISOString() }
}

// ── ทะเบียนผู้ให้บริการ ─────────────────────────────────────────────

export const PROVIDERS: Record<string, ShippingProvider> = {
  [SIM_ID]: simulatedProvider,
}

/** ผู้ให้บริการที่ใช้สร้างพัสดุใหม่ */
export const ACTIVE_PROVIDER_ID = SIM_ID

export function getProvider(id: string): ShippingProvider | null {
  return PROVIDERS[id] ?? null
}

export function activeProvider(): ShippingProvider {
  return PROVIDERS[ACTIVE_PROVIDER_ID]
}

/** ความถี่ที่ระบบวนเช็กพัสดุที่ถึงเวลาถามสถานะ */
export const SHIPMENT_TICK_MS = 3_000

/**
 * เปลี่ยนสถานะออเดอร์ - เปลี่ยนเป็น "จัดส่งแล้ว" ครั้งแรกจะสั่งส่งพัสดุกับผู้ให้บริการ
 * (ใส่พัสดุสถานะ booking ไว้ก่อน แล้วระบบซิงก์จะไปขอเลขพัสดุจริงให้)
 */
export function withOrderStatus(
  order: Order, status: OrderStatus, carrier: CarrierId = DEFAULT_CARRIER, now: Date = new Date(),
): Order {
  if (status !== 'shipped' || order.shipment) return { ...order, status }
  const at = now.toISOString()
  return {
    ...order,
    status,
    shipment: {
      provider: ACTIVE_PROVIDER_ID,
      carrier,
      trackingNo: '',
      status: 'booking',
      events: [],
      createdAt: at,
      updatedAt: at,
      nextCheckAt: at,
    },
  }
}

/**
 * งานที่ต้องทำกับพัสดุของออเดอร์นี้ ณ เวลานี้ - null คือไม่มีอะไรต้องทำ
 * ใช้ในตัววนซิงก์ของ AppStore
 */
export function shipmentJob(order: Order, now: Date): (() => Promise<Shipment>) | null {
  const shipment = order.shipment
  if (!shipment) {
    // ออเดอร์เก่าที่ส่งไปแล้วแต่ยังไม่มีข้อมูลพัสดุ - เติมประวัติให้เมื่อใช้ขนส่งจำลองเท่านั้น
    if ((order.status === 'shipped' || order.status === 'completed') && activeProvider().simulated) {
      return async () => backfillShipment(order, now, order.status === 'completed')
    }
    return null
  }
  const provider = getProvider(shipment.provider)
  if (!provider || !shipment.nextCheckAt || new Date(shipment.nextCheckAt) > now) return null
  if (shipment.status === 'booking') return () => provider.createShipment(order, now)
  return () => provider.track(shipment, order, now)
}

/**
 * ใส่ผลจากผู้ให้บริการกลับเข้าออเดอร์ - ส่งถึงผู้รับแล้วถือว่าออเดอร์ที่ "จัดส่งแล้ว" สำเร็จ
 * คืน null เมื่อพัสดุในออเดอร์ถูกแก้ไปแล้วระหว่างรอผล (เช่น แท็บอื่นอัปเดตก่อน) จะได้ไม่เขียนทับ
 */
export function applyShipment(order: Order, before: Shipment | null | undefined, shipment: Shipment): Order | null {
  if ((order.shipment?.updatedAt ?? null) !== (before?.updatedAt ?? null)) return null
  if (before && before.updatedAt === shipment.updatedAt && before.nextCheckAt === shipment.nextCheckAt) return null
  const status = shipment.status === 'delivered' && order.status === 'shipped' ? 'completed' : order.status
  return { ...order, status, shipment }
}
