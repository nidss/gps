/**
 * ── ตัวดึงข้อมูลสินค้าผ่าน DevTools Console ────────────────────────
 *
 * ใช้เมื่อเครื่องที่รัน Claude เข้าเว็บร้านไม่ได้ ให้ดึงจากเบราว์เซอร์ของคุณแทน
 *
 * วิธีใช้
 *   1. เปิดหน้าหมวดหมู่ของร้าน เช่น
 *      https://www.rodlifestore.com/category/286464
 *   2. กด F12 เปิด DevTools แล้วไปแท็บ Console
 *   3. วางโค้ดทั้งไฟล์นี้ลงไป กด Enter แล้วรอจนขึ้น "เสร็จแล้ว"
 *   4. ผลลัพธ์จะถูกคัดลอกลงคลิปบอร์ดให้อัตโนมัติ — เอามาวางในแชทได้เลย
 *
 * สคริปต์นี้แค่อ่านหน้าเว็บในเบราว์เซอร์ของคุณเอง ไม่ส่งข้อมูลไปที่ไหน
 */
(async () => {
  const DELAY = 600        // หน่วงเวลาระหว่างการโหลดแต่ละหน้า (มิลลิวินาที)
  const LIMIT = 40         // ดึงมาไม่เกินกี่ชิ้น
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

  const abs = (u) => { try { return new URL(u, location.href).href } catch { return null } }

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

  const toNum = (v) => {
    if (v == null) return null
    if (typeof v === 'number') return Number.isFinite(v) ? v : null
    const n = parseFloat(String(v).replace(/[^\d.]/g, ''))
    return Number.isFinite(n) && n > 0 ? n : null
  }

  // ── เก็บลิงก์สินค้าจากหน้าหมวดหมู่ ──
  const links = new Set()
  for (const node of jsonLd(document)) {
    if (isType(node, 'ItemList')) {
      for (const it of node.itemListElement ?? []) {
        const u = abs(it?.url ?? it?.item?.url ?? it?.item)
        if (u) links.add(u)
      }
    }
  }
  const patterns = [/\/product\//i, /\/products\//i, /\/item\//i, /\/p\//i, /[?&]product_id=/i]
  document.querySelectorAll('a[href]').forEach((a) => {
    const u = abs(a.getAttribute('href'))
    if (u && patterns.some((re) => re.test(u))) links.add(u.split('#')[0])
  })

  const list = [...links].slice(0, LIMIT)
  console.log(`พบลิงก์สินค้า ${list.length} รายการ กำลังไล่อ่านทีละหน้า...`)

  if (list.length === 0) {
    console.warn('หาลิงก์สินค้าไม่เจอ — ส่ง HTML ของหน้านี้มาให้ปรับ selector แทนครับ')
    return
  }

  /** อ่านรายละเอียดจากหน้าสินค้าหนึ่งหน้า */
  const parse = (doc, url) => {
    const p = jsonLd(doc).find((n) => isType(n, 'Product'))
    const q = (sel) => doc.querySelector(sel)
    const meta = (prop) => q(`meta[property="${prop}"]`)?.content

    const offers = Array.isArray(p?.offers) ? p.offers[0] : p?.offers
    let price = toNum(offers?.price ?? offers?.lowPrice)
    let salePrice = null

    const strike = toNum(
      q('del, s, .price-old, .old-price, .original-price, .regular-price, [class*="price-before"]')?.textContent,
    )
    const shown = toNum(
      q('.price-new, .new-price, .sale-price, .special-price, [class*="price-now"], [itemprop="price"]')?.textContent,
    )
    if (strike && shown && shown < strike) { price = strike; salePrice = shown }
    else if (strike && price && price < strike) { salePrice = price; price = strike }
    if (!price) price = shown ?? toNum(q('[class*="price"]')?.textContent)

    const images = new Set()
    for (const i of [].concat(p?.image ?? [])) {
      const u = abs(typeof i === 'string' ? i : i?.url)
      if (u) images.add(u)
    }
    const og = abs(meta('og:image'))
    if (og) images.add(og)
    doc.querySelectorAll('[class*="gallery"] img, [class*="thumb"] img, [id*="gallery"] img, .product-image img')
      .forEach((im) => {
        const u = abs(im.getAttribute('data-src') || im.getAttribute('data-original') || im.getAttribute('src'))
        if (u && !/placeholder|loading|blank|spinner/i.test(u)) images.add(u)
      })

    return {
      url,
      name: (p?.name || meta('og:title') || q('h1')?.textContent || '').trim(),
      sku: String(p?.sku ?? p?.mpn ?? '').trim(),
      category: String(p?.category ?? '').trim(),
      description: String(
        p?.description || meta('og:description') || q('meta[name="description"]')?.content || '',
      ).replace(/\s+/g, ' ').trim().slice(0, 800),
      price,
      salePrice,
      images: [...images].slice(0, 5),
    }
  }

  const products = []
  for (const [i, url] of list.entries()) {
    try {
      const res = await fetch(url, { credentials: 'same-origin' })
      const doc = new DOMParser().parseFromString(await res.text(), 'text/html')
      const item = parse(doc, url)
      products.push(item)
      console.log(`  [${i + 1}/${list.length}] ${item.name || '(ไม่มีชื่อ)'} — ${item.price ?? '?'} บาท`)
    } catch (err) {
      console.warn(`  [${i + 1}/${list.length}] ผิดพลาด: ${err.message}`)
    }
    await sleep(DELAY)
  }

  const result = {
    source: location.href,
    categoryName: (document.querySelector('h1')?.textContent || '').trim(),
    scrapedAt: new Date().toISOString(),
    count: products.length,
    products,
  }

  const json = JSON.stringify(result, null, 2)
  console.log(`\nเสร็จแล้ว — ได้สินค้า ${products.length} รายการ`)
  try {
    copy(json)
    console.log('คัดลอกลงคลิปบอร์ดให้แล้ว เอาไปวางในแชทได้เลย')
  } catch {
    console.log('คัดลอกอัตโนมัติไม่ได้ ให้ copy จากบรรทัดล่างนี้แทน')
  }
  console.log(json)
  return result
})()
