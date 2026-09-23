// ── ตัวช่วยจัดลำดับรายการที่มี sortOrder (แบนเนอร์ หมวดหมู่ section คำตอบอัตโนมัติ) ──

interface Sortable {
  id: string
  sortOrder: number
}

/** ใช้กับ Array.sort - เลขน้อยแสดงก่อน */
export function bySortOrder(a: Sortable, b: Sortable): number {
  return a.sortOrder - b.sortOrder
}

/** เลขลำดับถัดไปสำหรับรายการที่เพิ่มใหม่ (ต่อท้ายสุด) */
export function nextSortOrder(list: Sortable[]): number {
  return list.reduce((max, item) => Math.max(max, item.sortOrder), 0) + 1
}

/**
 * สลับลำดับรายการขึ้น/ลงหนึ่งขั้น
 * คืน list เดิมถ้าเลื่อนไม่ได้ (อยู่บนสุด/ล่างสุดแล้ว) เพื่อไม่ให้เกิดการเขียนข้อมูลโดยไม่จำเป็น
 */
export function moveBySortOrder<T extends Sortable>(list: T[], id: string, direction: -1 | 1): T[] {
  const sorted = [...list].sort(bySortOrder)
  const index = sorted.findIndex((item) => item.id === id)
  const target = index + direction
  if (index < 0 || target < 0 || target >= sorted.length) return list
  ;[sorted[index], sorted[target]] = [sorted[target], sorted[index]]
  // เขียนลำดับใหม่ให้เรียงต่อเนื่อง 1..n กันเลขซ้ำ
  return sorted.map((item, i) => ({ ...item, sortOrder: i + 1 }))
}
