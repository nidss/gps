// ── รายการสินค้าของร้าน ─────────────────────────────────────────────
// ที่มา: https://www.rodlifestore.com/category/286464 (หมวด ROD)
// ดึงเมื่อ 2026-09-22
//
// ข้อมูลจริงจากร้าน: ชื่อสินค้า ราคาเต็ม ราคาลด และรูปภาพ
// ข้อมูลชั่วคราวที่รอแทนที่ด้วยของจริง:
//   - คำบรรยายที่มีคอมเมนต์ TODO (ร้านเรนเดอร์คำบรรยายด้วย JavaScript
//     การดึง HTML ดิบจึงไม่ได้ข้อความส่วนนี้มา)
//   - จำนวนสต็อกทุกชิ้น (ตั้งไว้ 50 เท่ากันหมด)
//   - รหัสสินค้าที่ขึ้นต้นด้วย ROD- (สร้างจากเลขสินค้าในลิงก์ ไม่ใช่ SKU จริง)
//
// รูปภาพชี้ไปที่ CDN ของร้านเดิมโดยตรง ถ้าต้องการเก็บรูปไว้ในโปรเจกต์
// ให้รัน: node scripts/scrape-products.mjs "https://www.rodlifestore.com/category/286464"
import type { Product } from '../types'

/** เลื่อนวันจากวันนี้แล้วคืนค่าเป็น ISO timestamp (ใช้เป็นวันที่เพิ่มสินค้า) */
function isoOffset(days: number, hour = 10): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, (Math.abs(days) * 13) % 60, 0, 0)
  return d.toISOString()
}

export const seedProducts: Product[] = [
  {
    id: 'p01', slug: 'rod-1232648', name: 'เสื้อยืด ROD สีขาว สกรีน 2 สี', sku: 'PMDB2022-S001',
    category: 'เสื้อผ้า',
    description:
      'เสื้อยืดคอกลม ROD ผลิตจากเนื้อผ้าซูปเปอร์ดราย ช่วยให้สวมใส่สบาย ระบายอากาศได้ดี ไม่ร้อน ไม่เหนอะหนะ และไม่เสียทรง',
    images: ['https://shop-image.readyplanet.com/GbzbOqqSlDsF4gXXnMNVXPb67zE=/af36057e92a140b09f19601ad53d9526', 'https://shop-image.readyplanet.com/Td6u7qb1OxfzccfLfLkboAFEk3I=/500x500/5f19f53f90624bee8b1307a1312e34ba', 'https://shop-image.readyplanet.com/2J0g8KkAzO9FMC2cSNS0no9-NB4=/500x500/ad9218b5a9ce4d978cb00f42922a4b1c', 'https://shop-image.readyplanet.com/jr-YjPE3-VdkW93jVJM1V_5wYCE=/500x500/f3c5f330acf34773bf12db4185d428f8'],
    price: 450, salePrice: 350, stock: 50,
    recommended: true, active: true, createdAt: isoOffset(-1),
  },
  {
    id: 'p02', slug: 'rod-1232645', name: 'เสื้อยืด ROD สีขาว สกรีน 1 สี', sku: 'ROD-1232645',
    category: 'เสื้อผ้า',
    description:
      'เสื้อยืดคอกลม ROD ผลิตจากเนื้อผ้าซูปเปอร์ดราย ช่วยให้สวมใส่สบาย ระบายอากาศได้ดี ไม่ร้อน ไม่เหนอะหนะ และไม่เสียทรง',
    images: ['https://shop-image.readyplanet.com/ACGPwguGvgmUrKLqmqb3EcUSyNg=/09cf9f3dbbae43bbb7e88168309605fa'],
    price: 450, salePrice: 350, stock: 50,
    recommended: true, active: true, createdAt: isoOffset(-2),
  },
  {
    id: 'p03', slug: 'rod-1232643', name: 'เสื้อยืด ROD สีดำ สกรีน 1 สี', sku: 'ROD-1232643',
    category: 'เสื้อผ้า',
    description:
      'เสื้อยืดคอกลม ROD ผลิตจากเนื้อผ้าซูปเปอร์ดราย ช่วยให้สวมใส่สบาย ระบายอากาศได้ดี ไม่ร้อน ไม่เหนอะหนะ และไม่เสียทรง',
    images: ['https://shop-image.readyplanet.com/H8n1LsEQ9qzXJBSAxfp8gzu9nKI=/2f44f507e0f745a88d443d6897391749'],
    price: 450, salePrice: 350, stock: 50,
    recommended: true, active: true, createdAt: isoOffset(-3),
  },
  {
    id: 'p04', slug: 'rod-1232655', name: 'หมวก ROD สีน้ำเงินกรมท่า', sku: 'ROD-1232655',
    category: 'หมวกและกระเป๋า',
    description:
      'หมวกแก๊ป ROD สีน้ำเงินกรมท่า ปักโลโก้ ROD ด้านหน้า ปรับขนาดได้ด้านหลัง',  // TODO: แทนที่ด้วยคำบรรยายจริงจากร้าน
    images: ['https://shop-image.readyplanet.com/6A6QCKGXWmk2OKk2SKLr-UEkA_w=/4d5987be01cf4f50a02b3880142005bb'],
    price: 550, salePrice: 350, stock: 50,
    recommended: true, active: true, createdAt: isoOffset(-4),
  },
  {
    id: 'p05', slug: 'rod-1232656', name: 'หมวก ROD สีขาว', sku: 'ROD-1232656',
    category: 'หมวกและกระเป๋า',
    description:
      'หมวกแก๊ป ROD สีขาว ปักโลโก้ ROD ด้านหน้า ปรับขนาดได้ด้านหลัง',  // TODO: แทนที่ด้วยคำบรรยายจริงจากร้าน
    images: ['https://shop-image.readyplanet.com/dqsvr2fUew3m7j5pZS2Ta8Eiv14=/75bcf60b01644897be8efa878b974750'],
    price: 550, salePrice: 350, stock: 50,
    recommended: true, active: true, createdAt: isoOffset(-5),
  },
  {
    id: 'p06', slug: 'rod-1232657', name: 'กระเป๋าผ้า ROD สกรีน 2 สี', sku: 'ROD-1232657',
    category: 'หมวกและกระเป๋า',
    description:
      'กระเป๋าผ้า ROD สกรีนลาย 2 สี ใช้ใส่ของใช้ประจำวันหรือเป็นถุงผ้าลดโลกร้อน',  // TODO: แทนที่ด้วยคำบรรยายจริงจากร้าน
    images: ['https://shop-image.readyplanet.com/8_-6Nd4bQ1sRmf4I0Qjl74FrDX4=/99aa7eeaab2c4d7589beeaa91014c828'],
    price: 900, salePrice: 500, stock: 50,
    recommended: true, active: true, createdAt: isoOffset(-6),
  },
  {
    id: 'p07', slug: 'rod-1232659', name: 'กระเป๋าผ้า ROD สกรีน 1 สี', sku: 'ROD-1232659',
    category: 'หมวกและกระเป๋า',
    description:
      'กระเป๋าผ้า ROD สกรีนลาย 1 สี ใช้ใส่ของใช้ประจำวันหรือเป็นถุงผ้าลดโลกร้อน',  // TODO: แทนที่ด้วยคำบรรยายจริงจากร้าน
    images: ['https://shop-image.readyplanet.com/g37x-jrdpmiBiAVk2Fqw8Hdt4_c=/a9b2b8ad84e74e6a9b59306eec66875a'],
    price: 900, salePrice: 500, stock: 50,
    recommended: true, active: true, createdAt: isoOffset(-7),
  },
  {
    id: 'p08', slug: 'rod-1232661', name: 'แก้วเก็บความร้อน/เย็น ROD x Lock & Lock', sku: 'ROD-1232661',
    category: 'ของใช้',
    description:
      'แก้วเก็บความร้อน/เย็น ROD x Lock & Lock รุ่นพิเศษจากความร่วมมือระหว่าง ROD และ Lock & Lock',  // TODO: แทนที่ด้วยคำบรรยายจริงจากร้าน
    images: ['https://shop-image.readyplanet.com/-v-FVuZ2PBe2yZY65_sRp_HWc8Q=/ac1ea8332b8b43bab06f9046da92d607'],
    price: 750, salePrice: 600, stock: 50,
    recommended: true, active: true, createdAt: isoOffset(-8),
  },
  {
    id: 'p09', slug: 'rod-1232686', name: 'ร่มกลับด้าน ROD', sku: 'ROD-1232686',
    category: 'ของใช้',
    description:
      'ร่มกลับด้าน ROD พับเก็บแบบกลับด้าน ช่วยไม่ให้น้ำหยดเลอะเวลาเก็บร่มในรถ',  // TODO: แทนที่ด้วยคำบรรยายจริงจากร้าน
    images: ['https://shop-image.readyplanet.com/zN2gKTdM1n03izejTlKnkSHN6-s=/9b85f6dc99b24b46901b120ee9b11649'],
    price: 580, salePrice: 450, stock: 50,
    recommended: false, active: true, createdAt: isoOffset(-9),
  },
  {
    id: 'p10', slug: 'rod-1232690', name: 'แลนยาร์ดพร้อมขวดสเปรย์', sku: 'ROD-1232690',
    category: 'ของที่ระลึก',
    description:
      'ชุดแลนยาร์ด ROD พร้อมขวดสเปรย์ สำหรับคล้องคอพกพาติดตัว',  // TODO: แทนที่ด้วยคำบรรยายจริงจากร้าน
    images: ['https://shop-image.readyplanet.com/TH1m6PUJYkfsQEL2eHbChw26qO4=/698b616baef44166a42522f25571e591'],
    price: 400, salePrice: 300, stock: 50,
    recommended: false, active: true, createdAt: isoOffset(-10),
  },
  {
    id: 'p11', slug: 'rod-1212772', name: 'Promotion ฿999', sku: 'ROD-1212772',
    category: 'โปรโมชัน',
    description:
      'ชุดโปรโมชันราคาพิเศษ 999 บาท',  // TODO: แทนที่ด้วยคำบรรยายจริงจากร้าน
    images: ['https://shop-image.readyplanet.com/5ceADEzzZ4_85opbjgU_WFRKijo=/0d181c1874f6401487ad264c35d19415'],
    price: 1480, salePrice: 999, stock: 50,  // ราคาเต็มถอดมาจากค่าที่เพี้ยน ยังไม่ได้ยืนยันกับหน้าร้าน
    recommended: false, active: true, createdAt: isoOffset(-11),
  },
]
