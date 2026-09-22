// ── รายการสินค้าตั้งต้นของร้าน ──────────────────────────────────────
// ไฟล์นี้ถูกสร้างทับได้ด้วย `node scripts/scrape-products.mjs <url>`
// ถ้าต้องการดึงสินค้าจากร้านเดิมเข้ามาแทนข้อมูลตัวอย่าง
import type { Product } from '../types'

const img = (name: string) => `images/products/${name}`

/** เลื่อนวันจากวันนี้แล้วคืนค่าเป็น ISO timestamp (ใช้เป็นวันที่เพิ่มสินค้า) */
function isoOffset(days: number, hour = 10): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, (Math.abs(days) * 13) % 60, 0, 0)
  return d.toISOString()
}

export const seedProducts: Product[] = [
  {
    id: 'p01', slug: 'team-polo', name: 'เสื้อโปโลทีมแข่ง Grandprix 2026', sku: 'GP-101',
    category: 'เสื้อผ้า',
    description:
      'เสื้อโปโลทีมแข่งรุ่นทางการประจำฤดูกาล 2026 ตัดเย็บจากผ้าพิเก้ระบายอากาศดี น้ำหนักเบา แห้งเร็ว ปักโลโก้ทีมที่อกซ้ายและแขนขวา พร้อมแถบลายธงตราหมากรุกที่ปลายแขน สวมใส่สบายทั้งวันสนาม\n\nมีให้เลือกไซซ์ S ถึง 3XL ซักเครื่องได้ สีไม่ตก',
    images: [img('polo-1.svg'), img('polo-2.svg'), img('polo-3.svg')],
    price: 1590, salePrice: 1290, stock: 48, recommended: true, active: true, createdAt: isoOffset(-60),
  },
  {
    id: 'p02', slug: 'racing-cap', name: 'หมวกแก๊ปทีมแข่ง รุ่นนักขับ', sku: 'GP-102',
    category: 'หมวกและกระเป๋า',
    description:
      'หมวกแก๊ป 6 ชิ้นทรงคลาสสิกเหมือนที่นักขับใส่บนโพเดียม ปักนูนโลโก้ด้านหน้า ปรับขนาดด้านหลังด้วยตัวล็อกโลหะ ซับในดูดซับเหงื่อ\n\nฟรีไซซ์ ปรับได้รอบศีรษะ 55–60 ซม.',
    images: [img('cap-1.svg'), img('cap-2.svg'), img('cap-3.svg')],
    price: 890, salePrice: 690, stock: 120, recommended: true, active: true, createdAt: isoOffset(-58),
  },
  {
    id: 'p03', slug: 'graphic-tee', name: 'เสื้อยืดลายรถแข่ง Limited Edition', sku: 'GP-103',
    category: 'เสื้อผ้า',
    description:
      'เสื้อยืดคอกลมผ้าคอตตอน 100% พิมพ์ลายรถแข่งเต็มหลังด้วยระบบ DTG สีคมชัด ทนการซัก ผลิตจำนวนจำกัดเฉพาะฤดูกาลนี้เท่านั้น',
    images: [img('tee-1.svg'), img('tee-2.svg'), img('tee-3.svg')],
    price: 790, salePrice: null, stock: 86, recommended: true, active: true, createdAt: isoOffset(-50),
  },
  {
    id: 'p04', slug: 'pit-jacket', name: 'แจ็กเก็ตทีมพิทครู กันลม', sku: 'GP-104',
    category: 'เสื้อผ้า',
    description:
      'แจ็กเก็ตทีมพิทครูตัวจริง ผ้าสองชั้นกันลมกันละอองน้ำ ซิปยาวตลอดตัว กระเป๋าข้างมีซิป ปักโลโก้สปอนเซอร์รอบตัว เหมาะกับสภาพอากาศสนามกลางคืน',
    images: [img('jacket-1.svg'), img('jacket-2.svg'), img('jacket-3.svg')],
    price: 3290, salePrice: 2590, stock: 24, recommended: true, active: true, createdAt: isoOffset(-45),
  },
  {
    id: 'p05', slug: 'keychain', name: 'พวงกุญแจโลหะรูปรถแข่ง', sku: 'GP-105',
    category: 'ของที่ระลึก',
    description:
      'พวงกุญแจโลหะชุบเงาขัดมัน ขึ้นรูปเป็นรถแข่งสามมิติ ด้านหลังสลักโลโก้ Grandprix พร้อมกล่องของขวัญ เหมาะเป็นของฝาก',
    images: [img('keychain-1.svg'), img('keychain-2.svg'), img('keychain-3.svg')],
    price: 350, salePrice: 259, stock: 200, recommended: true, active: true, createdAt: isoOffset(-40),
  },
  {
    id: 'p06', slug: 'tumbler', name: 'แก้วเก็บความเย็นสแตนเลส 600 มล.', sku: 'GP-106',
    category: 'ของใช้',
    description:
      'แก้วสแตนเลสสองชั้นสุญญากาศ เก็บความเย็นได้นาน 12 ชั่วโมง เก็บความร้อน 6 ชั่วโมง ฝาเกลียวกันหก พ่นสีแบรนด์พร้อมโลโก้เลเซอร์',
    images: [img('tumbler-1.svg'), img('tumbler-2.svg'), img('tumbler-3.svg')],
    price: 1190, salePrice: 950, stock: 64, recommended: true, active: true, createdAt: isoOffset(-38),
  },
  {
    id: 'p07', slug: 'diecast-143', name: 'โมเดลรถแข่ง Diecast สเกล 1:43', sku: 'GP-107',
    category: 'ของสะสม',
    description:
      'โมเดลรถแข่งไดคาสต์สเกล 1:43 รายละเอียดสูง ลายสปอนเซอร์ตรงตามรถแข่งจริงประจำฤดูกาล ฐานอะคริลิกใสพร้อมป้ายชื่อนักขับ ผลิตจำนวนจำกัด',
    images: [img('diecast-1.svg'), img('diecast-2.svg'), img('diecast-3.svg')],
    price: 2490, salePrice: 1990, stock: 18, recommended: true, active: true, createdAt: isoOffset(-35),
  },
  {
    id: 'p08', slug: 'umbrella', name: 'ร่มพับทีมแข่ง กันยูวี', sku: 'GP-108',
    category: 'ของใช้',
    description:
      'ร่มพับ 3 ตอน ผ้าเคลือบกันยูวี UPF 50+ โครงไฟเบอร์กลาสทนลม เปิด-ปิดอัตโนมัติ พร้อมซองใส่สีเดียวกัน พกติดกระเป๋าไปสนามได้สะดวก',
    images: [img('umbrella-1.svg'), img('umbrella-2.svg'), img('umbrella-3.svg')],
    price: 690, salePrice: null, stock: 95, recommended: false, active: true, createdAt: isoOffset(-30),
  },
  {
    id: 'p09', slug: 'sling-bag', name: 'กระเป๋าสะพายข้างทีมแข่ง', sku: 'GP-109',
    category: 'หมวกและกระเป๋า',
    description:
      'กระเป๋าสะพายข้างผ้าโพลีเอสเตอร์กันน้ำ ช่องหลักใส่ของได้จุ ช่องหน้ามีซิปสำหรับมือถือและกระเป๋าสตางค์ สายปรับระดับได้ แผ่นสะท้อนแสงด้านหน้า',
    images: [img('bag-1.svg'), img('bag-2.svg'), img('bag-3.svg')],
    price: 1290, salePrice: 990, stock: 42, recommended: true, active: true, createdAt: isoOffset(-28),
  },
  {
    id: 'p10', slug: 'race-gloves', name: 'ถุงมือขับรถ รุ่นซ้อม', sku: 'GP-110',
    category: 'อุปกรณ์',
    description:
      'ถุงมือขับรถหนังสังเคราะห์ผสมผ้ายืด ฝ่ามือปั๊มลายกันลื่น ตะเข็บเย็บสองชั้น ระบายอากาศที่หลังมือ เหมาะกับการซ้อมและขับสนาม',
    images: [img('gloves-1.svg'), img('gloves-2.svg'), img('gloves-3.svg')],
    price: 1590, salePrice: null, stock: 30, recommended: false, active: true, createdAt: isoOffset(-24),
  },
  {
    id: 'p11', slug: 'fan-scarf', name: 'ผ้าพันคอเชียร์ทีม', sku: 'GP-111',
    category: 'ของที่ระลึก',
    description:
      'ผ้าพันคอถักลายทีมสองด้าน เนื้อนุ่มไม่คัน ปลายทั้งสองข้างมีพู่ ยาว 140 ซม. เหมาะสำหรับเชียร์ในสนามและเก็บสะสม',
    images: [img('scarf-1.svg'), img('scarf-2.svg'), img('scarf-3.svg')],
    price: 590, salePrice: 450, stock: 150, recommended: false, active: true, createdAt: isoOffset(-20),
  },
  {
    id: 'p12', slug: 'sticker-set', name: 'ชุดสติกเกอร์ทีมแข่ง 24 ชิ้น', sku: 'GP-112',
    category: 'ของที่ระลึก',
    description:
      'ชุดสติกเกอร์ไวนิลกันน้ำ 24 ลาย ทั้งโลโก้ทีม หมายเลขนักขับ และลายธงตราหมากรุก ติดโน้ตบุ๊ก หมวกกันน็อก หรือกระจกรถได้ ไม่ทิ้งคราบกาว',
    images: [img('sticker-1.svg'), img('sticker-2.svg'), img('sticker-3.svg')],
    price: 290, salePrice: 199, stock: 300, recommended: false, active: true, createdAt: isoOffset(-14),
  },
]
