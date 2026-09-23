# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## ข้อจำกัดที่กำหนดทุกอย่างในโปรเจกต์นี้

ร้านค้าออนไลน์ Grandprix Online เป็น **static site บน GitHub Pages - ไม่มี server ไม่มี database**

`localStorage` **คือ** ฐานข้อมูล ทุกฟีเจอร์ต้องออกแบบบนข้อจำกัดนี้ และข้อมูลอยู่แยกกันในเครื่องของผู้ใช้แต่ละคน

ระบบล็อกอินและสิทธิ์ admin เป็นการสาธิตฝั่ง client เท่านั้น (`hashPassword` ใน `src/lib/storage.ts`
เป็น djb2 ไม่ใช่การเข้ารหัสจริง) อย่าอ้างอิงว่าเป็นการรักษาความปลอดภัยจริง และอย่าต่อยอดเก็บข้อมูลอ่อนไหว

เว็บจริง: https://nidss.github.io/gpshop/

---

## คำสั่ง

| คำสั่ง | ใช้ทำอะไร |
|---|---|
| `npm run dev` | dev server ที่ `http://localhost:5173/gpshop/` (`base` มีผลตอน dev ด้วย) |
| `npm run build` | `tsc -b` แล้ว `vite build` - ใช้เป็นด่านตรวจหลักก่อน commit |
| `npm run typecheck` | ตรวจ type อย่างเดียว เร็วกว่า build |
| `npm run preview` | เสิร์ฟ `dist/` ที่ `http://localhost:4173/gpshop/` (ต้อง build ก่อน) |

### ไม่มี test framework และไม่มี linter ในโปรเจกต์นี้

วิธีตรวจงานที่ใช้มาตลอดคือเขียนสคริปต์ Playwright ชั่วคราวแล้วเดินทดสอบบนเบราว์เซอร์จริง:

1. `npm i -D playwright`
2. เขียนไฟล์ชื่อลงท้าย `*.local.mjs` (gitignore ไว้แล้ว) - ใช้ Chromium ที่มากับ environment:
   `chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })`
   (symlink ไปยังรุ่นที่ติดตั้งอยู่ ไม่ต้องแก้ path เมื่อ environment อัปเดตรุ่น)
   **ห้ามรัน `playwright install`** (environment ตั้ง `PLAYWRIGHT_BROWSERS_PATH` ไว้แล้ว)
3. ก่อน commit: `npm uninstall playwright` และลบไฟล์ `*.local.mjs` ทิ้ง

สคริปต์ต้องดักทั้ง `pageerror` และ console error เสมอ
ยกเว้นคำขอไป `fonts.googleapis.com` ที่ล้มเหลว - proxy ของ sandbox บล็อกไว้ ไม่ใช่บั๊ก

---

## กับดักที่ต้องรู้

### 1. แก้ข้อมูลสินค้าแล้วต้องบวก `CATALOG_VERSION`

ข้อมูลตั้งต้นถูกเขียนลง localStorage **แค่ครั้งแรก** ที่ผู้ใช้เข้าเว็บ

ถ้าแก้ `src/lib/products.data.ts` หรือ `src/lib/seed.ts` แล้วลืมบวกเลข `CATALOG_VERSION`
ใน `src/store/AppStore.tsx` **คนที่เคยเข้าเว็บจะเห็นข้อมูลชุดเก่าค้างตลอดไป** แม้ deploy ใหม่แล้ว
(เคยเกิดขึ้นจริงและใช้เวลาหาสาเหตุนาน เพราะโค้ดใหม่ขึ้นเว็บแล้วแต่หน้าจอไม่เปลี่ยน)

พอบวกเลขแล้ว ระบบจะเขียนทับเฉพาะ **สินค้า / หมวดหมู่ / แบนเนอร์ / คูปอง / section หน้าแรก** และ **ล้างตะกร้า**
(ตะกร้าเก็บแค่รหัสสินค้าไม่ได้เก็บราคา ถ้าแคตตาล็อกใหม่ใช้รหัสซ้ำจะได้สินค้าผิดตัวผิดราคา)
ส่วนบัญชีสมาชิก ออเดอร์ การแจ้งเตือน และแชท (ห้องแชท + คำตอบอัตโนมัติ) ยังเก็บไว้เหมือนเดิม

**เพิ่มคีย์ใหม่ไม่ต้องบวกเลข** - ให้ `read(KEY, fallback)` ใน `loadInitialState` จัดการผู้ใช้เดิมที่ยังไม่มีคีย์นั้นแทน
(ดู `loadCategories` ที่สร้างหมวดหมู่จากสินค้าในเครื่อง) บวกเลขเมื่อ **ข้อมูลเดิม** ต้องเปลี่ยนเท่านั้น

### 2. `base: '/gpshop/'` + HashRouter

ไฟล์ใน `public/` ต้องเรียกผ่าน `asset()` จาก `src/lib/asset.ts` เสมอ ห้ามเขียน path ตรง
(`asset()` ปล่อยผ่าน URL เต็มและ data URI ให้อยู่แล้ว)

ใช้ HashRouter เพราะ GitHub Pages เสิร์ฟไฟล์ static ล้วน - รีเฟรช deep link แล้วจะไม่เจอ 404

### 3. รูปสินค้าใช้ `<Img>` ไม่ใช่ `<img>`

`src/components/Img.tsx` เรียก `asset()` ให้เอง สลับไปใช้ภาพสำรองเมื่อโหลดไม่สำเร็จ
และตั้ง `referrerPolicy="no-referrer"` ไว้เพราะเคยเจอ CDN ของร้านเดิมกัน hotlink

### 4. แก้การ์ดสินค้าแล้วกระทบสองฝั่ง

`ProductThumb` และ `PriceTag` ที่ export จาก `src/components/ProductCard.tsx`
ถูกใช้ร่วมกันระหว่างการ์ดหน้าร้านและ `src/components/AdminProductCard.tsx`

เวลาแก้ไฟล์นี้ ให้จับภาพหน้า `/products` ก่อน-หลัง แล้วเทียบทีละพิกเซล
(โหลดภาพทั้งสองเข้า canvas แล้วนับพิกเซลที่ต่างกัน) เพื่อยืนยันว่าหน้าร้านไม่ขยับ

### 5. แอนิเมชันต้องไม่ขวางการทำงานจริง

`src/components/FlyToCart.tsx` คุมแอนิเมชันด้วย DOM ตรง ๆ ไม่ผ่าน React state
เพราะกดรัวจะสร้างหลายตัวพร้อมกันและจะทำให้ re-render ทั้งหน้าโดยไม่จำเป็น

ต้องเรียก `add()` ให้เสร็จก่อน `fly()` เสมอ และเมื่อผู้ใช้เปิด `prefers-reduced-motion`
ต้องยังเห็นการตอบสนองอยู่ (แบบอยู่กับที่ ไม่วิ่งข้ามจอ) - เคยพลาดตัดทิ้งหมดจนกดแล้วเงียบสนิท

---

## สถาปัตยกรรม state

`src/store/AppStore.tsx` เป็น Context เดียวที่ถือ state ทั้งหมด แยกใช้งานผ่าน hook ตามหมวด:

| hook | ดูแล |
|---|---|
| `useAuth` | สมาชิก, session, สิทธิ์ admin |
| `useCatalog` | สินค้า, หมวดหมู่, แบนเนอร์ (กรองตามช่วงวันที่), คูปอง + CRUD ของหลังบ้าน |
| `useHomeSections` | section หน้าแรก และการคำนวณว่าแต่ละ section จะแสดงสินค้า/คูปองอะไร |
| `useCart` | ตะกร้าและการคำนวณยอด |
| `useOrders` | สร้าง/อัปเดตออเดอร์ และตัวเลขสรุปของ dashboard |
| `useNotifications` | การแจ้งเตือนและจำนวนที่ยังไม่อ่าน |
| `useChat` | ห้องแชทฝั่งลูกค้า/แอดมิน, ผู้เยี่ยมชม, คำตอบอัตโนมัติของบอท (`src/lib/chatBot.ts`) |

ทุก action เขียนผ่าน `read`/`write` ใน `src/lib/storage.ts` - คีย์ทั้งหมดรวมอยู่ใน `KEYS`
(prefix `gpx:v1:`) เพิ่มคีย์ใหม่ต้องเพิ่มที่นี่ ไม่งั้นปุ่มรีเซ็ตข้อมูลตัวอย่างจะล้างไม่ครบ

ค่าคงที่ทางธุรกิจ `SHIPPING_FEE`, `FREE_SHIPPING_MIN`, `VAT_RATE` อยู่ใน `src/lib/constants.ts`
(แยกออกมาให้ `seed.ts` ใช้ได้โดยไม่ import วน) แล้ว re-export จาก `AppStore` - บัญชี admin สำหรับสาธิตอยู่ใน `AppStore`

**หมวดหมู่:** สินค้าอ้างอิงหมวดด้วย **ชื่อ** (`Product.category`) ไม่ใช่ id - `saveCategory` จึงต้องไล่แก้ชื่อในสินค้าเมื่อเปลี่ยนชื่อหมวด
ส่วน `categories` (string[]) คือหมวดที่แสดงบนหน้าร้าน และ `categoryList` คือทั้งหมดสำหรับหลังบ้าน

**ซิงก์ข้ามแท็บ:** `AppProvider` ฟัง event `storage` ตาม `SYNCED_SLICES` - เพิ่ม slice ใหม่ต้องเพิ่มในรายการนี้ด้วย
(แชทพึ่งกลไกนี้ให้แท็บหลังบ้านเห็นข้อความลูกค้าทันที)
event นี้ยิงเฉพาะแท็บอื่น ไม่ยิงในแท็บที่เขียนเอง - ทดสอบด้วย Playwright ต้องเปิดสองหน้าใน context เดียวกัน

**เพิ่ม state slice ใหม่ต้องแก้ครบทุกจุดใน `AppStore.tsx` + `storage.ts`:**
`interface AppState` → `KEYS` → `loadInitialState` **ทั้งสามทาง** (เข้าเว็บครั้งแรก / `CATALOG_VERSION` เปลี่ยน / โหลดปกติ
แต่ละทาง return state คนละก้อน ลืมทางใดทางหนึ่งแล้ว slice จะเป็น `undefined` เฉพาะผู้ใช้กลุ่มนั้น) → `SYNCED_SLICES`
→ hook ที่อ่าน/เขียนผ่าน `useSlice(key, KEYS.xxx)` ซึ่ง `setState` และ `write` ลง localStorage พร้อมกัน
(คีย์ที่เป็นแค่ค่าตั้ง UI เช่น `adminProductView` อ่าน/เขียนตรงด้วย `read`/`write` ไม่ต้องเข้า `AppState`)

**การจัดส่ง:** `src/lib/shipping.ts` เป็นตัวกลาง (`ShippingProvider`) ตอนนี้มีแค่ขนส่งจำลองที่ขยับสถานะเองทุก 15-35 วินาที
บริษัทขนส่ง (`CARRIERS`: ไปรษณีย์ไทย, Flash, KEX, J&T) แยกจากผู้ให้บริการ เก็บใน `Shipment.carrier` - พัสดุรุ่นแรกไม่มีฟิลด์นี้ อ่านผ่าน `carrierOf()`
ข้อมูลพัสดุเก็บใน `Order.shipment` (ไม่ได้แยกคีย์) จึงซิงก์ข้ามแท็บไปกับ slice `orders` เอง
ตัววนถามสถานะ `useShipmentSync` ใน `AppProvider` ทำงานเฉพาะเบราว์เซอร์ที่ล็อกอินหลังบ้าน
เปลี่ยนออเดอร์เป็น "จัดส่งแล้ว" ครั้งแรกจะสั่งส่งพัสดุ และพัสดุส่งถึงแล้วจะเปลี่ยนออเดอร์เป็น "สำเร็จ" ให้เอง
ต่อขนส่งจริงต้องมี backend เก็บ API key และรับ webhook - ทดสอบด้วย Playwright ใช้ `page.clock.fastForward` เร่งเวลาได้

**แชทเป็นการสาธิตฝั่ง client เช่นเดียวกับระบบล็อกอิน** - ข้อความอยู่ใน localStorage คุยข้ามเครื่องไม่ได้
ถ้าจะให้ใช้งานจริงต้องมี backend (เช่น WebSocket หรือบริการแชทภายนอก)

---

## สคริปต์จัดการข้อมูล (`scripts/`)

| ไฟล์ | หน้าที่ |
|---|---|
| `gen-images.mjs` | สร้างรูป SVG ธีมสีแบรนด์ไว้ใช้เป็น placeholder |
| `scrape-products.mjs` | ดึงสินค้าจากหน้าหมวดหมู่ของร้าน (รองรับ ReadyPlanet เป็นพิเศษ) แล้วเขียนทับ `src/lib/products.data.ts` |
| `browser-extract.js` | วางใน DevTools Console ของเบราว์เซอร์ผู้ใช้ - ใช้เมื่อเครื่องที่รันโค้ดเข้าเว็บร้านไม่ได้ เปิดหน้าสินค้าใน iframe แล้วรอ JS เรนเดอร์ก่อนอ่าน |
| `download-images.mjs` | โหลดรูปจาก CDN ภายนอกมาเก็บใน `public/images/products/` แล้วแก้ `products.data.ts` ให้ชี้มาที่ไฟล์ในโปรเจกต์ |

**หลักการอ่านราคาจากเว็บร้าน:** ต้องจับ "ตัวเลขตัวแรก" ด้วย regex
ห้ามตัดอักขระที่ไม่ใช่ตัวเลขออกทั้งหมด เพราะข้อความที่มีสองราคา (`"350.00 บาท 450.00 บาท"`)
จะรวมกันเป็น `"350.00450.00"` แล้ว `parseFloat` หยุดที่จุดที่สอง ได้ `350.0045` ซึ่งผิด

---

## Deploy

push เข้า `main` → `.github/workflows/deploy.yml` build แล้วขึ้น GitHub Pages อัตโนมัติ

`.github/workflows/fetch-product-images.yml` รันด้วยมือ (workflow_dispatch) ใช้ตอนต้องโหลดรูป
จากอินเทอร์เน็ตมาเก็บใน repo - runner ของ GitHub ออกเน็ตได้

**sandbox ที่พัฒนาอยู่ถูก proxy บล็อก** เข้า `nidss.github.io` และเว็บภายนอกไม่ได้
จึงเปิดเว็บจริงมาตรวจเองไม่ได้ ต้องดูสถานะ workflow ผ่าน GitHub API แล้วบอกผู้ใช้ตามตรง
ว่ายืนยันจากสถานะ deploy ไม่ได้เปิดดูเอง

---

## ภาษาและสไตล์

UI และคอมเมนต์ในโค้ดเป็น **ภาษาไทยทั้งหมด**

สีแบรนด์เป็น token ของ Tailwind (`gp-red` `#dd3333`, `gp-ink` `#333946` และเฉดย่อย)
นิยามไว้ใน `@theme` ของ `src/index.css` - ใช้ token เสมอ ไม่ hardcode ค่าสี

ไอคอนเป็น inline SVG ใน `src/components/Icons.tsx` และกราฟใน `src/components/Charts.tsx`
เขียนเป็น SVG เอง - **ไม่มีไลบรารีไอคอนหรือกราฟในโปรเจกต์นี้ และไม่ควรเพิ่ม**

ชิ้นส่วน UI พื้นฐาน (`Button`, `Input`, `Field`, `Modal`, `Badge`, `Card`, `ReorderButtons`, `cx` ฯลฯ)
อยู่ใน `src/components/ui.tsx` - ใช้ของที่มีก่อนสร้างใหม่
รายการที่จัดลำดับได้ใช้ `moveBySortOrder` / `bySortOrder` จาก `src/lib/sortOrder.ts`

---

## บัญชีและคูปองสำหรับทดสอบ

| | |
|---|---|
| admin (`#/admin`) | `admin` / `admin1234` |
| สมาชิก | `demo@grandprix.test` / `demo1234` |
| คูปอง | `GP10` (ลด 10%) · `GP100` (ลด 100 ขั้นต่ำ 500) · `FREESHIP` · `EXPIRED` (ไว้ทดสอบเคสหมดอายุ) |
