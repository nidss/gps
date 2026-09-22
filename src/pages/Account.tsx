// ── หน้าข้อมูลส่วนตัว: ข้อมูลติดต่อ, ที่อยู่จัดส่ง, ที่อยู่ใบกำกับภาษี ──
import { useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { Container, PageHeader } from '../components/Layout'
import { AddressFields, EMPTY_ADDRESS, validateAddress, type AddressErrors } from '../components/AddressFields'
import { Alert, Badge, Button, ButtonLink, Card, Field, Input, cx } from '../components/ui'
import { useAuth, useOrders } from '../store/AppStore'
import type { Address, TaxInfo } from '../types'
import { asset } from '../lib/asset'
import { baht, thaiDate, thaiDateTime } from '../lib/format'
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, PAYMENT_LABEL } from '../lib/orderStatus'

type Tab = 'profile' | 'shipping' | 'tax' | 'orders'

const tabs: Array<{ key: Tab; label: string }> = [
  { key: 'profile', label: 'ข้อมูลติดต่อ' },
  { key: 'shipping', label: 'ที่อยู่จัดส่ง' },
  { key: 'tax', label: 'ที่อยู่ออกใบกำกับภาษี' },
  { key: 'orders', label: 'ประวัติการสั่งซื้อ' },
]

export function Account() {
  const [params, setParams] = useSearchParams()
  const { currentUser, isLoggedIn, updateProfile, logout } = useAuth()
  const { myOrders } = useOrders()

  const tab = (params.get('tab') as Tab) || 'profile'
  const [saved, setSaved] = useState('')

  // ซ่อนข้อความ "บันทึกแล้ว" อัตโนมัติ
  useEffect(() => {
    if (!saved) return
    const timer = window.setTimeout(() => setSaved(''), 3000)
    return () => window.clearTimeout(timer)
  }, [saved])

  if (!isLoggedIn || !currentUser) {
    return <Navigate to="/login" state={{ from: '/account' }} replace />
  }

  function setTab(next: Tab) {
    const p = new URLSearchParams(params)
    p.set('tab', next)
    setParams(p, { replace: true })
    setSaved('')
  }

  return (
    <>
      <PageHeader title="ข้อมูลส่วนตัว" breadcrumb={<span>หน้าแรก / บัญชีของฉัน</span>} />

      <Container className="py-8">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* เมนูด้านข้าง */}
          <aside className="lg:col-span-1">
            <Card className="overflow-hidden">
              <div className="border-b border-gp-line bg-gp-ink px-5 py-5">
                <p className="text-base font-bold text-white">
                  {currentUser.firstName} {currentUser.lastName}
                </p>
                <p className="mt-0.5 truncate text-xs text-white/60">{currentUser.email}</p>
                <p className="mt-2 text-xs text-white/50">
                  เป็นสมาชิกตั้งแต่ {thaiDate(currentUser.createdAt)}
                </p>
              </div>
              <nav className="grid">
                {tabs.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    className={cx(
                      'border-b border-gp-line px-5 py-3 text-left text-sm font-medium transition-colors last:border-b-0',
                      tab === key
                        ? 'bg-gp-red-tint font-bold text-gp-red-dark'
                        : 'text-gp-ink hover:bg-gp-surface',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </nav>
              <div className="border-t border-gp-line p-3">
                <Button variant="ghost" size="sm" className="w-full" onClick={logout}>
                  ออกจากระบบ
                </Button>
              </div>
            </Card>
          </aside>

          <div className="lg:col-span-3">
            {saved && (
              <div className="mb-5">
                <Alert tone="green">{saved}</Alert>
              </div>
            )}

            {tab === 'profile' && (
              <ProfileTab
                onSaved={() => setSaved('บันทึกข้อมูลติดต่อเรียบร้อยแล้ว')}
                initial={{
                  firstName: currentUser.firstName,
                  lastName: currentUser.lastName,
                  phone: currentUser.phone,
                  email: currentUser.email,
                }}
                onSubmit={(v) => updateProfile(v)}
              />
            )}

            {tab === 'shipping' && (
              <ShippingTab
                initial={currentUser.shipping}
                fallbackName={`${currentUser.firstName} ${currentUser.lastName}`}
                fallbackPhone={currentUser.phone}
                onSubmit={(address) => {
                  updateProfile({ shipping: address })
                  setSaved('บันทึกที่อยู่จัดส่งเรียบร้อยแล้ว')
                }}
              />
            )}

            {tab === 'tax' && (
              <TaxTab
                initial={currentUser.tax}
                shipping={currentUser.shipping}
                onSubmit={(tax) => {
                  updateProfile({ tax })
                  setSaved('บันทึกที่อยู่สำหรับออกใบกำกับภาษีเรียบร้อยแล้ว')
                }}
              />
            )}

            {tab === 'orders' && <OrdersTab orders={myOrders} />}
          </div>
        </div>
      </Container>
    </>
  )
}

// ── แท็บข้อมูลติดต่อ ────────────────────────────────────────────────

function ProfileTab({
  initial, onSubmit, onSaved,
}: {
  initial: { firstName: string; lastName: string; phone: string; email: string }
  onSubmit: (value: { firstName: string; lastName: string; phone: string }) => void
  onSaved: () => void
}) {
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!form.firstName.trim()) next.firstName = 'กรุณากรอกชื่อ'
    if (!form.lastName.trim()) next.lastName = 'กรุณากรอกนามสกุล'
    if (!/^[0-9\s-]{9,}$/.test(form.phone.trim())) next.phone = 'กรุณากรอกเบอร์โทรให้ถูกต้อง'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    onSubmit({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), phone: form.phone.trim() })
    onSaved()
  }

  return (
    <Card className="p-6">
      <h2 className="mb-1 text-base font-bold text-gp-ink">ข้อมูลติดต่อ</h2>
      <p className="mb-5 text-sm text-gp-ink-soft">ใช้สำหรับติดต่อกลับเรื่องคำสั่งซื้อและการจัดส่ง</p>

      <form onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="ชื่อ" required error={errors.firstName}>
          <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        </Field>
        <Field label="นามสกุล" required error={errors.lastName}>
          <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        </Field>
        <Field label="เบอร์โทรติดต่อ" required error={errors.phone}>
          <Input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            inputMode="tel"
            placeholder="08X-XXX-XXXX"
          />
        </Field>
        <Field label="อีเมล" hint="อีเมลใช้สำหรับเข้าสู่ระบบ จึงแก้ไขไม่ได้">
          <Input value={form.email} disabled />
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit">บันทึกข้อมูล</Button>
        </div>
      </form>
    </Card>
  )
}

// ── แท็บที่อยู่จัดส่ง ────────────────────────────────────────────────

function ShippingTab({
  initial, fallbackName, fallbackPhone, onSubmit,
}: {
  initial: Address | null
  fallbackName: string
  fallbackPhone: string
  onSubmit: (address: Address) => void
}) {
  const [address, setAddress] = useState<Address>(
    initial ?? { ...EMPTY_ADDRESS, name: fallbackName, phone: fallbackPhone },
  )
  const [errors, setErrors] = useState<AddressErrors>({})

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next = validateAddress(address)
    setErrors(next)
    if (Object.keys(next).length > 0) return
    onSubmit(address)
  }

  return (
    <Card className="p-6">
      <h2 className="mb-1 text-base font-bold text-gp-ink">ที่อยู่จัดส่ง</h2>
      <p className="mb-5 text-sm text-gp-ink-soft">
        ระบบจะกรอกที่อยู่นี้ให้อัตโนมัติเมื่อคุณไปที่หน้าชำระเงิน
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <AddressFields idPrefix="account-ship" value={address} onChange={setAddress} errors={errors} />
        <Button type="submit" className="mt-5">บันทึกที่อยู่จัดส่ง</Button>
      </form>
    </Card>
  )
}

// ── แท็บที่อยู่สำหรับออกใบกำกับภาษี ──────────────────────────────────

function TaxTab({
  initial, shipping, onSubmit,
}: {
  initial: TaxInfo | null
  shipping: Address | null
  onSubmit: (tax: TaxInfo) => void
}) {
  const [tax, setTax] = useState<TaxInfo>(
    initial ?? { isCompany: false, taxId: '', branch: 'สำนักงานใหญ่', address: { ...EMPTY_ADDRESS } },
  )
  const [errors, setErrors] = useState<AddressErrors & { taxId?: string }>({})

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next: AddressErrors & { taxId?: string } = validateAddress(
      tax.address,
      tax.isCompany ? 'ชื่อบริษัท' : 'ชื่อผู้เสียภาษี',
    )
    if (!/^\d{13}$/.test(tax.taxId.trim())) {
      next.taxId = 'เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก'
    }
    setErrors(next)
    if (Object.keys(next).length > 0) return
    onSubmit(tax)
  }

  return (
    <Card className="p-6">
      <h2 className="mb-1 text-base font-bold text-gp-ink">ที่อยู่สำหรับออกใบกำกับภาษี</h2>
      <p className="mb-5 text-sm text-gp-ink-soft">
        บันทึกไว้ครั้งเดียว ใช้ได้ทุกครั้งที่ติ๊ก “ต้องการใบกำกับภาษี” ตอนชำระเงิน
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            { value: false, label: 'บุคคลธรรมดา' },
            { value: true, label: 'นิติบุคคล' },
          ].map((option) => (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => setTax({ ...tax, isCompany: option.value })}
              className={cx(
                'rounded-md border-2 px-5 py-2 text-sm font-semibold transition-colors',
                tax.isCompany === option.value
                  ? 'border-gp-red bg-gp-red-tint text-gp-red-dark'
                  : 'border-gp-line bg-white text-gp-ink hover:border-gp-ink-soft',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <Field label="เลขประจำตัวผู้เสียภาษี (13 หลัก)" required error={errors.taxId}>
            <Input
              value={tax.taxId}
              onChange={(e) => setTax({ ...tax, taxId: e.target.value.replace(/\D/g, '') })}
              inputMode="numeric"
              maxLength={13}
              placeholder="0105561000123"
            />
          </Field>
          <Field label="สาขา" hint="บุคคลธรรมดาให้ใส่ “สำนักงานใหญ่”">
            <Input value={tax.branch} onChange={(e) => setTax({ ...tax, branch: e.target.value })} />
          </Field>
        </div>

        {shipping && (
          <div className="mb-3 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setTax({ ...tax, address: { ...shipping } })}
            >
              ใช้ที่อยู่เดียวกับการจัดส่ง
            </Button>
          </div>
        )}

        <AddressFields
          idPrefix="account-tax"
          value={tax.address}
          onChange={(address) => setTax({ ...tax, address })}
          errors={errors}
          nameLabel={tax.isCompany ? 'ชื่อบริษัท/นิติบุคคล' : 'ชื่อผู้เสียภาษี'}
        />

        <Button type="submit" className="mt-5">บันทึกข้อมูลใบกำกับภาษี</Button>
      </form>
    </Card>
  )
}

// ── แท็บประวัติการสั่งซื้อ ───────────────────────────────────────────

function OrdersTab({ orders }: { orders: ReturnType<typeof useOrders>['myOrders'] }) {
  if (orders.length === 0) {
    return (
      <Card className="p-10 text-center">
        <p className="text-base font-semibold text-gp-ink">ยังไม่มีประวัติการสั่งซื้อ</p>
        <p className="mt-1.5 text-sm text-gp-ink-soft">เมื่อคุณสั่งซื้อสินค้า รายการจะแสดงที่นี่</p>
        <ButtonLink to="/products" className="mt-5">เลือกซื้อสินค้า</ButtonLink>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      {orders.map((order) => (
        <Card key={order.id}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gp-line px-5 py-3.5">
            <div>
              <p className="tnum text-sm font-bold text-gp-ink">{order.code}</p>
              <p className="mt-0.5 text-xs text-gp-ink-soft">{thaiDateTime(order.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              {order.tax && <Badge tone="blue">ออกใบกำกับภาษี</Badge>}
              <Badge tone={ORDER_STATUS_TONE[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
            </div>
          </div>

          <ul className="divide-y divide-gp-line">
            {order.lines.map((line) => (
              <li key={line.productId} className="flex items-center gap-3 px-5 py-3">
                <Link
                  to={`/product/${line.productId}`}
                  className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-gp-line"
                >
                  <img src={asset(line.image)} alt="" className="h-full w-full object-cover" />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-gp-ink">{line.name}</p>
                  <p className="tnum text-xs text-gp-ink-soft">{baht(line.unitPrice)} × {line.qty}</p>
                </div>
                <span className="tnum text-sm font-semibold text-gp-ink">
                  {baht(line.unitPrice * line.qty)}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gp-line px-5 py-3.5">
            <span className="text-xs text-gp-ink-soft">{PAYMENT_LABEL[order.paymentMethod]}</span>
            <span className="text-sm text-gp-ink-soft">
              ยอดสุทธิ <span className="tnum ml-1 text-lg font-bold text-gp-red">{baht(order.total)}</span>
            </span>
          </div>
        </Card>
      ))}
    </div>
  )
}
