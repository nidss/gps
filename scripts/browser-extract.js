/**
 * ── ตัวดึงข้อมูลสินค้าผ่าน DevTools Console ────────────────────────
 *
 * ใช้เมื่อเครื่องที่รัน scraper เข้าเว็บร้านไม่ได้ ให้ดึงจากเบราว์เซอร์ของคุณแทน
 *
 * ต่างจากการ fetch HTML ดิบตรงที่สคริปต์นี้เปิดหน้าสินค้าใน iframe
 * แล้วรอให้ JavaScript ของร้านเรนเดอร์เสร็จก่อนค่อยอ่าน จึงได้คำบรรยาย
 * รหัสสินค้า และตัวเลือกสินค้า ซึ่งไม่มีอยู่ใน HTML ดิบ
 *
 * วิธีใช้
 *   1. เปิดหน้าหมวดหมู่ของร้าน เช่น
 *      https://www.rodlifestore.com/category/286464
 *   2. กด F12 เปิด DevTools แล้วไปแท็บ Console
 *   3. วางโค้ดทั้งไฟล์นี้ลงไป กด Enter แล้วรอจนขึ้น "เสร็จแล้ว"
 *      (ใช้เวลาประมาณ 3–5 วินาทีต่อสินค้าหนึ่งชิ้น)
 *   4. ผลลัพธ์จะถูกคัดลอกลงคลิปบอร์ดให้อัตโนมัติ — เอามาวางในแชทได้เลย
 *
 * สคริปต์นี้แค่อ่านหน้าเว็บในเบราว์เซอร์ของคุณเอง ไม่ส่งข้อมูลไปที่ไหน
 */
(async () => {
  // ── ตั้งค่า ──
  const LIMIT = 40          // ดึงมาไม่เกินกี่ชิ้น
  const RENDER_TIMEOUT = 15000 // รอเนื้อหาในหน้าสินค้านานสุดกี่มิลลิวินาที
  const POLL = 250          // เช็กเนื้อหาใน iframe ทุกกี่มิลลิวินาที
  const SETTLE = 300        // รอเพิ่มหลังเจอเนื้อหาแล้ว เผื่อเรนเดอร์ยังไม่จบ
  const GAP = 500           // เว้นระยะระหว่างสินค้าแต่ละชิ้น

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const abs = (u) => { try { return new URL(u, location.href).href } catch { return null } }

  /**
   * จับ "ตัวเลขตัวแรก" ในข้อความ
   * ห้ามตัดอักขระที่ไม่ใช่ตัวเลขทิ้งทั้งหมด เพราะข้อความที่มีสองราคา
   * เช่น "350.00 บาท 450.00 บาท" จะรวมกันเป็น "350.00450.00"
   * แล้ว parseFloat หยุดที่จุดที่สอง ได้ 350.0045 ซึ่งผิด
   */
  const toNum = (v) => {
    if (v == null) return null
    if (typeof v === 'number') return Number.isFinite(v) ? v : null
    const m = String(v).replace(/,/g, '').match(/\d+(?:\.\d+)?/)
    if (!m) return null
    const n = parseFloat(m[0])
    return Number.isFinite(n) && n > 0 ? n : null
  }

  const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim()

  /** อ่านก้อน JSON-LD ทั้งหมดในเอกสาร */
  const jsonLd = (doc) => {
    const out = []
    doc.querySelectorAll('script[type="application/ld+json"]').forEach((el) => {
      try {
        const p = JSON.parse(el.textContent)
        out.push(...(Array.isArray(p) ? p : [p]))
      } catch {}
    })
    return out.flatMap((b) => (b['@graph'] ? b['@graph'] : [b]))
  }
  const isType = (n, t) => [].concat(n?.['@type'] ?? []).includes(t)

  /**
   * คำบรรยายแบบ ReadyPlanet
   * โครงสร้างคือ .product-description-area > div.description หลายก้อน
   * ก้อนแรกเป็นบรรทัด "รหัสสินค้า : XXX" และมีกล่องสั่งซื้อคั่นกลาง
   */
  const descriptionOf = (doc) => {
    const parts = []
    doc.querySelectorAll('.product-description-area .description').forEach((el) => {
      const t = clean(el.textContent)
      if (t && !/^รหัสสินค้า\s*:/.test(t)) parts.push(t)
    })
    if (parts.length) return parts.join('\n\n')
    const p = jsonLd(doc).find((n) => isType(n, 'Product'))
    return clean(p?.description || doc.querySelector('meta[property="og:description"]')?.content || '')
  }

  // ── เก็บข้อมูลจากการ์ดในหน้าหมวดหมู่ (ราคาครบและเชื่อถือได้) ──
  const cards = new Map()
  document.querySelectorAll('li.product-card, .product-card').forEach((el) => {
    const url = abs(el.querySelector('a[href*="/product/"]')?.getAttribute('href'))
    if (!url) return
    const special = toNum(el.querySelector('.product-price-special')?.textContent)
    const original = toNum(el.querySelector('.product-price-original')?.textContent)
    const im = el.querySelector('img')
    cards.set(url.split('#')[0], {
      name: clean(el.querySelector('.product-name')?.textContent),
      price: original && special && special < original ? original : (special ?? original),
      salePrice: original && special && special < original ? special : null,
      image: abs(im?.getAttribute('data-src') || im?.getAttribute('src')),
    })
  })

  // ── รวมลิงก์สินค้าทั้งหมด ──
  const links = new Set(cards.keys())
  for (const node of jsonLd(document)) {
    if (isType(node, 'ItemList')) {
      for (const it of node.itemListElement ?? []) {
        const u = abs(it?.url ?? it?.item?.url ?? it?.item)
        if (u) links.add(u.split('#')[0])
      }
    }
  }
  const patterns = [/\/product\//i, /\/products\//i, /\/item\//i, /[?&]product_id=/i]
  document.querySelectorAll('a[href]').forEach((a) => {
    const u = abs(a.getAttribute('href'))
    if (u && patterns.some((re) => re.test(u))) links.add(u.split('#')[0])
  })

  const list = [...links].slice(0, LIMIT)
  if (list.length === 0) {
    console.warn('หาลิงก์สินค้าไม่เจอ — ส่ง HTML ของหน้านี้มาให้ปรับ selector แทนครับ')
    return
  }
  console.log(`พบสินค้า ${list.length} รายการ กำลังเปิดทีละหน้าเพื่อรอ JavaScript เรนเดอร์...`)

  /**
   * เปิด url ใน iframe รอให้เรนเดอร์เสร็จ แล้วให้ callback อ่านข้อมูลออกมา
   *
   * ไม่รออีเวนต์ load เพราะมันจะยิงก็ต่อเมื่อทรัพยากรภายนอกทุกตัวโหลดจบ
   * สคริปต์ analytics ที่ช้าหรือโหลดไม่ขึ้นตัวเดียวก็ทำให้ค้างได้
   * จึงใช้วิธีวนเช็กเนื้อหาใน iframe แทน ได้เนื้อหาครบเมื่อไหร่ก็อ่านทันที
   */
  async function withRenderedPage(url, read) {
    const frame = document.createElement('iframe')
    frame.setAttribute('aria-hidden', 'true')
    frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:1280px;height:900px;border:0;opacity:0;'
    frame.src = url
    document.body.appendChild(frame)

    try {
      const deadline = Date.now() + RENDER_TIMEOUT
      let loaded = null

      while (Date.now() < deadline) {
        let doc
        try {
          doc = frame.contentDocument
        } catch {
          throw new Error('อ่านเนื้อหาใน iframe ไม่ได้ (ถูกบล็อกด้วย X-Frame-Options)')
        }

        // ข้ามช่วงที่ยังเป็น about:blank ก่อนเริ่มโหลดหน้าจริง
        if (doc && doc.body && doc.location.href !== 'about:blank') {
          loaded = doc
          // คำบรรยายโผล่แล้วแปลว่า JavaScript ของร้านเรนเดอร์เสร็จ
          if (descriptionOf(doc).length > 0) {
            await sleep(SETTLE)
            return read(doc)
          }
        }
        await sleep(POLL)
      }

      // หมดเวลารอคำบรรยาย แต่ถ้าหน้าโหลดมาแล้วก็อ่านเท่าที่มี
      if (loaded?.body) {
        return read(loaded)
      }
      throw new Error('โหลดหน้าไม่ทันเวลา')
    } finally {
      frame.remove()
    }
  }

  /** อ่านรายละเอียดจากเอกสารที่เรนเดอร์เสร็จแล้ว */
  const readProduct = (doc, url) => {
    const p = jsonLd(doc).find((n) => isType(n, 'Product'))
    const bodyText = clean(doc.body?.textContent)

    const images = new Set()
    for (const i of [].concat(p?.image ?? [])) {
      const u = abs(typeof i === 'string' ? i : i?.url)
      if (u) images.add(u)
    }
    const og = abs(doc.querySelector('meta[property="og:image"]')?.content)
    if (og) images.add(og)
    doc.querySelectorAll('.product-images-area img, [class*="gallery"] img, [class*="thumb"] img, .product-image img')
      .forEach((im) => {
        const u = abs(im.getAttribute('data-src') || im.getAttribute('data-original') || im.getAttribute('src'))
        if (u && !/placeholder|loading|blank|spinner/i.test(u)) images.add(u)
      })

    // ตัวเลือกสินค้า เช่น ไซซ์ หรือสี
    const variants = [...doc.querySelectorAll('.product-variant-attr-value-label, .product-variant-attr-value option')]
      .map((el) => clean(el.textContent))
      // ป้าย "กรุณาเลือก" และป้ายรวมทุกตัวเลือกไม่ใช่ค่าที่เลือกได้จริง
      .filter((t) => t && !/^กรุณาเลือก/.test(t))

    return {
      url,
      name: clean(p?.name || doc.querySelector('.product-title')?.textContent ||
        doc.querySelector('meta[property="og:title"]')?.content || doc.querySelector('h1')?.textContent),
      sku: clean(p?.sku ?? p?.mpn ?? bodyText.match(/รหัสสินค้า\s*:?\s*([A-Za-z0-9._-]{3,30})/)?.[1] ?? ''),
      category: clean(p?.category ?? ''),
      description: descriptionOf(doc).slice(0, 1200),
      variants: [...new Set(variants)],
      outOfStock: /สินค้าหมด/.test(bodyText),
      images: [...images].slice(0, 6),
      price: null,
      salePrice: null,
    }
  }

  const products = []
  let iframeBlocked = false

  for (const [i, url] of list.entries()) {
    const label = `[${i + 1}/${list.length}]`
    try {
      const item = await withRenderedPage(url, (doc) => readProduct(doc, url))

      // ราคาจากการ์ดในหน้าหมวดหมู่เชื่อถือได้กว่า ให้ทับค่าที่อ่านจากหน้าสินค้า
      const card = cards.get(url)
      if (card) {
        item.name = card.name || item.name
        item.price = card.price
        item.salePrice = card.salePrice
        if (card.image && !item.images.includes(card.image)) item.images.push(card.image)
      }

      // หน้าที่ให้ 404 หรือหน้า error จะไม่มีทั้งราคาและคำบรรยาย ให้ข้ามไป
      // ไม่งั้นจะได้สินค้าขยะชื่อแปลก ๆ อย่าง "Error response" ติดมาด้วย
      if (!item.name || (!item.price && !item.description)) {
        console.warn(`  ${label} ข้าม — ไม่ใช่หน้าสินค้า (${url})`)
        await sleep(GAP)
        continue
      }

      products.push(item)
      const gotDesc = item.description ? `คำบรรยาย ${item.description.length} ตัวอักษร` : 'ไม่ได้คำบรรยาย'
      console.log(`  ${label} ${item.name || '(ไม่มีชื่อ)'} — ${item.price ?? '?'} บาท · ${gotDesc}`)
    } catch (err) {
      if (/X-Frame-Options|อ่านเนื้อหาใน iframe/.test(err.message)) iframeBlocked = true
      console.warn(`  ${label} ผิดพลาด: ${err.message}`)
    }
    await sleep(GAP)
  }

  if (iframeBlocked) {
    console.warn('\nร้านนี้บล็อกการเปิดในกรอบ (X-Frame-Options) จึงอ่านคำบรรยายไม่ได้')
    console.warn('ให้เปิดหน้าสินค้าทีละหน้าแล้ว copy(document.documentElement.outerHTML) แทน')
  }

  const withDesc = products.filter((p) => p.description).length
  const result = {
    source: location.href,
    categoryName: clean(document.querySelector('h1')?.textContent),
    scrapedAt: new Date().toISOString(),
    count: products.length,
    withDescription: withDesc,
    products,
  }

  const json = JSON.stringify(result, null, 2)
  console.log(`\nเสร็จแล้ว — ได้สินค้า ${products.length} รายการ (มีคำบรรยาย ${withDesc} รายการ)`)
  try {
    copy(json)
    console.log('คัดลอกลงคลิปบอร์ดให้แล้ว เอาไปวางในแชทได้เลย')
  } catch {
    console.log('คัดลอกอัตโนมัติไม่ได้ ให้ copy จากบรรทัดล่างนี้แทน')
  }
  console.log(json)
  return result
})()
