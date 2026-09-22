/**
 * ดึงข้อมูลสินค้าจากหน้าหมวดหมู่ของร้านเดิม แล้วเขียนทับ src/lib/products.data.ts
 * พร้อมดาวน์โหลดรูปลง public/images/products/
 *
 * วิธีใช้
 *   node scripts/scrape-products.mjs "https://www.rodlifestore.com/category/286464"
 *
 * ตัวเลือก
 *   --limit=20        ดึงมาไม่เกินกี่ชิ้น (ค่าเริ่มต้น 40)
 *   --category="ชื่อ"  บังคับชื่อหมวดหมู่ แทนที่จะอ่านจากหน้าเว็บ
 *   --delay=800       หน่วงเวลาระหว่างการยิงแต่ละครั้ง (มิลลิวินาที) เพื่อไม่กวนเซิร์ฟเวอร์
 *   --no-images       ไม่ดาวน์โหลดรูป ใช้ URL รูปจากร้านเดิมตรง ๆ
 *   --debug           พิมพ์สิ่งที่ parser หาเจอ ใช้ตอนปรับ selector
 *   --dry-run         ไม่เขียนไฟล์ แค่แสดงผลลัพธ์
 *
 * หมายเหตุ: สคริปต์นี้อ่านเฉพาะหน้าเว็บสาธารณะ และยิงทีละคำขอแบบมีหน่วงเวลา
 * ใช้กับร้านที่คุณมีสิทธิ์ในเนื้อหาและรูปภาพเท่านั้น
 */
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs'
import { extname } from 'node:path'
import * as cheerio from 'cheerio'

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36'
const IMAGE_DIR = 'public/images/products'
const OUT_FILE = 'src/lib/products.data.ts'

// ── อ่าน argument ───────────────────────────────────────────────────
const args = process.argv.slice(2)
const categoryUrl = args.find((a) => !a.startsWith('--'))
const flag = (name, fallback = null) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : fallback
}
const has = (name) => args.includes(`--${name}`)

const LIMIT = Number(flag('limit', '40'))
const DELAY = Number(flag('delay', '800'))
const FORCED_CATEGORY = flag('category')
const SKIP_IMAGES = has('no-images')
const DEBUG = has('debug')
const DRY_RUN = has('dry-run')

if (!categoryUrl) {
  console.error('ใช้: node scripts/scrape-products.mjs "<URL หน้าหมวดหมู่>" [--limit=40] [--debug]')
  process.exit(1)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'th,en;q=0.8' } })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`)
  return res.text()
}

/** ดึงก้อน JSON-LD ทุกก้อนในหน้า (แพลตฟอร์มอีคอมเมิร์ซส่วนใหญ่ฝังไว้) */
function jsonLdBlocks($) {
  const blocks = []
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).contents().text())
      blocks.push(...(Array.isArray(parsed) ? parsed : [parsed]))
    } catch {
      /* ก้อนที่ parse ไม่ได้ ข้ามไป */
    }
  })
  // คลี่ @graph ออกมาด้วย
  return blocks.flatMap((b) => (b['@graph'] ? b['@graph'] : [b]))
}

const typeOf = (node) => {
  const t = node?.['@type']
  return Array.isArray(t) ? t : [t]
}

/** แปลงข้อความราคาเป็นตัวเลข เช่น "1,290 บาท" -> 1290 */
function parsePrice(text) {
  if (text === null || text === undefined) return null
  if (typeof text === 'number') return Number.isFinite(text) ? text : null
  const cleaned = String(text).replace(/[^\d.]/g, '')
  const n = Number.parseFloat(cleaned)
  return Number.isFinite(n) && n > 0 ? n : null
}

const absolute = (src, base) => {
  if (!src) return null
  try {
    return new URL(src, base).href
  } catch {
    return null
  }
}

/** เก็บลิงก์สินค้าจากหน้าหมวดหมู่ */
function collectProductLinks($, baseUrl) {
  const links = new Set()

  // 1) จาก JSON-LD ItemList
  for (const node of jsonLdBlocks($)) {
    if (typeOf(node).includes('ItemList')) {
      for (const item of node.itemListElement ?? []) {
        const url = item?.url ?? item?.item?.url ?? item?.item
        const abs = absolute(typeof url === 'string' ? url : null, baseUrl)
        if (abs) links.add(abs)
      }
    }
  }

  // 2) ReadyPlanet (แพลตฟอร์มที่ rodlifestore.com ใช้) วางสินค้าไว้ใน li.product-card
  $('li.product-card a[href*="/product/"]').each((_, el) => {
    const abs = absolute($(el).attr('href'), baseUrl)
    if (abs) links.add(abs.split('#')[0])
  })

  // 3) จาก <a> ที่ชี้ไปหน้าสินค้า — ครอบคลุมรูปแบบ URL ที่พบบ่อยในร้านไทย
  const patterns = [/\/product\//i, /\/products\//i, /\/item\//i, /\/p\//i, /[?&]product_id=/i]
  $('a[href]').each((_, el) => {
    const abs = absolute($(el).attr('href'), baseUrl)
    if (abs && patterns.some((re) => re.test(abs))) links.add(abs.split('#')[0])
  })

  return [...links]
}

/**
 * อ่านข้อมูลจากการ์ดสินค้าในหน้าหมวดหมู่โดยตรง
 * บางแพลตฟอร์ม (เช่น ReadyPlanet) เรนเดอร์ราคาในหน้าสินค้าด้วย JavaScript
 * ทำให้ดึงจาก HTML ดิบไม่ได้ แต่หน้าหมวดหมู่มีราคาครบอยู่แล้ว
 */
function parseCategoryCards($, baseUrl) {
  const cards = []
  $('li.product-card, .product-card').each((_, el) => {
    const $el = $(el)
    const url = absolute($el.find('a[href*="/product/"]').attr('href'), baseUrl)
    const name = $el.find('.product-name').text().replace(/\s+/g, ' ').trim()
    if (!url || !name) return
    const special = parsePrice($el.find('.product-price-special').text())
    const original = parsePrice($el.find('.product-price-original').text())
    const $img = $el.find('img').first()
    const image = absolute($img.attr('data-src') || $img.attr('src'), baseUrl)
    cards.push({
      url, name, image,
      // ถ้ามีทั้งราคาพิเศษและราคาเดิม ให้ราคาเดิมเป็นราคาเต็ม
      price: original && special && special < original ? original : special ?? original,
      salePrice: original && special && special < original ? special : null,
    })
  })
  return cards
}

/**
 * อ่านคำบรรยายสินค้าแบบ ReadyPlanet
 * โครงสร้างคือ .product-description-area > div.description หลายก้อน
 * ก้อนแรกเป็นบรรทัด "รหัสสินค้า : XXX" และมีกล่องสั่งซื้อ (.product-detail-bottom)
 * คั่นกลาง จึงต้องคัดเฉพาะก้อนที่เป็นคำบรรยายจริง
 */
function readyPlanetDescription($) {
  const parts = []
  $('.product-description-area .description').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim()
    if (!text) return
    if (/^รหัสสินค้า\s*:/.test(text)) return
    parts.push(text)
  })
  return parts.join('\n\n').slice(0, 1500)
}

/** อ่านรายละเอียดสินค้าจากหน้าสินค้าหนึ่งหน้า */
function parseProduct($, url) {
  const product = jsonLdBlocks($).find((n) => typeOf(n).includes('Product'))

  // ชื่อสินค้า
  const name =
    product?.name ||
    $('.product-title').first().text().replace(/\s+/g, ' ').trim() ||
    $('meta[property="og:title"]').attr('content') ||
    $('h1').first().text().trim() ||
    $('title').text().trim()

  // ราคา — JSON-LD offers มาก่อน แล้วค่อย fallback ไป meta / class ทั่วไป
  const offers = Array.isArray(product?.offers) ? product.offers[0] : product?.offers
  let price = parsePrice(offers?.price ?? offers?.lowPrice)
  let salePrice = null

  // ราคาเต็มที่ถูกขีดฆ่า มักอยู่ใน <del>, <s> หรือ class ที่มีคำว่า old/original/regular
  const strike = parsePrice(
    $('del, s, .price-old, .old-price, .original-price, .regular-price, ' +
      '.product-price-original, .product-detail-price-original:not(.no-special-price), [class*="price-before"]')
      .first()
      .text(),
  )
  const shown = parsePrice(
    $('.price-new, .new-price, .sale-price, .special-price, ' +
      '.product-price-special, .product-detail-price, [class*="price-now"], [itemprop="price"]')
      .first()
      .text(),
  )

  if (strike && shown && shown < strike) {
    price = strike
    salePrice = shown
  } else if (strike && price && price < strike) {
    salePrice = price
    price = strike
  }
  if (!price) price = shown ?? parsePrice($('[class*="price"]').first().text())

  // รายละเอียด
  const description =
    product?.description ||
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    readyPlanetDescription($) ||
    $('[class*="description"], [id*="description"]').first().text().trim().slice(0, 1500) ||
    ''

  // รูปภาพ — เก็บได้หลายรูป
  const images = new Set()
  const ldImages = product?.image
  for (const i of Array.isArray(ldImages) ? ldImages : [ldImages]) {
    const src = typeof i === 'string' ? i : i?.url
    const abs = absolute(src, url)
    if (abs) images.add(abs)
  }
  const og = absolute($('meta[property="og:image"]').attr('content'), url)
  if (og) images.add(og)
  $('.product-images-area img, [class*="gallery"] img, [class*="thumb"] img, [id*="gallery"] img, .product-image img').each((_, el) => {
    const $el = $(el)
    const raw = $el.attr('data-src') || $el.attr('data-original') || $el.attr('src')
    const abs = absolute(raw, url)
    // ข้ามไอคอนเล็ก ๆ และรูป placeholder
    if (abs && !/placeholder|loading|blank|spinner/i.test(abs)) images.add(abs)
  })

  // ReadyPlanet แสดงรหัสสินค้าเป็นข้อความ "รหัสสินค้า : XXX" ในส่วนรายละเอียด
  const skuFromText = $('body').text().replace(/\s+/g, ' ').match(/รหัสสินค้า\s*:?\s*([A-Za-z0-9._-]{3,30})/)?.[1]

  return {
    name: String(name ?? '').trim(),
    sku: String(product?.sku ?? product?.mpn ?? skuFromText ?? '').trim(),
    category: (FORCED_CATEGORY ?? product?.category ?? '').trim(),
    description: String(description).replace(/\s+/g, ' ').trim(),
    price,
    salePrice,
    images: [...images],
    stock: parsePrice(offers?.inventoryLevel?.value) ?? 50,
    url,
  }
}

/** ดาวน์โหลดรูปลง public/ แล้วคืนพาธที่ใช้ในโปรเจกต์ */
async function downloadImage(src, slug, index) {
  const ext = (extname(new URL(src).pathname) || '.jpg').split('?')[0].toLowerCase()
  const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg'].includes(ext) ? ext : '.jpg'
  const filename = `${slug}-${index + 1}${safeExt}`
  const res = await fetch(src, { headers: { 'User-Agent': UA, Referer: categoryUrl } })
  if (!res.ok) throw new Error(`โหลดรูปไม่สำเร็จ ${res.status} — ${src}`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length < 1024) throw new Error(`รูปเล็กผิดปกติ (${buf.length} bytes) — ${src}`)
  writeFileSync(`${IMAGE_DIR}/${filename}`, buf)
  return `images/products/${filename}`
}

/**
 * สร้าง slug สำหรับใช้เป็นชื่อไฟล์ — บังคับให้เป็น ASCII เท่านั้น
 * เพราะชื่อไฟล์ภาษาไทยจะถูก percent-encode ใน URL และพังกับ CDN บางตัว
 */
function toSlug(name, fallbackIndex) {
  const ascii = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')   // ตัดอักขระที่ไม่ใช่ ASCII ทิ้ง รวมถึงตัวอักษรไทย
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40)
    .replace(/^-|-$/g, '')
  // ชื่อสินค้าภาษาไทยล้วนจะเหลือ ASCII สั้นเกินไป จึงใช้เลขลำดับแทน
  return ascii.length >= 3 ? ascii : `item-${String(fallbackIndex + 1).padStart(2, '0')}`
}

const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')

// ── เริ่มทำงาน ──────────────────────────────────────────────────────
mkdirSync(IMAGE_DIR, { recursive: true })

console.log(`กำลังอ่านหน้าหมวดหมู่: ${categoryUrl}`)
const categoryHtml = await fetchHtml(categoryUrl)
const $cat = cheerio.load(categoryHtml)

const categoryName =
  FORCED_CATEGORY ||
  $cat('h1').first().text().trim() ||
  $cat('meta[property="og:title"]').attr('content')?.trim() ||
  'สินค้านำเข้า'

// ราคาจากหน้าหมวดหมู่เชื่อถือได้กว่า เพราะบางแพลตฟอร์มเรนเดอร์ราคาในหน้าสินค้าด้วย JS
const cards = parseCategoryCards($cat, categoryUrl)
const cardByUrl = new Map(cards.map((c) => [c.url, c]))

const links = (cards.length > 0 ? cards.map((c) => c.url) : collectProductLinks($cat, categoryUrl)).slice(0, LIMIT)
console.log(`หมวดหมู่: ${categoryName}`)
console.log(`พบลิงก์สินค้า ${links.length} รายการ` + (cards.length > 0 ? ` (อ่านราคาจากการ์ดในหน้าหมวดหมู่)` : ''))

if (DEBUG) {
  console.log('\n--- ลิงก์ที่เจอ ---')
  links.forEach((l) => console.log('  ' + l))
  console.log(`--- JSON-LD ในหน้าหมวดหมู่: ${jsonLdBlocks($cat).map((b) => typeOf(b).join('/')).join(', ') || 'ไม่มี'} ---\n`)
}

if (links.length === 0) {
  console.error('\nหาลิงก์สินค้าไม่เจอ — โครงสร้างหน้าอาจไม่ตรงกับ pattern ที่รองรับ')
  console.error('ลองรันซ้ำด้วย --debug แล้วส่งผลลัพธ์มาให้ปรับ selector ครับ')
  process.exit(1)
}

const products = []
for (const [i, link] of links.entries()) {
  try {
    process.stdout.write(`  [${i + 1}/${links.length}] ${link} ... `)
    const html = await fetchHtml(link)
    const parsed = parseProduct(cheerio.load(html), link)
    const card = cardByUrl.get(link)

    // ให้ข้อมูลจากการ์ดในหน้าหมวดหมู่ชนะเรื่องชื่อและราคา
    if (card) {
      parsed.name = card.name || parsed.name
      if (card.price) {
        parsed.price = card.price
        parsed.salePrice = card.salePrice
      }
      if (card.image && !parsed.images.includes(card.image)) parsed.images.unshift(card.image)
    }

    if (!parsed.name || !parsed.price) {
      console.log('ข้าม (อ่านชื่อหรือราคาไม่ได้)')
      if (DEBUG) console.log('    ', JSON.stringify(parsed).slice(0, 300))
      continue
    }

    const slug = toSlug(parsed.name, i)
    let images = parsed.images.slice(0, 5)

    if (!SKIP_IMAGES && !DRY_RUN) {
      const saved = []
      for (const [n, src] of images.entries()) {
        try {
          saved.push(await downloadImage(src, slug, n))
          await sleep(200)
        } catch (err) {
          console.log(`\n    เตือน: ${err.message}`)
        }
      }
      images = saved
    }

    if (images.length === 0) {
      console.log('ข้าม (ไม่มีรูป)')
      continue
    }

    products.push({
      id: `p${String(products.length + 1).padStart(2, '0')}`,
      slug,
      name: parsed.name,
      sku: parsed.sku || `GP-${String(products.length + 101)}`,
      category: parsed.category || categoryName,
      description: parsed.description,
      images,
      price: Math.round(parsed.price),
      salePrice: parsed.salePrice ? Math.round(parsed.salePrice) : null,
      stock: Math.round(parsed.stock),
      recommended: products.length < 8,
      daysAgo: -(products.length + 1),
    })
    console.log('สำเร็จ')
    await sleep(DELAY)
  } catch (err) {
    console.log(`ผิดพลาด: ${err.message}`)
  }
}

console.log(`\nดึงสินค้าได้ ${products.length} รายการ`)
if (products.length === 0) process.exit(1)

const body = products
  .map(
    (p) => `  {
    id: '${p.id}', slug: '${esc(p.slug)}', name: '${esc(p.name)}', sku: '${esc(p.sku)}',
    category: '${esc(p.category)}',
    description:
      '${esc(p.description)}',
    images: [${p.images.map((i) => (i.startsWith('http') ? `'${esc(i)}'` : `img('${esc(i.replace('images/products/', ''))}')`)).join(', ')}],
    price: ${p.price}, salePrice: ${p.salePrice ?? 'null'}, stock: ${p.stock},
    recommended: ${p.recommended}, active: true, createdAt: isoOffset(${p.daysAgo}),
  },`,
  )
  .join('\n')

const file = `// ── รายการสินค้าตั้งต้นของร้าน ──────────────────────────────────────
// ไฟล์นี้ถูกสร้างอัตโนมัติโดย scripts/scrape-products.mjs
// ที่มา: ${categoryUrl}
// สร้างเมื่อ: ${new Date().toISOString()}
// แก้ไขด้วยมือได้ แต่จะถูกเขียนทับถ้ารันสคริปต์ใหม่
import type { Product } from '../types'

const img = (name: string) => \`images/products/\${name}\`

/** เลื่อนวันจากวันนี้แล้วคืนค่าเป็น ISO timestamp (ใช้เป็นวันที่เพิ่มสินค้า) */
function isoOffset(days: number, hour = 10): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, (Math.abs(days) * 13) % 60, 0, 0)
  return d.toISOString()
}

export const seedProducts: Product[] = [
${body}
]
`

if (DRY_RUN) {
  console.log('\n--- ตัวอย่างไฟล์ที่จะเขียน (dry run) ---\n')
  console.log(file.slice(0, 2000))
} else {
  if (existsSync(OUT_FILE)) {
    writeFileSync(`${OUT_FILE}.bak`, readFileSync(OUT_FILE))
    console.log(`สำรองไฟล์เดิมไว้ที่ ${OUT_FILE}.bak`)
  }
  writeFileSync(OUT_FILE, file)
  console.log(`เขียน ${OUT_FILE} เรียบร้อย`)
  console.log('\nขั้นต่อไป: npm run build เพื่อตรวจว่าไม่มีปัญหา แล้ว commit')
}
