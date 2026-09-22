/**
 * สร้าง URL ของไฟล์ใน public/ ให้ถูกต้องทั้งตอน dev และตอน deploy
 * (บน GitHub Pages ทุกไฟล์อยู่ใต้ /gps/ ตามค่า base ใน vite.config.ts)
 * ถ้าเป็น URL เต็มหรือ data URI อยู่แล้วจะคืนค่าเดิม
 */
export function asset(path: string): string {
  if (/^(https?:|data:|blob:)/.test(path)) return path
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}
