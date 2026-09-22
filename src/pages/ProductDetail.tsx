// ── หน้ารายละเอียดสินค้า (เข้ามาจากการกดกล่องสินค้า) ─────────────────
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Container } from '../components/Layout'
import { ProductGrid } from '../components/ProductCard'
import { Badge, Button, ButtonLink, EmptyState, QtyPicker, SectionTitle, cx } from '../components/ui'
import { ReceiptIcon, ShieldIcon, TruckIcon } from '../components/Icons'
import { useCart, useCatalog } from '../store/AppStore'
import { baht, discountPercent, effectivePrice } from '../lib/format'
import { Img } from '../components/Img'

export function ProductDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { getProduct, activeProducts } = useCatalog()
  const { add } = useCart()

  const product = getProduct(id)
  const [imageIndex, setImageIndex] = useState(0)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  // รีเซ็ตสถานะเมื่อเปลี่ยนไปดูสินค้าตัวอื่น
  useEffect(() => {
    setImageIndex(0)
    setQty(1)
    setAdded(false)
  }, [id])

  // ซ่อนข้อความ "เพิ่มลงตะกร้าแล้ว" อัตโนมัติ
  useEffect(() => {
    if (!added) return
    const timer = window.setTimeout(() => setAdded(false), 2500)
    return () => window.clearTimeout(timer)
  }, [added])

  const related = useMemo(
    () =>
      product
        ? activeProducts.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4)
        : [],
    [activeProducts, product],
  )

  if (!product) {
    return (
      <Container className="py-16">
        <EmptyState
          title="ไม่พบสินค้าที่ต้องการ"
          description="สินค้านี้อาจถูกลบหรือปิดการขายไปแล้ว"
          action={<ButtonLink to="/products">ดูสินค้าทั้งหมด</ButtonLink>}
        />
      </Container>
    )
  }

  const price = effectivePrice(product.price, product.salePrice)
  const percent = discountPercent(product.price, product.salePrice)
  const soldOut = product.stock <= 0
  const maxQty = Math.max(1, product.stock)

  function handleAddToCart() {
    add(product!.id, qty)
    setAdded(true)
  }

  function handleBuyNow() {
    add(product!.id, qty)
    navigate('/cart')
  }

  return (
    <>
      <div className="border-b border-gp-line bg-white">
        <Container className="py-4 text-xs text-gp-ink-soft">
          <Link to="/" className="hover:text-gp-red">หน้าแรก</Link>
          {' / '}
          <Link to="/products" className="hover:text-gp-red">สินค้าทั้งหมด</Link>
          {' / '}
          <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-gp-red">
            {product.category}
          </Link>
          {' / '}
          <span className="text-gp-ink">{product.name}</span>
        </Container>
      </div>

      <Container className="py-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* แกลเลอรีรูปสินค้า (รองรับหลายรูป) */}
          <div>
            <div className="overflow-hidden rounded-lg border border-gp-line bg-white">
              <Img
                src={product.images[imageIndex] ?? product.images[0]}
                alt={`${product.name} รูปที่ ${imageIndex + 1}`}
                width={800}
                height={800}
                className="aspect-square w-full object-cover"
              />
            </div>
            {product.images.length > 1 && (
              <div className="mt-3 flex gap-3">
                {product.images.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setImageIndex(i)}
                    aria-label={`ดูรูปที่ ${i + 1}`}
                    aria-current={i === imageIndex}
                    className={cx(
                      'h-20 w-20 overflow-hidden rounded-md border-2 transition-colors',
                      i === imageIndex ? 'border-gp-red' : 'border-gp-line hover:border-gp-ink-soft',
                    )}
                  >
                    <Img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ข้อมูลสินค้าและปุ่มเพิ่มลงตะกร้า */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="slate">{product.category}</Badge>
              {product.recommended && <Badge tone="red">สินค้าแนะนำ</Badge>}
              {percent > 0 && <Badge tone="red">ลด {percent}%</Badge>}
            </div>

            <h1 className="mt-3 text-2xl font-bold leading-snug text-gp-ink sm:text-3xl">{product.name}</h1>
            <p className="mt-2 text-sm text-gp-ink-soft">รหัสสินค้า {product.sku}</p>

            <div className="mt-5 flex flex-wrap items-baseline gap-3 border-y border-gp-line py-5">
              <span className="tnum text-3xl font-bold text-gp-red sm:text-4xl">{baht(price)}</span>
              {percent > 0 && (
                <>
                  <span className="tnum text-lg text-gp-ink-soft line-through">{baht(product.price)}</span>
                  <Badge tone="red">ประหยัด {baht(product.price - price)}</Badge>
                </>
              )}
            </div>

            <p className="mt-4 text-sm">
              <span className="text-gp-ink-soft">สถานะสินค้า: </span>
              {soldOut ? (
                <span className="font-bold text-gp-red">สินค้าหมดชั่วคราว</span>
              ) : (
                <span className="font-bold text-emerald-600">
                  มีสินค้า คงเหลือ {product.stock.toLocaleString('th-TH')} ชิ้น
                </span>
              )}
            </p>

            {!soldOut && (
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <span className="text-sm font-semibold text-gp-ink">จำนวน</span>
                <QtyPicker value={qty} onChange={setQty} max={maxQty} />
                <span className="text-sm text-gp-ink-soft">สั่งได้สูงสุด {maxQty} ชิ้น</span>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="flex-1" disabled={soldOut} onClick={handleAddToCart}>
                {soldOut ? 'สินค้าหมด' : 'เพิ่มลงตะกร้า'}
              </Button>
              <Button size="lg" variant="dark" className="flex-1" disabled={soldOut} onClick={handleBuyNow}>
                ซื้อเลย
              </Button>
            </div>

            {added && (
              <p
                role="status"
                className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
              >
                เพิ่ม “{product.name}” จำนวน {qty} ชิ้นลงตะกร้าแล้ว —{' '}
                <Link to="/cart" className="underline">ไปที่ตะกร้าสินค้า</Link>
              </p>
            )}

            <ul className="mt-6 grid gap-3 rounded-lg bg-white p-4">
              {[
                { icon: TruckIcon, text: 'ส่งฟรีเมื่อซื้อครบ 1,500 ฿ จัดส่งภายใน 2–5 วันทำการ' },
                { icon: ShieldIcon, text: 'สินค้าลิขสิทธิ์แท้ รับประกันความพอใจ 7 วัน' },
                { icon: ReceiptIcon, text: 'ออกใบกำกับภาษีได้ทั้งบุคคลธรรมดาและนิติบุคคล' },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3 text-sm text-gp-ink-soft">
                  <Icon className="mt-0.5 h-4.5 w-4.5 shrink-0 text-gp-red" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* รายละเอียดสินค้า */}
        <section className="mt-12">
          <SectionTitle title="รายละเอียดสินค้า" />
          <div className="rounded-lg border border-gp-line bg-white p-6">
            {product.description.split('\n').filter(Boolean).map((paragraph, i) => (
              <p key={i} className="mb-3 text-sm leading-relaxed text-gp-ink-light last:mb-0">
                {paragraph}
              </p>
            ))}
            <dl className="mt-6 grid gap-x-8 gap-y-3 border-t border-gp-line pt-6 sm:grid-cols-2">
              {[
                ['รหัสสินค้า (SKU)', product.sku],
                ['หมวดหมู่', product.category],
                ['ราคาปกติ', baht(product.price)],
                ['จำนวนคงเหลือ', `${product.stock.toLocaleString('th-TH')} ชิ้น`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 text-sm">
                  <dt className="text-gp-ink-soft">{label}</dt>
                  <dd className="font-semibold text-gp-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {related.length > 0 && (
          <section className="mt-12">
            <SectionTitle title="สินค้าที่เกี่ยวข้อง" />
            <ProductGrid products={related} />
          </section>
        )}
      </Container>
    </>
  )
}
