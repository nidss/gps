// ── บอทตอบแชทอัตโนมัติ ──────────────────────────────────────────────
// จับคู่ข้อความลูกค้ากับคำถาม-คำตอบที่แอดมินตั้งไว้ (ChatFaq) ด้วยคำค้นแบบง่าย
// ไม่ได้ใช้ AI — ตอบได้เฉพาะเรื่องที่ตั้งไว้ ที่เหลือส่งต่อให้แอดมินตอบเอง
import type { ChatFaq, ChatMessage } from '../types'
import { bySortOrder } from './sortOrder'

/** ข้อความเมื่อบอทตอบไม่ได้ บอกลูกค้าว่าแอดมินจะมาตอบเอง */
export const BOT_FALLBACK =
  'ขอบคุณที่ติดต่อเข้ามาค่ะ แอดมินได้รับข้อความแล้วและจะตอบกลับโดยเร็วที่สุด (จ.–ศ. 9:00–18:00)'

function normalize(text: string): string {
  return text.trim().toLowerCase()
}

/** หาคำตอบที่ตรงกับข้อความ — ตรงกับตัวคำถามก่อน แล้วค่อยดูคำค้นตามลำดับที่ตั้งไว้ */
export function matchFaq(text: string, faqs: ChatFaq[]): ChatFaq | null {
  const q = normalize(text)
  if (!q) return null
  const active = faqs.filter((f) => f.active).sort(bySortOrder)
  return (
    active.find((f) => normalize(f.question) === q) ??
    active.find((f) => f.keywords.some((k) => normalize(k) !== '' && q.includes(normalize(k)))) ??
    null
  )
}

/**
 * คำตอบของบอทต่อข้อความใหม่ — null คือไม่ต้องตอบ
 *
 * ถ้าไม่ตรงคำถามใดเลยจะตอบข้อความสำรองครั้งเดียว ไม่ตอบซ้ำทุกข้อความ
 * และไม่ตอบถ้าแอดมินกำลังคุยอยู่ (ข้อความล่าสุดที่ไม่ใช่ของลูกค้ามาจากแอดมิน)
 */
export function botReply(text: string, faqs: ChatFaq[], history: ChatMessage[]): string | null {
  const faq = matchFaq(text, faqs)
  if (faq) return faq.answer
  const lastReply = [...history].reverse().find((m) => m.from !== 'customer')
  if (lastReply && (lastReply.from === 'admin' || lastReply.text === BOT_FALLBACK)) return null
  return BOT_FALLBACK
}
