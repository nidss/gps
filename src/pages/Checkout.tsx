// ── หน้าชำระเงิน: ที่อยู่จัดส่ง + คูปองส่วนลด + ออกใบกำกับภาษี ────────
import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Container, PageHeader } from '../components/Layout'
import { AddressFields, AddressView, EMPTY_ADDRESS, validateAddress, type AddressErrors } from '../components/AddressFields'
import { Alert, Badge, Button, Card, Checkbox, Field, Input, cx } from '../components/ui'
import { CheckIcon, TagIcon } from '../components/Icons'
import { FREE_SHIPPING_MIN, SHIPPING_FEE, VAT_RATE, useAuth, useCart, useCatalog, useOrders } from '../store/AppStore'
import type { Address, PaymentMethod, TaxInfo } from '../types'
import { baht } from '../lib/format'
import { PAYMENT_LABEL } from '../lib/orderStatus'
import { Img } from '../components/Img'

interface AppliedCoupon {
  code: string
  description: string
  discount: number
  freeShipping: boolean
}

const paymentOptions: Array<{ value: PaymentMethod; note: string }> = [
  { value: 'transfer', note: 'แจ้งโอนแล้วรอตรวจสอบยอด 1–2 ชั่วโมง' },
  { value: 'card', note: 'ตัดบัตรทันที ยืนยันคำสั่งซื้ออัตโนมัติ' },
  { value: 'cod', note: 'ชำระกับพนักงานส่งของ (มีค่าบริการตามจริง)' },
]

export function Checkout() {
  const { items, subtotal } = useCart()
  const { validateCoupon } = useCatalog()
  const { currentUser, isLoggedIn } = useAuth()
  const { createOrder } = useOrders()

  // ── ข้อมูลผู้สั่งซื้อและที่อยู่จัดส่ง (ดึงค่าเริ่มต้นจากโปรไฟล์) ──
  const [contact, setContact] = useState({
    name: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '',
    email: currentUser?.email ?? '',
    phone: currentUser?.phone ?? '',
  })
  const [shipping, setShipping] = useState<Address>(
    currentUser?.shipping ?? {
      ...EMPTY_ADDRESS,
      name: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '',
      phone: currentUser?.phone ?? '',
    },
  )

  // ── ใบกำกับภาษี ──
  const [wantTax, setWantTax] = useState(false)
  const [taxInfo, setTaxInfo] = useState<TaxInfo>(
    currentUser?.tax ?? { isCompany: false, taxId: '', branch: 'สำนักงานใหญ่', address: { ...EMPTY_ADDRESS } },
  )

  // ── คูปอง ──
  const [couponInput, setCouponInput] = useState('')
  const [couponError, setCouponError] = useState('')
  const [applied, setApplied] = useState<AppliedCoupon | null>(null)

  const [payment, setPayment] = useState<PaymentMethod>('transfer')
  // เก็บออเดอร์ที่เพิ่งสร้างไว้ เพื่อเปลี่ยนหน้าแบบ declarative
  // ถ้าสั่ง navigate() ในตัวจัดการอีเวนต์ การล้างตะกร้าจะ render ใหม่ก่อน
  // แล้ว <Navigate to="/cart"> ด้านล่างจะแย่งเปลี่ยนหน้าไปที่ตะกร้าแทน
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null)
  const [errors, setErrors] = useState<{
    contact?: Record<string, string>
    shipping?: AddressErrors
    tax?: AddressErrors & { taxId?: string }
    form?: string
  }>({})

  // ── คำนวณยอดเงิน ──
  const discount = applied?.discount ?? 0
  const afterDiscount = Math.max(0, subtotal - discount)
  const shippingFee = useMemo(() => {
    if (applied?.freeShipping) return 0
    return afterDiscount >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FEE
  }, [applied, afterDiscount])
  const total = afterDiscount + shippingFee
  // ราคาสินค้ารวม VAT แล้ว จึงถอด VAT ออกมาแสดงแยก
  const vatAmount = Math.round((total * VAT_RATE) / (1 + VAT_RATE))

  // สั่งซื้อสำเร็จแล้วให้ไปหน้ายืนยัน (ตรวจก่อนเงื่อนไขตะกร้าว่างเสมอ)
  if (placedOrderId) return <Navigate to={`/checkout/success/${placedOrderId}`} replace />

  // ตะกร้าว่างให้กลับไปหน้าตะกร้า
  if (items.length === 0) return <Navigate to="/cart" replace />

  function applyCoupon() {
    const result = validateCoupon(couponInput, subtotal)
    if (!result.ok) {
      setCouponError(result.error)
      setApplied(null)
      return
    }
    setCouponError('')
    setApplied({
      code: result.coupon.code,
      description: result.coupon.description,
      discount: result.discount,
      freeShipping: result.freeShipping,
    })
  }

  function removeCoupon() {
    setApplied(null)
    setCouponInput('')
    setCouponError('')
  }

  /** คัดลอกที่อยู่จัดส่งมาใช้เป็นที่อยู่ใบกำกับภาษี */
  function copyShippingToTax() {
    setTaxInfo((prev) => ({ ...prev, address: { ...shipping } }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const contactErrors: Record<string, string> = {}
    if (!contact.name.trim()) contactErrors.name = 'กรุณากรอกชื่อผู้สั่งซื้อ'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) contactErrors.email = 'กรุณากรอกอีเมลให้ถูกต้อง'
    if (!/^[0-9\s-]{9,}$/.test(contact.phone.trim())) contactErrors.phone = 'กรุณากรอกเบอร์โทรให้ถูกต้อง'

    const shippingErrors = validateAddress(shipping)

    let taxErrors: AddressErrors & { taxId?: string } = {}
    if (wantTax) {
      taxErrors = validateAddress(taxInfo.address, 'ชื่อผู้เสียภาษี')
      if (!/^\d{13}$/.test(taxInfo.taxId.trim())) {
        taxErrors.taxId = 'เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก'
      }
    }

    // ตรวจว่าจำนวนที่สั่งไม่เกินสต็อก
    const overStock = items.find((i) => i.qty > i.product.stock)

    const hasError =
      Object.keys(contactErrors).length > 0 ||
      Object.keys(shippingErrors).length > 0 ||
      Object.keys(taxErrors).length > 0 ||
      Boolean(overStock)

    if (hasError) {
      setErrors({
        contact: contactErrors,
        shipping: shippingErrors,
        tax: taxErrors,
        form: overStock
          ? `สินค้า “${overStock.product.name}” มีไม่พอ (คงเหลือ ${overStock.product.stock} ชิ้น)`
          : 'กรุณาตรวจสอบข้อมูลที่กรอกให้ครบถ้วน',
      })
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const order = createOrder({
      shipping,
      tax: wantTax ? taxInfo : null,
      couponCode: applied?.code ?? null,
      discount,
      shippingFee,
      paymentMethod: payment,
      customerName: contact.name.trim(),
      customerEmail: contact.email.trim(),
      customerPhone: contact.phone.trim(),
    })
    setPlacedOrderId(order.id)
  }

  return (
    <>
      <PageHeader title="ชำระเงิน" breadcrumb={<span>หน้าแรก / ตะกร้าสินค้า / ชำระเงิน</span>} />

      <Container className="py-8">
        {errors.form && (
          <div className="mb-6">
            <Alert>{errors.form}</Alert>
          </div>
        )}

        {!isLoggedIn && (
          <div className="mb-6">
            <Alert tone="amber">
              คุณกำลังสั่งซื้อแบบไม่เข้าสู่ระบบ —{' '}
              <Link to="/login" className="font-bold underline">เข้าสู่ระบบ</Link> หรือ{' '}
              <Link to="/register" className="font-bold underline">สมัครสมาชิก</Link>{' '}
              เพื่อบันทึกที่อยู่และดูประวัติคำสั่งซื้อย้อนหลัง
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="grid gap-6 lg:grid-cols-3">
          <div className="grid gap-6 lg:col-span-2">
            {/* ข้อมูลผู้สั่งซื้อ */}
            <Card className="p-5 sm:p-6">
              <h2 className="mb-4 text-base font-bold text-gp-ink">1. ข้อมูลผู้สั่งซื้อ</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="ชื่อ-นามสกุล" required error={errors.contact?.name}>
                  <Input
                    value={contact.name}
                    onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  />
                </Field>
                <Field label="อีเมล" required error={errors.contact?.email}>
                  <Input
                    type="email"
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    placeholder="name@example.com"
                  />
                </Field>
                <Field label="เบอร์โทรติดต่อ" required error={errors.contact?.phone}>
                  <Input
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                    inputMode="tel"
                    placeholder="08X-XXX-XXXX"
                  />
                </Field>
              </div>
            </Card>

            {/* ที่อยู่จัดส่ง */}
            <Card className="p-5 sm:p-6">
              <h2 className="mb-4 text-base font-bold text-gp-ink">2. ที่อยู่จัดส่ง</h2>
              <AddressFields
                idPrefix="ship"
                value={shipping}
                onChange={setShipping}
                errors={errors.shipping}
              />
            </Card>

            {/* ใบกำกับภาษี */}
            <Card className="p-5 sm:p-6">
              <h2 className="mb-4 text-base font-bold text-gp-ink">3. ใบกำกับภาษี</h2>
              <Checkbox
                checked={wantTax}
                onChange={setWantTax}
                label="ต้องการออกใบกำกับภาษี"
                description="ระบบจะจัดส่งใบกำกับภาษีแบบเต็มรูปตามที่อยู่ที่ระบุไว้ด้านล่าง"
              />

              {wantTax && (
                <div className="mt-5 border-t border-gp-line pt-5">
                  <div className="mb-4 flex flex-wrap gap-2">
                    {[
                      { value: false, label: 'บุคคลธรรมดา' },
                      { value: true, label: 'นิติบุคคล' },
                    ].map((option) => (
                      <button
                        key={String(option.value)}
                        type="button"
                        onClick={() => setTaxInfo({ ...taxInfo, isCompany: option.value })}
                        className={cx(
                          'rounded-md border-2 px-5 py-2 text-sm font-semibold transition-colors',
                          taxInfo.isCompany === option.value
                            ? 'border-gp-red bg-gp-red-tint text-gp-red-dark'
                            : 'border-gp-line bg-white text-gp-ink hover:border-gp-ink-soft',
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <div className="mb-4 grid gap-4 sm:grid-cols-2">
                    <Field
                      label="เลขประจำตัวผู้เสียภาษี (13 หลัก)"
                      required
                      error={errors.tax?.taxId}
                    >
                      <Input
                        value={taxInfo.taxId}
                        onChange={(e) => setTaxInfo({ ...taxInfo, taxId: e.target.value.replace(/\D/g, '') })}
                        inputMode="numeric"
                        maxLength={13}
                        placeholder="0105561000123"
                      />
                    </Field>
                    <Field label="สาขา" hint="ถ้าเป็นบุคคลธรรมดาให้ใส่ “สำนักงานใหญ่”">
                      <Input
                        value={taxInfo.branch}
                        onChange={(e) => setTaxInfo({ ...taxInfo, branch: e.target.value })}
                        placeholder="สำนักงานใหญ่"
                      />
                    </Field>
                  </div>

                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-gp-ink">ที่อยู่สำหรับออกใบกำกับภาษี</p>
                    <Button type="button" variant="ghost" size="sm" onClick={copyShippingToTax}>
                      ใช้ที่อยู่เดียวกับการจัดส่ง
                    </Button>
                  </div>

                  <AddressFields
                    idPrefix="tax"
                    value={taxInfo.address}
                    onChange={(address) => setTaxInfo({ ...taxInfo, address })}
                    errors={errors.tax}
                    nameLabel={taxInfo.isCompany ? 'ชื่อบริษัท/นิติบุคคล' : 'ชื่อผู้เสียภาษี'}
                  />
                </div>
              )}
            </Card>

            {/* วิธีชำระเงิน */}
            <Card className="p-5 sm:p-6">
              <h2 className="mb-4 text-base font-bold text-gp-ink">4. วิธีชำระเงิน</h2>
              <div className="grid gap-3">
                {paymentOptions.map(({ value, note }) => (
                  <label
                    key={value}
                    className={cx(
                      'flex cursor-pointer items-start gap-3 rounded-md border-2 p-4 transition-colors',
                      payment === value
                        ? 'border-gp-red bg-gp-red-tint/50'
                        : 'border-gp-line bg-white hover:border-gp-ink-soft',
                    )}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={value}
                      checked={payment === value}
                      onChange={() => setPayment(value)}
                      className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-gp-red"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-gp-ink">{PAYMENT_LABEL[value]}</span>
                      <span className="mt-0.5 block text-xs text-gp-ink-soft">{note}</span>
                    </span>
                  </label>
                ))}
              </div>
            </Card>
          </div>

          {/* สรุปคำสั่งซื้อ + คูปอง */}
          <div className="lg:col-span-1">
            <Card className="sticky top-28 p-5">
              <h2 className="text-base font-bold text-gp-ink">สรุปคำสั่งซื้อ</h2>

              <ul className="mt-4 grid max-h-60 gap-3 overflow-y-auto">
                {items.map(({ product, qty, lineTotal }) => (
                  <li key={product.id} className="flex gap-3">
                    <Img
                      src={product.images[0]}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-md border border-gp-line object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-xs font-semibold text-gp-ink">{product.name}</p>
                      <p className="tnum mt-0.5 text-xs text-gp-ink-soft">x{qty}</p>
                    </div>
                    <span className="tnum text-sm font-semibold text-gp-ink">{baht(lineTotal)}</span>
                  </li>
                ))}
              </ul>

              {/* ช่องใส่คูปองส่วนลด */}
              <div className="mt-5 border-t border-gp-line pt-5">
                <p className="mb-2 flex items-center gap-2 text-sm font-bold text-gp-ink">
                  <TagIcon className="h-4 w-4 text-gp-red" />
                  คูปองส่วนลด
                </p>

                {applied ? (
                  <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-emerald-800">{applied.code}</p>
                      <p className="text-xs text-emerald-700">{applied.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-xs font-semibold text-emerald-700 underline"
                    >
                      ยกเลิก
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <Input
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="กรอกรหัสคูปอง"
                        aria-label="รหัสคูปองส่วนลด"
                        className="uppercase"
                      />
                      <Button type="button" variant="dark" onClick={applyCoupon}>
                        ใช้โค้ด
                      </Button>
                    </div>
                    {couponError && <p className="mt-1.5 text-xs font-medium text-gp-red">{couponError}</p>}
                    <p className="mt-2 text-xs text-gp-ink-soft">
                      ลองใช้ <Badge tone="red">GP10</Badge> <Badge tone="red">GP100</Badge>{' '}
                      <Badge tone="red">FREESHIP</Badge>
                    </p>
                  </>
                )}
              </div>

              <dl className="mt-5 grid gap-2.5 border-t border-gp-line pt-5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gp-ink-soft">ยอดรวมสินค้า</dt>
                  <dd className="tnum font-semibold text-gp-ink">{baht(subtotal)}</dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-gp-ink-soft">ส่วนลดคูปอง</dt>
                    <dd className="tnum font-semibold text-gp-red">− {baht(discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-gp-ink-soft">ค่าจัดส่ง</dt>
                  <dd className="tnum font-semibold text-gp-ink">
                    {shippingFee === 0 ? 'ฟรี' : baht(shippingFee)}
                  </dd>
                </div>
                <div className="flex justify-between text-xs">
                  <dt className="text-gp-ink-soft">(ภาษีมูลค่าเพิ่ม 7% รวมในราคาแล้ว)</dt>
                  <dd className="tnum text-gp-ink-soft">{baht(vatAmount)}</dd>
                </div>
              </dl>

              <div className="mt-4 flex items-baseline justify-between border-t border-gp-line pt-4">
                <span className="text-sm font-bold text-gp-ink">ยอดที่ต้องชำระ</span>
                <span className="tnum text-2xl font-bold text-gp-red">{baht(total)}</span>
              </div>

              <Button type="submit" size="lg" className="mt-5 w-full">
                ยืนยันการสั่งซื้อ
              </Button>
              <p className="mt-3 text-center text-xs text-gp-ink-soft">
                การกดยืนยันถือว่ายอมรับเงื่อนไขการให้บริการ
              </p>
            </Card>
          </div>
        </form>

        {/* ตัวอย่างที่อยู่ที่บันทึกไว้ในโปรไฟล์ */}
        {currentUser?.shipping && (
          <div className="mt-6 rounded-lg border border-dashed border-gp-line bg-white p-5">
            <p className="mb-2 text-sm font-bold text-gp-ink">ที่อยู่จัดส่งที่บันทึกไว้ในบัญชี</p>
            <AddressView address={currentUser.shipping} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setShipping(currentUser.shipping!)}
            >
              ใช้ที่อยู่นี้
            </Button>
          </div>
        )}
      </Container>
    </>
  )
}
