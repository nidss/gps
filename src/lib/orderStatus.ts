// ── ป้ายกำกับสถานะออเดอร์และวิธีชำระเงินเป็นภาษาไทย ──────────────────
import type { OrderStatus, PaymentMethod } from '../types'

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'รอชำระเงิน',
  paid: 'ชำระเงินแล้ว',
  shipped: 'จัดส่งแล้ว',
  completed: 'สำเร็จ',
  cancelled: 'ยกเลิก',
}

export const ORDER_STATUS_TONE: Record<OrderStatus, 'amber' | 'blue' | 'ink' | 'green' | 'slate'> = {
  pending: 'amber',
  paid: 'blue',
  shipped: 'ink',
  completed: 'green',
  cancelled: 'slate',
}

/** ลำดับสถานะที่ใช้ในตัวเลือกของหน้า admin */
export const ORDER_STATUS_ORDER: OrderStatus[] = ['pending', 'paid', 'shipped', 'completed', 'cancelled']

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  transfer: 'โอนเงินผ่านธนาคาร',
  card: 'บัตรเครดิต/เดบิต',
  cod: 'เก็บเงินปลายทาง',
}
