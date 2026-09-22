// ── ฟังก์ชันจัดรูปแบบตัวเลขและวันที่แบบไทย ──────────────────────────

/** จัดรูปแบบเงินบาท เช่น 1,290 ฿ */
export function baht(value: number): string {
  return `${value.toLocaleString('th-TH', { maximumFractionDigits: 2 })} ฿`
}

/** จัดรูปแบบตัวเลขมีคอมมา */
export function num(value: number): string {
  return value.toLocaleString('th-TH', { maximumFractionDigits: 2 })
}

/** วันที่แบบไทย เช่น 22 ก.ย. 2569 */
export function thaiDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** วันที่พร้อมเวลา เช่น 22 ก.ย. 2569 14:30 */
export function thaiDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return `${d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} ${d.toLocaleTimeString(
    'th-TH',
    { hour: '2-digit', minute: '2-digit' },
  )}`
}

/** คืนวันที่วันนี้ในรูปแบบ YYYY-MM-DD ตามเวลาท้องถิ่น */
export function todayKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** เปอร์เซ็นต์ส่วนลดจากราคาเต็มเทียบราคาลด */
export function discountPercent(price: number, salePrice: number | null): number {
  if (!salePrice || salePrice >= price || price <= 0) return 0
  return Math.round(((price - salePrice) / price) * 100)
}

/** ราคาที่ใช้จริง (ราคาลดถ้ามี ไม่งั้นราคาเต็ม) */
export function effectivePrice(price: number, salePrice: number | null): number {
  return salePrice && salePrice > 0 && salePrice < price ? salePrice : price
}
