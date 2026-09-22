// ── ข้อมูลสมาชิก: ข้อมูลติดต่อ ที่อยู่จัดส่ง และที่อยู่ออกใบกำกับภาษี ──
import { useMemo, useState } from 'react'
import { AdminPageHeader } from '../../components/AdminLayout'
import { AddressView } from '../../components/AddressFields'
import { Badge, Button, Card, Input, Modal } from '../../components/ui'
import { useAuth, useOrders } from '../../store/AppStore'
import type { User } from '../../types'
import { baht, num, thaiDate, thaiDateTime } from '../../lib/format'
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from '../../lib/orderStatus'

export function AdminMembers() {
  const { users } = useAuth()
  const { ordersOfUser } = useOrders()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<User | null>(null)

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users
      .map((user) => {
        const orders = ordersOfUser(user.id)
        // ยอดซื้อสะสมนับเฉพาะออเดอร์ที่ไม่ได้ยกเลิก
        const spent = orders
          .filter((o) => o.status !== 'cancelled')
          .reduce((sum, o) => sum + o.total, 0)
        return { user, orderCount: orders.length, spent }
      })
      .filter(({ user }) => {
        if (!q) return true
        return (
          user.email.toLowerCase().includes(q) ||
          `${user.firstName} ${user.lastName}`.toLowerCase().includes(q) ||
          user.phone.includes(q)
        )
      })
      .sort((a, b) => b.spent - a.spent)
  }, [users, ordersOfUser, search])

  const selectedOrders = selected ? ordersOfUser(selected.id) : []

  return (
    <>
      <AdminPageHeader
        title="ข้อมูลสมาชิก"
        description="รวมข้อมูลการติดต่อ ที่อยู่จัดส่ง และที่อยู่สำหรับออกใบกำกับภาษีของสมาชิกทุกคน"
      />

      <div className="mb-4 max-w-sm">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อ อีเมล หรือเบอร์โทร"
          aria-label="ค้นหาสมาชิก"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[54rem] text-sm">
            <thead>
              <tr className="border-b border-gp-line bg-gp-surface text-left text-xs text-gp-ink-soft">
                <th className="px-4 py-3 font-semibold">สมาชิก</th>
                <th className="px-4 py-3 font-semibold">เบอร์โทร</th>
                <th className="px-4 py-3 font-semibold">ที่อยู่จัดส่ง</th>
                <th className="px-4 py-3 font-semibold">ใบกำกับภาษี</th>
                <th className="px-4 py-3 text-right font-semibold">คำสั่งซื้อ</th>
                <th className="px-4 py-3 text-right font-semibold">ยอดซื้อสะสม</th>
                <th className="px-4 py-3 text-right font-semibold">ดูข้อมูล</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gp-line">
              {rows.map(({ user, orderCount, spent }) => (
                <tr key={user.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gp-ink">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gp-ink-soft">{user.email}</p>
                    <p className="text-xs text-gp-ink-soft">สมัครเมื่อ {thaiDate(user.createdAt)}</p>
                  </td>
                  <td className="tnum whitespace-nowrap px-4 py-3 text-gp-ink-soft">{user.phone}</td>
                  <td className="px-4 py-3">
                    {user.shipping ? (
                      <span className="text-xs text-gp-ink-soft">
                        {user.shipping.district} {user.shipping.province} {user.shipping.postcode}
                      </span>
                    ) : (
                      <Badge tone="slate">ยังไม่ได้บันทึก</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {user.tax ? (
                      <Badge tone="blue">{user.tax.isCompany ? 'นิติบุคคล' : 'บุคคลธรรมดา'}</Badge>
                    ) : (
                      <Badge tone="slate">ยังไม่ได้บันทึก</Badge>
                    )}
                  </td>
                  <td className="tnum px-4 py-3 text-right text-gp-ink">{num(orderCount)}</td>
                  <td className="tnum px-4 py-3 text-right font-semibold text-gp-ink">{baht(spent)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelected(user)}>
                      รายละเอียด
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-gp-ink-soft">ไม่พบสมาชิกที่ตรงกับคำค้นหา</p>
        )}
      </Card>

      {/* รายละเอียดสมาชิก */}
      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.firstName} ${selected.lastName}` : ''}
        wide
        footer={<Button variant="ghost" onClick={() => setSelected(null)}>ปิด</Button>}
      >
        {selected && (
          <div className="grid gap-6">
            <section>
              <h4 className="mb-3 text-sm font-bold text-gp-ink">ข้อมูลการติดต่อ</h4>
              <dl className="grid gap-2 rounded-md bg-gp-surface p-4 text-sm sm:grid-cols-2">
                {[
                  ['ชื่อ-นามสกุล', `${selected.firstName} ${selected.lastName}`],
                  ['อีเมล', selected.email],
                  ['เบอร์โทร', selected.phone],
                  ['สมัครเมื่อ', thaiDate(selected.createdAt)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3">
                    <dt className="text-gp-ink-soft">{label}</dt>
                    <dd className="text-right font-semibold text-gp-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <div className="grid gap-6 sm:grid-cols-2">
              <section>
                <h4 className="mb-3 text-sm font-bold text-gp-ink">ที่อยู่จัดส่ง</h4>
                {selected.shipping ? (
                  <div className="rounded-md border border-gp-line p-4">
                    <AddressView address={selected.shipping} />
                  </div>
                ) : (
                  <p className="rounded-md border border-dashed border-gp-line p-4 text-sm text-gp-ink-soft">
                    สมาชิกยังไม่ได้บันทึกที่อยู่จัดส่ง
                  </p>
                )}
              </section>

              <section>
                <h4 className="mb-3 text-sm font-bold text-gp-ink">ที่อยู่สำหรับออกใบกำกับภาษี</h4>
                {selected.tax ? (
                  <div className="rounded-md border border-gp-line p-4">
                    <p className="mb-2 text-xs text-gp-ink-soft">
                      {selected.tax.isCompany ? 'นิติบุคคล' : 'บุคคลธรรมดา'} · เลขผู้เสียภาษี{' '}
                      <span className="tnum font-semibold text-gp-ink">{selected.tax.taxId}</span>
                      {selected.tax.branch && ` · ${selected.tax.branch}`}
                    </p>
                    <AddressView address={selected.tax.address} />
                  </div>
                ) : (
                  <p className="rounded-md border border-dashed border-gp-line p-4 text-sm text-gp-ink-soft">
                    สมาชิกยังไม่ได้บันทึกข้อมูลใบกำกับภาษี
                  </p>
                )}
              </section>
            </div>

            <section>
              <h4 className="mb-3 text-sm font-bold text-gp-ink">
                ประวัติคำสั่งซื้อ ({num(selectedOrders.length)} รายการ)
              </h4>
              {selectedOrders.length === 0 ? (
                <p className="rounded-md border border-dashed border-gp-line p-4 text-sm text-gp-ink-soft">
                  ยังไม่มีคำสั่งซื้อ
                </p>
              ) : (
                <ul className="grid gap-2">
                  {selectedOrders.map((order) => (
                    <li
                      key={order.id}
                      className="flex flex-wrap items-center gap-3 rounded-md border border-gp-line px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="tnum text-sm font-semibold text-gp-ink">{order.code}</p>
                        <p className="text-xs text-gp-ink-soft">{thaiDateTime(order.createdAt)}</p>
                      </div>
                      <span className="text-xs text-gp-ink-soft">
                        {num(order.lines.reduce((sum, l) => sum + l.qty, 0))} ชิ้น
                      </span>
                      {order.tax && <Badge tone="blue">ใบกำกับภาษี</Badge>}
                      <Badge tone={ORDER_STATUS_TONE[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
                      <span className="tnum ml-auto text-sm font-bold text-gp-ink">{baht(order.total)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </Modal>
    </>
  )
}
