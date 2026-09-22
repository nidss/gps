// ── หน้าภาพรวม: ยอดขาย, สินค้าที่ขายได้, ออเดอร์รอชำระ ────────────────
import { Link } from 'react-router-dom'
import { AdminPageHeader } from '../../components/AdminLayout'
import { BarChart, StackedBar } from '../../components/Charts'
import { Badge, Card, Select } from '../../components/ui'
import { BoxIcon, ReceiptIcon, TagIcon, UsersIcon } from '../../components/Icons'
import { useAuth, useCatalog, useOrders } from '../../store/AppStore'
import { baht, num, thaiDateTime } from '../../lib/format'
import { ORDER_STATUS_LABEL, ORDER_STATUS_ORDER, ORDER_STATUS_TONE } from '../../lib/orderStatus'
import type { OrderStatus } from '../../types'

function StatCard({
  label, value, sub, icon: Icon, tone,
}: {
  label: string
  value: string
  sub?: string
  icon: (props: { className?: string }) => React.JSX.Element
  tone: 'red' | 'ink' | 'amber' | 'green'
}) {
  const toneMap = {
    red: 'bg-gp-red-tint text-gp-red',
    ink: 'bg-gp-ink/10 text-gp-ink',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-emerald-50 text-emerald-600',
  }
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gp-ink-soft">{label}</p>
          <p className="tnum mt-1.5 truncate text-2xl font-bold text-gp-ink">{value}</p>
          {sub && <p className="mt-1 text-xs text-gp-ink-soft">{sub}</p>}
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${toneMap[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </Card>
  )
}

export function Dashboard() {
  const { stats, orders, updateStatus } = useOrders()
  const { products } = useCatalog()
  const { users } = useAuth()

  // ป้ายวันที่บนแกน X แสดงแค่ วัน/เดือน
  const chartData = stats.daily.map((d) => ({
    label: `${Number(d.date.slice(8, 10))}/${Number(d.date.slice(5, 7))}`,
    value: d.total,
  }))

  const statusSegments = ORDER_STATUS_ORDER.map((status) => ({
    label: ORDER_STATUS_LABEL[status],
    value: orders.filter((o) => o.status === status).length,
    color: {
      pending: '#f59e0b',
      paid: '#0ea5e9',
      shipped: '#333946',
      completed: '#10b981',
      cancelled: '#cbd5e1',
    }[status],
  }))

  return (
    <>
      <AdminPageHeader
        title="ภาพรวมยอดขาย"
        description="สรุปยอดขาย สินค้าที่ขายได้ และคำสั่งซื้อที่รอชำระเงิน"
      />

      {/* การ์ดตัวเลขสรุป */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="ยอดขายรวม"
          value={baht(stats.totalRevenue)}
          sub={`จาก ${num(stats.paidCount)} คำสั่งซื้อที่ชำระแล้ว`}
          icon={TagIcon}
          tone="red"
        />
        <StatCard
          label="สินค้าที่ขายได้"
          value={`${num(stats.itemsSold)} ชิ้น`}
          sub={`จากสินค้า ${num(stats.topProducts.length)} รายการ`}
          icon={BoxIcon}
          tone="ink"
        />
        <StatCard
          label="รอชำระเงิน"
          value={`${num(stats.pendingCount)} รายการ`}
          sub={`มูลค่ารวม ${baht(stats.pendingAmount)}`}
          icon={ReceiptIcon}
          tone="amber"
        />
        <StatCard
          label="สมาชิกทั้งหมด"
          value={`${num(users.length)} คน`}
          sub={`คำสั่งซื้อสะสม ${num(stats.orderCount)} รายการ`}
          icon={UsersIcon}
          tone="green"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {/* กราฟยอดขายรายวัน */}
        <Card className="p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-gp-ink">ยอดขาย 14 วันล่าสุด</h2>
            <Badge tone="slate">หน่วย: บาท</Badge>
          </div>
          <BarChart data={chartData} />
        </Card>

        {/* สัดส่วนสถานะคำสั่งซื้อ */}
        <Card className="p-5">
          <h2 className="mb-4 text-base font-bold text-gp-ink">สถานะคำสั่งซื้อ</h2>
          <StackedBar segments={statusSegments} />
          {stats.lowStockCount > 0 && (
            <p className="mt-5 rounded-md bg-amber-50 px-3 py-2.5 text-xs font-medium text-amber-800">
              มีสินค้า {stats.lowStockCount} รายการที่เหลือไม่ถึง 20 ชิ้น —{' '}
              <Link to="/admin/products" className="underline">ตรวจสอบสต็อก</Link>
            </p>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        {/* สินค้าที่ขายได้ */}
        <Card className="overflow-hidden xl:col-span-2">
          <div className="border-b border-gp-line px-5 py-4">
            <h2 className="text-base font-bold text-gp-ink">สินค้าที่ขายได้</h2>
          </div>
          {stats.topProducts.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-gp-ink-soft">ยังไม่มีสินค้าที่ขายได้</p>
          ) : (
            <ul className="divide-y divide-gp-line">
              {stats.topProducts.slice(0, 8).map((p, i) => (
                <li key={p.productId} className="flex items-center gap-3 px-5 py-3">
                  <span className="tnum flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gp-surface text-xs font-bold text-gp-ink-soft">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-gp-ink">{p.name}</p>
                    <p className="text-xs text-gp-ink-soft">{p.sku}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="tnum text-sm font-bold text-gp-ink">{num(p.qty)} ชิ้น</p>
                    <p className="tnum text-xs text-gp-ink-soft">{baht(p.revenue)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* คำสั่งซื้อล่าสุด */}
        <Card className="overflow-hidden xl:col-span-3">
          <div className="flex items-center justify-between gap-3 border-b border-gp-line px-5 py-4">
            <h2 className="text-base font-bold text-gp-ink">คำสั่งซื้อล่าสุด</h2>
            <span className="text-xs text-gp-ink-soft">เปลี่ยนสถานะได้จากช่องด้านขวา</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] text-sm">
              <thead>
                <tr className="border-b border-gp-line bg-gp-surface text-left text-xs text-gp-ink-soft">
                  <th className="px-5 py-2.5 font-semibold">เลขที่</th>
                  <th className="px-3 py-2.5 font-semibold">ลูกค้า</th>
                  <th className="px-3 py-2.5 text-right font-semibold">ยอดสุทธิ</th>
                  <th className="px-3 py-2.5 font-semibold">สถานะ</th>
                  <th className="px-5 py-2.5 font-semibold">เปลี่ยนสถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gp-line">
                {stats.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-5 py-3">
                      <p className="tnum font-semibold text-gp-ink">{order.code}</p>
                      <p className="text-xs text-gp-ink-soft">{thaiDateTime(order.createdAt)}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="line-clamp-1 text-gp-ink">{order.customerName}</p>
                      <p className="line-clamp-1 text-xs text-gp-ink-soft">{order.customerEmail}</p>
                    </td>
                    <td className="tnum px-3 py-3 text-right font-semibold text-gp-ink">{baht(order.total)}</td>
                    <td className="px-3 py-3">
                      <Badge tone={ORDER_STATUS_TONE[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
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

          {stats.recentOrders.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-gp-ink-soft">ยังไม่มีคำสั่งซื้อในระบบ</p>
          )}
        </Card>
      </div>

      <p className="mt-6 text-xs text-gp-ink-soft">
        สินค้าทั้งหมดในระบบ {num(products.length)} รายการ · ข้อมูลทั้งหมดเก็บอยู่ในเบราว์เซอร์เครื่องนี้เท่านั้น
      </p>
    </>
  )
}
