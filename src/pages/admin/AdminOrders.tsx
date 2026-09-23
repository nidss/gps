// ── คำสั่งซื้อทั้งหมด: กรองตามช่วงวันที่ สถานะคำสั่งซื้อ และสถานะจัดส่ง ────────
// ตัวกรองเก็บไว้ใน query string ของ URL - กดย้อนกลับหรือแชร์ลิงก์แล้วได้ตัวกรองเดิม
// สถานะพัสดุอัปเดตเองจากตัวซิงก์ใน AppStore (lib/shipping.ts) หน้านี้แค่แสดงผลตาม state
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AdminPageHeader } from '../../components/AdminLayout'
import { Img } from '../../components/Img'
import { SearchIcon, TruckIcon } from '../../components/Icons'
import { Badge, Button, Card, EmptyState, Input, Modal, Select, cx } from '../../components/ui'
import { useOrders } from '../../store/AppStore'
import { baht, num, thaiDateTime, todayKey } from '../../lib/format'
import { ORDER_STATUS_LABEL, ORDER_STATUS_ORDER, ORDER_STATUS_TONE, PAYMENT_LABEL } from '../../lib/orderStatus'
import {
  CARRIERS, CARRIER_NAME, DEFAULT_CARRIER, SHIPMENT_FILTER_OPTIONS, SHIPMENT_STATUS_LABEL, SHIPMENT_STATUS_TONE,
  activeProvider, carrierOf, getProvider, shipmentFilterKey, type ShipmentFilter,
} from '../../lib/shipping'
import type { CarrierId, Order, OrderStatus } from '../../types'

const PAGE_SIZE = 20

/** แถวที่พัสดุเพิ่งขยับภายในช่วงนี้จะกระพริบให้สังเกตเห็น */
const FRESH_MS = 10_000

/** ช่วงวันที่สำเร็จรูป - คืน [from, to] รูปแบบ YYYY-MM-DD */
const DATE_PRESETS: Array<{ id: string; label: string; range: () => [string, string] }> = [
  { id: 'today', label: 'วันนี้', range: () => [todayKey(), todayKey()] },
  { id: '7d', label: '7 วันล่าสุด', range: () => [daysAgo(6), todayKey()] },
  { id: '30d', label: '30 วันล่าสุด', range: () => [daysAgo(29), todayKey()] },
  {
    id: 'month',
    label: 'เดือนนี้',
    range: () => {
      const d = new Date()
      return [todayKey(new Date(d.getFullYear(), d.getMonth(), 1)), todayKey()]
    },
  },
]

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return todayKey(d)
}

function itemCount(order: Order): number {
  return order.lines.reduce((sum, l) => sum + l.qty, 0)
}

export function AdminOrders() {
  const { orders, updateStatus } = useOrders()
  const [params, setParams] = useSearchParams()
  const [detailId, setDetailId] = useState<string | null>(null)
  const provider = activeProvider()

  const from = params.get('from') ?? ''
  const to = params.get('to') ?? ''
  const status = (params.get('status') ?? '') as OrderStatus | ''
  const ship = (params.get('ship') ?? '') as ShipmentFilter | ''
  const search = params.get('q') ?? ''
  const page = Math.max(1, Number(params.get('page')) || 1)

  /** แก้ตัวกรองแล้วกลับไปหน้าแรกของผลลัพธ์เสมอ */
  function setFilter(patch: Record<string, string>) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(patch)) {
          if (value) next.set(key, value)
          else next.delete(key)
        }
        if (!('page' in patch)) next.delete('page')
        return next
      },
      { replace: true },
    )
  }

  // เลือกวันเริ่มหลังวันสิ้นสุด (พิมพ์เองได้แม้ปฏิทินกันไว้) ให้สลับให้แทนการคืนผลว่าง
  const swapped = Boolean(from && to && from > to)
  const [rangeFrom, rangeTo] = swapped ? [to, from] : [from, to]

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders
      .filter((o) => {
        const day = todayKey(new Date(o.createdAt))
        if (rangeFrom && day < rangeFrom) return false
        if (rangeTo && day > rangeTo) return false
        if (status && o.status !== status) return false
        if (ship && shipmentFilterKey(o) !== ship) return false
        if (q) {
          const carrier = carrierOf(o)
          const haystack = [
            o.code, o.customerName, o.customerEmail, o.customerPhone,
            o.shipment?.trackingNo ?? '', carrier ? CARRIER_NAME[carrier] : '',
          ]
            .join(' ')
            .toLowerCase()
          if (!haystack.includes(q)) return false
        }
        return true
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [orders, rangeFrom, rangeTo, status, ship, search])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const filteredTotal = filtered.reduce((sum, o) => sum + o.total, 0)
  const hasFilter = Boolean(from || to || status || ship || search)
  const activePreset = DATE_PRESETS.find((p) => {
    const [pf, pt] = p.range()
    return pf === from && pt === to
  })?.id

  // ความเคลื่อนไหวล่าสุดของพัสดุทั้งหมด ไว้บอกว่าข้อมูลสดแค่ไหน
  const lastShipmentUpdate = orders.reduce<string | null>((latest, o) => {
    const at = o.shipment?.updatedAt
    return at && (!latest || at > latest) ? at : latest
  }, null)

  const detail = detailId ? orders.find((o) => o.id === detailId) ?? null : null

  return (
    <>
      <AdminPageHeader
        title="คำสั่งซื้อทั้งหมด"
        description="ค้นหาและกรองคำสั่งซื้อตามช่วงวันที่ สถานะคำสั่งซื้อ และสถานะการจัดส่ง"
        action={
          <div className="flex items-center gap-2.5 rounded-md border border-gp-line bg-white px-3.5 py-2 text-xs text-gp-ink-soft">
            <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span>
              <span className="font-semibold text-gp-ink">{provider.name}</span> · อัปเดตสถานะพัสดุอัตโนมัติ
              {lastShipmentUpdate && (
                <span className="tnum block">ความเคลื่อนไหวล่าสุด {thaiDateTime(lastShipmentUpdate)}</span>
              )}
            </span>
          </div>
        }
      />

      {/* ตัวกรอง */}
      <Card className="p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <fieldset className="min-w-0">
            <legend className="mb-1.5 text-sm font-semibold text-gp-ink">วันที่สั่งซื้อ</legend>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={from}
                max={to || undefined}
                aria-label="ตั้งแต่วันที่"
                onChange={(e) => setFilter({ from: e.target.value })}
                className="min-w-0 px-2.5 sm:px-3.5"
              />
              <span className="shrink-0 text-sm text-gp-ink-soft">ถึง</span>
              <Input
                type="date"
                value={to}
                min={from || undefined}
                aria-label="ถึงวันที่"
                onChange={(e) => setFilter({ to: e.target.value })}
                className="min-w-0 px-2.5 sm:px-3.5"
              />
            </div>
          </fieldset>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-gp-ink">สถานะคำสั่งซื้อ</span>
            <Select value={status} onChange={(e) => setFilter({ status: e.target.value })}>
              <option value="">ทุกสถานะ</option>
              {ORDER_STATUS_ORDER.map((s) => (
                <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
              ))}
            </Select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-gp-ink">สถานะการจัดส่ง</span>
            <Select value={ship} onChange={(e) => setFilter({ ship: e.target.value })}>
              <option value="">ทุกสถานะ</option>
              {SHIPMENT_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                const [f, t] = preset.range()
                setFilter({ from: f, to: t })
              }}
              className={cx(
                'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                activePreset === preset.id
                  ? 'border-gp-red bg-gp-red-tint text-gp-red-dark'
                  : 'border-gp-line text-gp-ink-soft hover:border-gp-ink/30 hover:text-gp-ink',
              )}
            >
              {preset.label}
            </button>
          ))}

          <div className="relative ml-auto w-full sm:w-72">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gp-ink-soft" />
            <Input
              type="search"
              value={search}
              placeholder="ค้นหาเลขที่ ชื่อ อีเมล หรือเลขพัสดุ"
              aria-label="ค้นหาคำสั่งซื้อ"
              onChange={(e) => setFilter({ q: e.target.value })}
              className="py-2 pl-9"
            />
          </div>
        </div>

        {swapped && (
          <p className="mt-3 text-xs text-amber-700">
            วันที่เริ่มต้นอยู่หลังวันที่สิ้นสุด จึงแสดงผลตามช่วงที่สลับกันให้แล้ว
          </p>
        )}
      </Card>

      <div className="mt-5 mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gp-ink-soft">
          พบ <span className="tnum font-bold text-gp-ink">{num(filtered.length)}</span> คำสั่งซื้อ
          {filtered.length > 0 && (
            <>
              {' '}· ยอดรวม <span className="tnum font-bold text-gp-ink">{baht(filteredTotal)}</span>
            </>
          )}
        </p>
        {hasFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilter({ from: '', to: '', status: '', ship: '', q: '' })}
          >
            ล้างตัวกรอง
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={orders.length === 0 ? 'ยังไม่มีคำสั่งซื้อในระบบ' : 'ไม่พบคำสั่งซื้อที่ตรงกับตัวกรอง'}
          description={orders.length === 0 ? undefined : 'ลองขยายช่วงวันที่หรือเปลี่ยนสถานะที่เลือก'}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[68rem] text-sm">
              <thead>
                <tr className="border-b border-gp-line bg-gp-surface text-left text-xs text-gp-ink-soft">
                  <th className="px-5 py-2.5 font-semibold">เลขที่</th>
                  <th className="px-3 py-2.5 font-semibold">ลูกค้า</th>
                  <th className="px-3 py-2.5 text-right font-semibold">ยอดสุทธิ</th>
                  <th className="px-3 py-2.5 font-semibold">สถานะคำสั่งซื้อ</th>
                  <th className="px-3 py-2.5 font-semibold">ขนส่ง</th>
                  <th className="px-3 py-2.5 font-semibold">สถานะการจัดส่ง</th>
                  <th className="px-5 py-2.5 font-semibold">เปลี่ยนสถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gp-line">
                {rows.map((order) => (
                  <tr key={order.id} className="align-top">
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => setDetailId(order.id)}
                        className="tnum font-semibold text-gp-ink underline-offset-2 hover:text-gp-red hover:underline"
                      >
                        {order.code}
                      </button>
                      <p className="text-xs text-gp-ink-soft">{thaiDateTime(order.createdAt)}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="line-clamp-1 text-gp-ink">{order.customerName}</p>
                      <p className="line-clamp-1 text-xs text-gp-ink-soft">{order.customerEmail}</p>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <p className="tnum font-semibold text-gp-ink">{baht(order.total)}</p>
                      <p className="tnum text-xs text-gp-ink-soft">{num(itemCount(order))} ชิ้น</p>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={ORDER_STATUS_TONE[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
                      <p className="mt-1 text-xs text-gp-ink-soft">{PAYMENT_LABEL[order.paymentMethod]}</p>
                    </td>
                    <td className="px-3 py-3">
                      <CarrierCell order={order} />
                    </td>
                    <td className="px-3 py-3">
                      <ShipmentCell order={order} />
                    </td>
                    <td className="px-5 py-3">
                      <Select
                        value={order.status}
                        aria-label={`เปลี่ยนสถานะคำสั่งซื้อ ${order.code}`}
                        onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                        className="w-36 py-1.5 text-xs"
                      >
                        {ORDER_STATUS_ORDER.map((s) => (
                          <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
                        ))}
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-between gap-3 border-t border-gp-line px-5 py-3 text-sm">
              <span className="tnum text-gp-ink-soft">
                หน้า {currentPage} จาก {pageCount}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setFilter({ page: String(currentPage - 1) })}
                >
                  ก่อนหน้า
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= pageCount}
                  onClick={() => setFilter({ page: String(currentPage + 1) })}
                >
                  ถัดไป
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      <p className="mt-4 text-xs text-gp-ink-soft">
        ตอนนี้ใช้{provider.name} ซึ่งขยับสถานะพัสดุเองตามเวลาเพื่อสาธิตการอัปเดตแบบ real-time
        การต่อขนส่งจริงต้องมี server กลางไว้เก็บ API key และรับ webhook จากขนส่ง
      </p>

      <OrderDetail
        order={detail}
        onClose={() => setDetailId(null)}
        onStatus={(s, carrier) => detail && updateStatus(detail.id, s, carrier)}
      />
    </>
  )
}

/** ช่องบริษัทขนส่ง - ยังไม่ได้ส่งพัสดุแสดงขีด */
function CarrierCell({ order }: { order: Order }) {
  const carrier = carrierOf(order)
  if (!carrier) return <p className="text-xs text-gp-ink-soft">-</p>
  return <p className="whitespace-nowrap font-medium text-gp-ink">{CARRIER_NAME[carrier]}</p>
}

/** ช่องสถานะจัดส่งในตาราง - กระพริบเมื่อพัสดุเพิ่งขยับ */
function ShipmentCell({ order }: { order: Order }) {
  const shipment = order.shipment
  if (!shipment) {
    return (
      <p className="text-xs text-gp-ink-soft">
        {order.status === 'paid' ? 'รอจัดส่ง' : '-'}
      </p>
    )
  }
  const last = shipment.events[shipment.events.length - 1]
  const fresh = Date.now() - new Date(shipment.updatedAt).getTime() < FRESH_MS
  return (
    // เปลี่ยน key ตามเวลาอัปเดต ให้แอนิเมชันกระพริบเล่นใหม่ทุกครั้งที่พัสดุขยับ
    <div key={shipment.updatedAt} className={cx('-mx-2 -my-1 rounded-md px-2 py-1', fresh && 'gp-flash')}>
      <Badge tone={SHIPMENT_STATUS_TONE[shipment.status]}>{SHIPMENT_STATUS_LABEL[shipment.status]}</Badge>
      {shipment.trackingNo && <p className="tnum mt-1 text-xs font-medium text-gp-ink">{shipment.trackingNo}</p>}
      {last && <p className="line-clamp-1 text-xs text-gp-ink-soft">{last.location}</p>}
    </div>
  )
}

/** รายละเอียดคำสั่งซื้อพร้อมเส้นทางพัสดุ */
function OrderDetail({
  order, onClose, onStatus,
}: { order: Order | null; onClose: () => void; onStatus: (status: OrderStatus, carrier?: CarrierId) => void }) {
  const [carrierChoice, setCarrierChoice] = useState<CarrierId>(DEFAULT_CARRIER)
  if (!order) return null
  const shipment = order.shipment
  const providerName = shipment ? getProvider(shipment.provider)?.name ?? shipment.provider : null
  const carrier = carrierOf(order)
  const a = order.shipping

  return (
    <Modal open onClose={onClose} title={`คำสั่งซื้อ ${order.code}`} wide>
      <div className="grid gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={ORDER_STATUS_TONE[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
          <span className="text-sm text-gp-ink-soft">
            สั่งซื้อเมื่อ {thaiDateTime(order.createdAt)} · {PAYMENT_LABEL[order.paymentMethod]}
          </span>
          {/* ห่อด้วย div เพราะ Select กว้างเต็มช่องเสมอ (w-full ใน fieldBase) */}
          <div className="ml-auto w-40">
            <Select
              value={order.status}
              aria-label="เปลี่ยนสถานะคำสั่งซื้อ"
              onChange={(e) => onStatus(e.target.value as OrderStatus, carrierChoice)}
              className="py-1.5 text-xs"
            >
              {ORDER_STATUS_ORDER.map((s) => (
                <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <section className="rounded-md border border-gp-line p-4 text-sm">
            <h4 className="mb-2 font-bold text-gp-ink">ลูกค้า</h4>
            <p className="text-gp-ink">{order.customerName}</p>
            <p className="text-gp-ink-soft">{order.customerEmail}</p>
            <p className="tnum text-gp-ink-soft">{order.customerPhone}</p>
          </section>
          <section className="rounded-md border border-gp-line p-4 text-sm">
            <h4 className="mb-2 font-bold text-gp-ink">ที่อยู่จัดส่ง</h4>
            <p className="text-gp-ink">{a.name} · <span className="tnum">{a.phone}</span></p>
            <p className="text-gp-ink-soft">
              {a.line1} {a.subDistrict} {a.district} {a.province} <span className="tnum">{a.postcode}</span>
            </p>
          </section>
        </div>

        <section>
          <h4 className="mb-2 text-sm font-bold text-gp-ink">รายการสินค้า</h4>
          <ul className="divide-y divide-gp-line rounded-md border border-gp-line">
            {order.lines.map((line) => (
              <li key={line.productId} className="flex items-center gap-3 px-4 py-3">
                <Img src={line.image} alt={line.name} className="h-12 w-12 shrink-0 rounded-md bg-gp-surface object-contain" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-gp-ink">{line.name}</p>
                  <p className="text-xs text-gp-ink-soft">{line.sku}</p>
                </div>
                <span className="tnum shrink-0 text-xs text-gp-ink-soft">
                  {baht(line.unitPrice)} × {num(line.qty)}
                </span>
                <span className="tnum w-24 shrink-0 text-right text-sm font-semibold text-gp-ink">
                  {baht(line.unitPrice * line.qty)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="tnum mt-3 ml-auto grid max-w-xs gap-1 text-sm">
            <div className="flex justify-between text-gp-ink-soft"><dt>ยอดสินค้า</dt><dd>{baht(order.subtotal)}</dd></div>
            {order.discount > 0 && (
              <div className="flex justify-between text-gp-ink-soft">
                <dt>ส่วนลด{order.couponCode ? ` (${order.couponCode})` : ''}</dt><dd>-{baht(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between text-gp-ink-soft">
              <dt>ค่าจัดส่ง</dt><dd>{order.shippingFee > 0 ? baht(order.shippingFee) : 'ฟรี'}</dd>
            </div>
            <div className="flex justify-between border-t border-gp-line pt-1 font-bold text-gp-ink">
              <dt>ยอดสุทธิ</dt><dd>{baht(order.total)}</dd>
            </div>
          </dl>
        </section>

        <section>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-gp-ink">
            <TruckIcon className="h-4.5 w-4.5" />
            การจัดส่ง
          </h4>
          {!shipment ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed border-gp-line p-4 text-sm text-gp-ink-soft">
              <span>ยังไม่ได้ส่งพัสดุ</span>
              {order.status === 'paid' && (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-44">
                    <Select
                      value={carrierChoice}
                      aria-label="เลือกบริษัทขนส่ง"
                      onChange={(e) => setCarrierChoice(e.target.value as CarrierId)}
                      className="py-1.5 text-xs"
                    >
                      {CARRIERS.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </Select>
                  </div>
                  <Button size="sm" onClick={() => onStatus('shipped', carrierChoice)}>
                    <TruckIcon className="h-4 w-4" />
                    สั่งส่งพัสดุ
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-md border border-gp-line p-4">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <Badge tone={SHIPMENT_STATUS_TONE[shipment.status]}>{SHIPMENT_STATUS_LABEL[shipment.status]}</Badge>
                {carrier && <span className="font-semibold text-gp-ink">{CARRIER_NAME[carrier]}</span>}
                {/* ระหว่างรอเลขพัสดุ ป้ายสถานะบอกอยู่แล้ว ไม่ต้องแสดงซ้ำ */}
                {shipment.trackingNo && <span className="tnum font-semibold text-gp-ink">{shipment.trackingNo}</span>}
                <span className="text-xs text-gp-ink-soft">ผ่าน {providerName}</span>
              </div>
              {shipment.events.length > 0 && (
                <ol className="mt-4 grid gap-0">
                  {[...shipment.events].reverse().map((event, i, list) => (
                    <li key={`${event.at}-${i}`} className="relative flex gap-3 pb-4 last:pb-0">
                      {/* เส้นเชื่อมไปยังจุดถัดไป */}
                      {i < list.length - 1 && (
                        <span className="absolute top-3 bottom-0 left-[5px] w-px bg-gp-line" aria-hidden="true" />
                      )}
                      <span
                        className={cx(
                          'relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full border-2',
                          i === 0 ? 'border-gp-red bg-gp-red' : 'border-gp-line bg-white',
                        )}
                        aria-hidden="true"
                      />
                      <div className="min-w-0 text-sm">
                        <p className={cx('font-semibold', i === 0 ? 'text-gp-ink' : 'text-gp-ink-soft')}>
                          {event.description}
                        </p>
                        <p className="tnum text-xs text-gp-ink-soft">
                          {thaiDateTime(event.at)} · {event.location}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </section>
      </div>
    </Modal>
  )
}
