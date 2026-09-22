// ── ตัวสร้างรหัสต่าง ๆ ──────────────────────────────────────────────

/** สร้าง id แบบสุ่มสั้น ๆ พร้อมคำนำหน้า */
export function uid(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${Date.now().toString(36)}${rand}`
}

/**
 * สร้างเลขที่ออเดอร์รูปแบบ GP + ปี พ.ศ. 2 หลัก + เดือน + ลำดับ 4 หลัก
 * เช่น GP26090001
 */
export function orderCode(sequence: number, date: Date = new Date()): string {
  const be = (date.getFullYear() + 543) % 100
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `GP${String(be).padStart(2, '0')}${month}${String(sequence).padStart(4, '0')}`
}
