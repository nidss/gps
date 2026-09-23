// สคริปต์สร้างรูป placeholder ธีมสีแบรนด์ (รันครั้งเดียว ผลลัพธ์ commit ลง public/)
// ใช้ข้อความอังกฤษในไฟล์ SVG เพราะ SVG ที่โหลดผ่าน <img> โหลดฟอนต์ภายนอกไม่ได้
import { writeFileSync, mkdirSync } from 'node:fs'

const RED = '#dd3333'
const RED_DARK = '#b82a2a'
const INK = '#333946'
const INK_DARK = '#252a34'
const LIGHT = '#f5f6f8'

mkdirSync('public/images/products', { recursive: true })
mkdirSync('public/images/banners', { recursive: true })

const checker = (id, size, color) => `
  <pattern id="${id}" width="${size * 2}" height="${size * 2}" patternUnits="userSpaceOnUse">
    <rect width="${size * 2}" height="${size * 2}" fill="none"/>
    <rect width="${size}" height="${size}" fill="${color}"/>
    <rect x="${size}" y="${size}" width="${size}" height="${size}" fill="${color}"/>
  </pattern>`

const speed = (id, color) => `
  <pattern id="${id}" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(-60)">
    <rect width="26" height="26" fill="none"/>
    <rect width="3" height="26" fill="${color}"/>
  </pattern>`

/** รูปสินค้า 800x800 - 3 โทนต่อสินค้า 1 ชิ้น */
function productSvg(label, code, variant) {
  const themes = [
    { bg: LIGHT, band: RED, band2: INK, text: INK, sub: RED, lines: 'rgba(51,57,70,0.07)', chk: 'rgba(51,57,70,0.12)' },
    { bg: INK, band: RED, band2: INK_DARK, text: '#ffffff', sub: '#ff8a8a', lines: 'rgba(255,255,255,0.06)', chk: 'rgba(255,255,255,0.10)' },
    { bg: RED_DARK, band: INK, band2: RED, text: '#ffffff', sub: '#ffd9d9', lines: 'rgba(255,255,255,0.08)', chk: 'rgba(255,255,255,0.14)' },
  ]
  const t = themes[variant % themes.length]
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800" role="img" aria-label="${label}">
  <defs>${checker('chk', 26, t.chk)}${speed('spd', t.lines)}
    <clipPath id="clip"><rect width="800" height="800"/></clipPath>
  </defs>
  <g clip-path="url(#clip)">
    <rect width="800" height="800" fill="${t.bg}"/>
    <rect width="800" height="800" fill="url(#spd)"/>
    <path d="M-60 560 L500 -40 L760 -40 L200 560 Z" fill="${t.band}" opacity="0.92"/>
    <path d="M200 860 L760 260 L900 260 L900 860 Z" fill="${t.band2}" opacity="0.22"/>
    <rect x="0" y="0" width="800" height="52" fill="url(#chk)"/>
    <circle cx="400" cy="372" r="176" fill="none" stroke="${t.text}" stroke-opacity="0.28" stroke-width="3"/>
    <circle cx="400" cy="372" r="140" fill="none" stroke="${t.text}" stroke-opacity="0.16" stroke-width="16"/>
    <text x="400" y="360" text-anchor="middle" font-family="Arial Narrow, Helvetica, Arial, sans-serif"
          font-size="74" font-weight="700" letter-spacing="2" fill="${t.text}">${label}</text>
    <text x="400" y="416" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
          font-size="27" font-weight="700" letter-spacing="7" fill="${t.sub}">${code}</text>
    <text x="400" y="712" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
          font-size="21" font-weight="700" letter-spacing="9" fill="${t.text}" opacity="0.6">GRANDPRIX PREMIUM</text>
  </g>
</svg>`
}

/**
 * แบนเนอร์ hero 1600x640 - เป็นภาพกราฟิกล้วน ไม่มีตัวอักษรฝังในไฟล์
 * เพราะหัวข้อและคำโปรยถูกวางทับด้วย HTML (แก้ไขได้จากระบบหลังบ้าน)
 */
function bannerSvg(tone) {
  const tones = {
    ink: { bg: INK, accent: RED, glow: '#454c5e' },
    red: { bg: RED_DARK, accent: INK, glow: RED },
    dark: { bg: INK_DARK, accent: RED, glow: '#3d4454' },
  }
  const t = tones[tone]
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 640" width="1600" height="640">
  <defs>${checker('bchk', 22, 'rgba(255,255,255,0.13)')}${speed('bspd', 'rgba(255,255,255,0.05)')}
    <radialGradient id="glow" cx="74%" cy="34%" r="56%">
      <stop offset="0%" stop-color="${t.glow}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="${t.bg}" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="bclip"><rect width="1600" height="640"/></clipPath>
  </defs>
  <g clip-path="url(#bclip)">
    <rect width="1600" height="640" fill="${t.bg}"/>
    <rect width="1600" height="640" fill="url(#glow)"/>
    <rect width="1600" height="640" fill="url(#bspd)"/>
    <path d="M1080 -40 L1400 -40 L1000 680 L680 680 Z" fill="${t.accent}" opacity="0.88"/>
    <path d="M1400 -40 L1520 -40 L1120 680 L1000 680 Z" fill="#ffffff" opacity="0.12"/>
    <rect x="1280" y="0" width="320" height="640" fill="url(#bchk)" opacity="0.55"/>
    <circle cx="1180" cy="320" r="210" fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-width="3"/>
    <circle cx="1180" cy="320" r="150" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="22"/>
  </g>
</svg>`
}

const products = [
  ['polo', 'TEAM POLO', 'GP-101'],
  ['cap', 'RACING CAP', 'GP-102'],
  ['tee', 'GRAPHIC TEE', 'GP-103'],
  ['jacket', 'PIT JACKET', 'GP-104'],
  ['keychain', 'KEYCHAIN', 'GP-105'],
  ['tumbler', 'TUMBLER', 'GP-106'],
  ['diecast', 'DIECAST 1:43', 'GP-107'],
  ['umbrella', 'UMBRELLA', 'GP-108'],
  ['bag', 'SLING BAG', 'GP-109'],
  ['gloves', 'RACE GLOVES', 'GP-110'],
  ['scarf', 'FAN SCARF', 'GP-111'],
  ['sticker', 'STICKER SET', 'GP-112'],
]

let count = 0
for (const [slug, label, code] of products) {
  for (let v = 0; v < 3; v++) {
    writeFileSync(`public/images/products/${slug}-${v + 1}.svg`, productSvg(label, code, v))
    count++
  }
}

const banners = [
  ['banner-1', 'ink'],
  ['banner-2', 'red'],
  ['banner-3', 'dark'],
  ['banner-4', 'red'],
]
for (const [name, tone] of banners) {
  writeFileSync(`public/images/banners/${name}.svg`, bannerSvg(tone))
  count++
}

console.log(`สร้างรูปทั้งหมด ${count} ไฟล์`)
