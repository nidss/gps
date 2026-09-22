// ── หน้าชำระเงินสำเร็จ ──────────────────────────────────────────────
import { Link, useParams } from 'react-router-dom'
import { Container } from '../components/Layout'
import { AddressView } from '../components/AddressFields'
import { Badge, ButtonLink, Card, EmptyState } from '../components/ui'
import { CheckIcon } from '../components/Icons'
import { useOrders } from '../store/AppStore'
import { baht, thaiDateTime } from '../lib/format'
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, PAYMENT_LABEL } from '../lib/orderStatus'
import { Img } from '../components/Img'

export function CheckoutSuccess() {
  const { orderId = '' } = useParams()
  const { getOrder } = useOrders()
  const order = getOrder(orderId)

  if (!order) {
    return (
      <Container className="py-16">
        <EmptyState
          title="ไม่พบคำสั่งซื้อนี้"
          description="คำสั่งซื้ออาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง"
          action={<ButtonLink to="/products">กลับไปเลือกซื้อสินค้า</ButtonLink>}
        />
      </Container>
    )
  }

  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        {/* แถบยืนยันความสำเร็จ */}
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-8 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white">
            <CheckIcon className="h-9 w-9" />
          </span>
          <h1 className="mt-5 text-2xl font-bold text-emerald-900 sm:text-3xl">สั่งซื้อสำเร็จแล้ว</h1>
          <p className="mt-2 text-sm text-emerald-800">
            ขอบคุณที่สั่งซื้อสินค้ากับ Grandprix Online เราได้รับคำสั่งซื้อของคุณเรียบร้อยแล้ว
          </p>
          <p className="mt-5 inline-block rounded-md border border-emerald-300 bg-white px-5 py-2.5">
            <span className="text-xs text-gp-ink-soft">เลขที่คำสั่งซื้อ</span>
            <span className="tnum ml-2 text-lg font-bold text-gp-ink">{order.code}</span>
          </p>
        </div>

        {order.status === 'pending' && (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-bold text-amber-900">ขั้นตอนถัดไป: ชำระเงิน</p>
            <p className="mt-1.5 text-sm leading-relaxed text-amber-800">
              {order.paymentMethod === 'cod'
                ? 'กรุณาเตรียมเงินสดให้พนักงานจัดส่งเมื่อได้รับสินค้า'
                : `โอนเงินจำนวน ${baht(order.total)} มาที่ ธนาคารกรุงเทพ เลขที่บัญชี 123-4-56789-0 ชื่อบัญชี บจก. แกรนด์ปรีซ์ ออนไลน์ แล้วแจ้งสลิปกลับมาที่ LINE @grandprixonline`}
            </p>
          </div>
        )}

        {/* สรุปคำสั่งซื้อ */}
        <Card className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gp-line px-5 py-4">
            <div>
              <p className="text-sm font-bold text-gp-ink">รายละเอียดคำสั่งซื้อ</p>
              <p className="mt-0.5 text-xs text-gp-ink-soft">สั่งเมื่อ {thaiDateTime(order.createdAt)}</p>
            </div>
            <Badge tone={ORDER_STATUS_TONE[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
          </div>

          <ul className="divide-y divide-gp-line">
            {order.lines.map((line) => (
              <li key={line.productId} className="flex items-center gap-4 px-5 py-4">
                <Link
                  to={`/product/${line.productId}`}
                  className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-gp-line"
                >
                  <Img src={line.image} alt="" className="h-full w-full object-cover" />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold text-gp-ink">{line.name}</p>
                  <p className="tnum mt-0.5 text-xs text-gp-ink-soft">
                    {baht(line.unitPrice)} × {line.qty}
                  </p>
                </div>
                <span className="tnum text-sm font-bold text-gp-ink">{baht(line.unitPrice * line.qty)}</span>
              </li>
            ))}
          </ul>

          <dl className="grid gap-2.5 border-t border-gp-line px-5 py-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-gp-ink-soft">ยอดรวมสินค้า</dt>
              <dd className="tnum font-semibold text-gp-ink">{baht(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-gp-ink-soft">
                  ส่วนลดคูปอง {order.couponCode && <Badge tone="red">{order.couponCode}</Badge>}
                </dt>
                <dd className="tnum font-semibold text-gp-red">− {baht(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gp-ink-soft">ค่าจัดส่ง</dt>
              <dd className="tnum font-semibold text-gp-ink">
                {order.shippingFee === 0 ? 'ฟรี' : baht(order.shippingFee)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gp-ink-soft">วิธีชำระเงิน</dt>
              <dd className="font-semibold text-gp-ink">{PAYMENT_LABEL[order.paymentMethod]}</dd>
            </div>
            <div className="mt-1 flex items-baseline justify-between border-t border-gp-line pt-3">
              <dt className="font-bold text-gp-ink">ยอดสุทธิ</dt>
              <dd className="tnum text-xl font-bold text-gp-red">{baht(order.total)}</dd>
            </div>
          </dl>
        </Card>

        {/* ที่อยู่จัดส่งและใบกำกับภาษี */}
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <Card className="p-5">
            <p className="mb-3 text-sm font-bold text-gp-ink">ที่อยู่จัดส่ง</p>
            <AddressView address={order.shipping} />
          </Card>

          <Card className="p-5">
            <p className="mb-3 text-sm font-bold text-gp-ink">ใบกำกับภาษี</p>
            {order.tax ? (
              <>
                <p className="mb-2 text-xs text-gp-ink-soft">
                  {order.tax.isCompany ? 'นิติบุคคล' : 'บุคคลธรรมดา'} · เลขประจำตัวผู้เสียภาษี{' '}
                  <span className="tnum font-semibold text-gp-ink">{order.tax.taxId}</span>
                  {order.tax.branch && ` · ${order.tax.branch}`}
                </p>
                <AddressView address={order.tax.address} />
              </>
            ) : (
              <p className="text-sm text-gp-ink-soft">ไม่ได้ขอออกใบกำกับภาษีสำหรับคำสั่งซื้อนี้</p>
            )}
          </Card>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <ButtonLink to="/account?tab=orders" variant="outline" size="lg">
            ดูประวัติการสั่งซื้อ
          </ButtonLink>
          <ButtonLink to="/products" size="lg">เลือกซื้อสินค้าต่อ</ButtonLink>
        </div>
      </div>
    </Container>
  )
}
