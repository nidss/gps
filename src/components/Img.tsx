// ── รูปภาพที่มีภาพสำรองเมื่อโหลดไม่สำเร็จ ───────────────────────────
// รูปสินค้าบางส่วนชี้ไปที่ CDN ภายนอก ถ้าปลายทางลบรูปหรือบล็อก hotlink
// จะได้ไม่ขึ้นเป็นไอคอนรูปแตก
import { useEffect, useState, type ImgHTMLAttributes } from 'react'
import { asset } from '../lib/asset'

const FALLBACK = 'images/placeholder.svg'

export function Img({
  src, alt, ...props
}: Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & { src: string; alt: string }) {
  const [failed, setFailed] = useState(false)

  // เปลี่ยนสินค้าแล้วต้องลองโหลดรูปใหม่อีกครั้ง
  useEffect(() => setFailed(false), [src])

  return (
    <img
      src={asset(failed || !src ? FALLBACK : src)}
      alt={alt}
      // ไม่ส่ง Referer ไปกับคำขอรูป เพราะ CDN ของร้านเดิมกัน hotlink
      // ด้วยการเช็กว่าคำขอมาจากโดเมนของร้านหรือไม่ ถ้าไม่ส่ง Referer เลย
      // การตรวจแบบนี้ส่วนใหญ่จะปล่อยผ่าน
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      {...props}
    />
  )
}
