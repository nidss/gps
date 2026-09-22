/**
 * ดาวน์โหลดรูปสินค้าที่ยังชี้ไป CDN ภายนอก มาเก็บไว้ใน public/images/products/
 * แล้วแก้ src/lib/products.data.ts ให้ชี้มาที่ไฟล์ในโปรเจกต์แทน
 *
 * ใช้แก้ปัญหารูปไม่ขึ้นเพราะ CDN ของร้านเดิมกัน hotlink
 * รันบนเครื่องที่เข้าอินเทอร์เน็ตได้ตามปกติ
 *
 *   node scripts/download-images.mjs
 *
 * ตัวเลือก
 *   --referer=<url>  ส่ง Referer ไปด้วย เผื่อ CDN ต้องการ
 *                    (ค่าเริ่มต้น https://www.rodlifestore.com/)
 *   --dry-run        แสดงว่าจะโหลดอะไรบ้าง แต่ไม่เขียนไฟล์
 *
 * รันซ้ำได้ รูปที่โหลดมาแล้วจะถูกข้าม
 */
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs'

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36'
const IMAGE_DIR = 'public/images/products'
const DATA_FILE = 'src/lib/products.data.ts'

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : fallback
}
const DRY_RUN = args.includes('--dry-run')
const REFERER = flag('referer', 'https://www.rodlifestore.com/')

if (!existsSync(DATA_FILE)) {
  console.error(`ไม่พบไฟล์ ${DATA_FILE} — ต้องรันจากโฟลเดอร์หลักของโปรเจกต์`)
  process.exit(1)
}

mkdirSync(IMAGE_DIR, { recursive: true })
let source = readFileSync(DATA_FILE, 'utf8')

// เก็บ URL ภายนอกทั้งหมดที่อยู่ในไฟล์ข้อมูลสินค้า พร้อม slug ของสินค้าที่เป็นเจ้าของ
const entries = []
const productRe = /slug: '([^']+)'[\s\S]*?images: \[([^\]]*)\]/g
for (const match of source.matchAll(productRe)) {
  const slug = match[1]
  const urls = [...match[2].matchAll(/'(https?:\/\/[^']+)'/g)].map((m) => m[1])
  urls.forEach((url, i) => entries.push({ slug, url, index: i }))
}

if (entries.length === 0) {
  console.log('ไม่มีรูปที่ชี้ไป URL ภายนอกแล้ว — ไม่ต้องทำอะไรเพิ่ม')
  process.exit(0)
}

console.log(`พบรูปที่ต้องโหลด ${entries.length} ไฟล์`)
if (DRY_RUN) {
  entries.forEach((e) => console.log(`  ${e.slug}-${e.index + 1}  <-  ${e.url}`))
  process.exit(0)
}

/** เดานามสกุลไฟล์จาก Content-Type เพราะ URL ของ CDN ไม่มีนามสกุลติดมา */
function extensionFor(contentType, buffer) {
  const byType = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/avif': '.avif',
    'image/svg+xml': '.svg',
  }[String(contentType).split(';')[0].trim().toLowerCase()]
  if (byType) return byType

  // ถ้า Content-Type ไม่ช่วย ให้ดูลายเซ็นในไฟล์แทน
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return '.jpg'
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return '.png'
  if (buffer.subarray(8, 12).toString('ascii') === 'WEBP') return '.webp'
  if (buffer.subarray(0, 3).toString('ascii') === 'GIF') return '.gif'
  return '.jpg'
}

let ok = 0
let failed = 0

for (const entry of entries) {
  const label = `${entry.slug}-${entry.index + 1}`
  try {
    const res = await fetch(entry.url, {
      headers: { 'User-Agent': UA, Referer: REFERER, Accept: 'image/*,*/*' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.length < 1024) throw new Error(`ไฟล์เล็กผิดปกติ (${buffer.length} bytes)`)

    const filename = label + extensionFor(res.headers.get('content-type'), buffer)
    writeFileSync(`${IMAGE_DIR}/${filename}`, buffer)

    // แทน URL ภายนอกในไฟล์ข้อมูลด้วยพาธในโปรเจกต์
    source = source.replace(`'${entry.url}'`, `'images/products/${filename}'`)

    console.log(`  โหลดแล้ว ${filename} (${Math.round(buffer.length / 1024)} KB)`)
    ok++
  } catch (err) {
    console.warn(`  ข้าม ${label}: ${err.message}`)
    failed++
  }
  await new Promise((r) => setTimeout(r, 200))
}

if (ok > 0) {
  writeFileSync(DATA_FILE, source)
  console.log(`\nโหลดสำเร็จ ${ok} ไฟล์` + (failed ? ` / ล้มเหลว ${failed} ไฟล์` : ''))
  console.log(`แก้ ${DATA_FILE} ให้ชี้มาที่ไฟล์ในโปรเจกต์แล้ว`)
  console.log('\nขั้นต่อไป:')
  console.log('  npm run build')
  console.log('  git add -A && git commit -m "chore: เก็บรูปสินค้าไว้ในโปรเจกต์" && git push')
} else {
  console.error(`\nโหลดไม่สำเร็จสักไฟล์ (ล้มเหลว ${failed} ไฟล์) — ไม่ได้แก้ไฟล์ข้อมูล`)
  process.exit(1)
}
