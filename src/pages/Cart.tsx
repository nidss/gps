// ── หน้าตะกร้าสินค้า แสดงสินค้าที่กดเพิ่มมาจากปุ่ม "เพิ่มลงตะกร้า" ────
import { Link } from 'react-router-dom'
import { Container, PageHeader } from '../components/Layout'
import { Button, ButtonLink, Card, EmptyState, QtyPicker } from '../components/ui'
import { TrashIcon } from '../components/Icons'
import { FREE_SHIPPING_MIN, SHIPPING_FEE, useCart } from '../store/AppStore'
import { baht, discountPercent } from '../lib/format'
import { Img } from '../components/Img'

export function Cart() {
  const { items, count, subtotal, setQty, remove } = useCart()

  const shippingFee = subtotal >= FREE_SHIPPING_MIN || subtotal === 0 ? 0 : SHIPPING_FEE
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_MIN - subtotal)

  if (items.length === 0) {
    return (
      <>
        <PageHeader title="ตะกร้าสินค้า" breadcrumb={<span>หน้าแรก / ตะกร้าสินค้า</span>} />
        <Container className="py-12">
          <EmptyState
            title="ตะกร้าของคุณยังว่างอยู่"
            description="เลือกสินค้าที่ชอบแล้วกด “เพิ่มลงตะกร้า” สินค้าจะมาแสดงที่หน้านี้"
            action={<ButtonLink to="/products" size="lg">เลือกซื้อสินค้า</ButtonLink>}
          />
        </Container>
      </>
    )
  }

  return (
    <>
      <PageHeader title="ตะกร้าสินค้า" breadcrumb={<span>หน้าแรก / ตะกร้าสินค้า</span>} />

      <Container className="py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* รายการสินค้าในตะกร้า */}
          <div className="lg:col-span-2">
            <Card>
              <div className="border-b border-gp-line px-5 py-4">
                <p className="text-sm font-semibold text-gp-ink">
                  สินค้าในตะกร้า <span className="tnum text-gp-ink-soft">({count} ชิ้น)</span>
                </p>
              </div>

              <ul>
                {items.map(({ product, qty, unitPrice, lineTotal }) => {
                  const percent = discountPercent(product.price, product.salePrice)
                  return (
                    <li key={product.id} className="flex gap-4 border-b border-gp-line p-4 last:border-b-0 sm:p-5">
                      <Link
                        to={`/product/${product.id}`}
                        className="h-24 w-24 shrink-0 overflow-hidden rounded-md border border-gp-line bg-gp-surface sm:h-28 sm:w-28"
                      >
                        <Img
                          src={product.images[0]}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      </Link>

                      <div className="flex min-w-0 flex-1 flex-col">
                        <Link
                          to={`/product/${product.id}`}
                          className="line-clamp-2 text-sm font-semibold text-gp-ink hover:text-gp-red"
                        >
                          {product.name}
                        </Link>
                        <p className="mt-1 text-xs text-gp-ink-soft">รหัส {product.sku}</p>

                        <div className="mt-1.5 flex items-baseline gap-2">
                          <span className="tnum text-sm font-bold text-gp-red">{baht(unitPrice)}</span>
                          {percent > 0 && (
                            <span className="tnum text-xs text-gp-ink-soft line-through">{baht(product.price)}</span>
                          )}
                        </div>

                        <div className="mt-auto flex flex-wrap items-center gap-3 pt-3">
                          <QtyPicker
                            value={qty}
                            onChange={(n) => setQty(product.id, n)}
                            max={Math.max(1, product.stock)}
                            size="sm"
                          />
                          <button
                            type="button"
                            onClick={() => remove(product.id)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gp-ink-soft transition-colors hover:text-gp-red"
                          >
                            <TrashIcon className="h-4 w-4" />
                            ลบออก
                          </button>
                          <span className="tnum ml-auto text-base font-bold text-gp-ink">{baht(lineTotal)}</span>
                        </div>

                        {qty > product.stock && (
                          <p className="mt-2 text-xs font-medium text-gp-red">
                            สินค้าคงเหลือ {product.stock} ชิ้น กรุณาลดจำนวนก่อนสั่งซื้อ
                          </p>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </Card>

            <div className="mt-4">
              <Link to="/products" className="text-sm font-semibold text-gp-red hover:underline">
                ← เลือกซื้อสินค้าต่อ
              </Link>
            </div>
          </div>

          {/* สรุปยอด */}
          <div className="lg:col-span-1">
            <Card className="sticky top-28 p-5">
              <h2 className="text-base font-bold text-gp-ink">สรุปคำสั่งซื้อ</h2>

              <dl className="mt-4 grid gap-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gp-ink-soft">ยอดรวมสินค้า</dt>
                  <dd className="tnum font-semibold text-gp-ink">{baht(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gp-ink-soft">ค่าจัดส่ง</dt>
                  <dd className="tnum font-semibold text-gp-ink">
                    {shippingFee === 0 ? 'ฟรี' : baht(shippingFee)}
                  </dd>
                </div>
              </dl>

              {remainingForFreeShipping > 0 && (
                <p className="mt-3 rounded-md bg-gp-red-tint px-3 py-2 text-xs font-medium text-gp-red-dark">
                  ซื้อเพิ่มอีก {baht(remainingForFreeShipping)} รับสิทธิ์ส่งฟรี
                </p>
              )}

              <div className="mt-4 flex items-baseline justify-between border-t border-gp-line pt-4">
                <span className="text-sm font-bold text-gp-ink">ยอดที่ต้องชำระ</span>
                <span className="tnum text-2xl font-bold text-gp-red">{baht(subtotal + shippingFee)}</span>
              </div>
              <p className="mt-1 text-right text-xs text-gp-ink-soft">ใช้คูปองส่วนลดได้ที่หน้าชำระเงิน</p>

              <ButtonLink to="/checkout" size="lg" className="mt-5 w-full">
                ดำเนินการชำระเงิน
              </ButtonLink>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 w-full"
                onClick={() => items.forEach((i) => remove(i.product.id))}
              >
                ล้างตะกร้าทั้งหมด
              </Button>
            </Card>
          </div>
        </div>
      </Container>
    </>
  )
}
