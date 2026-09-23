// ── จัดการ hero banner: กำหนดช่วงวันที่แสดง และลำดับการแสดงผล ─────────
import { useState } from 'react'
import { AdminPageHeader } from '../../components/AdminLayout'
import { SingleImagePicker } from '../../components/ImagePicker'
import { Badge, Button, Card, Checkbox, Field, Input, Modal, ReorderButtons, cx } from '../../components/ui'
import { EditIcon, PlusIcon, TrashIcon } from '../../components/Icons'
import { useCatalog } from '../../store/AppStore'
import type { Banner } from '../../types'
import { thaiDate, todayKey } from '../../lib/format'
import { uid } from '../../lib/id'
import { bySortOrder, nextSortOrder } from '../../lib/sortOrder'
import { Img } from '../../components/Img'

/** สถานะการแสดงผลของแบนเนอร์ ณ วันนี้ */
function bannerStatus(banner: Banner): { label: string; tone: 'green' | 'blue' | 'slate' | 'amber' } {
  const today = todayKey()
  if (!banner.active) return { label: 'ปิดการแสดง', tone: 'slate' }
  if (banner.startDate > today) return { label: 'รอถึงวันแสดง', tone: 'blue' }
  if (banner.endDate < today) return { label: 'หมดช่วงแสดงแล้ว', tone: 'amber' }
  return { label: 'กำลังแสดงอยู่', tone: 'green' }
}

function emptyBanner(nextOrder: number): Banner {
  const today = todayKey()
  const later = new Date()
  later.setDate(later.getDate() + 30)
  return {
    id: uid('b'), title: '', subtitle: '', image: '', ctaLabel: 'ดูรายละเอียด', ctaLink: '/products',
    startDate: today, endDate: todayKey(later), sortOrder: nextOrder, active: true,
  }
}

export function AdminBanners() {
  const { banners, liveBanners, saveBanner, deleteBanner, moveBanner } = useCatalog()
  const [editing, setEditing] = useState<Banner | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const sorted = [...banners].sort(bySortOrder)

  function openNew() {
    setErrors({})
    setEditing(emptyBanner(nextSortOrder(banners)))
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return

    const next: Record<string, string> = {}
    if (!editing.title.trim()) next.title = 'กรุณากรอกหัวข้อแบนเนอร์'
    if (!editing.image.trim()) next.image = 'กรุณาระบุรูปภาพแบนเนอร์'
    if (!editing.startDate) next.startDate = 'กรุณาเลือกวันที่เริ่มแสดง'
    if (!editing.endDate) next.endDate = 'กรุณาเลือกวันที่สิ้นสุด'
    if (editing.startDate && editing.endDate && editing.startDate > editing.endDate) {
      next.endDate = 'วันสิ้นสุดต้องไม่มาก่อนวันเริ่มแสดง'
    }
    setErrors(next)
    if (Object.keys(next).length > 0) return

    saveBanner(editing)
    setEditing(null)
  }

  return (
    <>
      <AdminPageHeader
        title="จัดการแบนเนอร์หน้าแรก"
        description={`กำหนดช่วงวันที่แสดงและลำดับได้ — ขณะนี้มี ${liveBanners.length} แบนเนอร์ที่แสดงอยู่บนหน้าแรก`}
        action={
          <Button onClick={openNew}>
            <PlusIcon className="h-4 w-4" />
            เพิ่มแบนเนอร์
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] text-sm">
            <thead>
              <tr className="border-b border-gp-line bg-gp-surface text-left text-xs text-gp-ink-soft">
                <th className="px-4 py-3 font-semibold">ลำดับ</th>
                <th className="px-4 py-3 font-semibold">แบนเนอร์</th>
                <th className="px-4 py-3 font-semibold">ช่วงวันที่แสดง</th>
                <th className="px-4 py-3 font-semibold">สถานะ</th>
                <th className="px-4 py-3 text-right font-semibold">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gp-line">
              {sorted.map((banner, index) => {
                const status = bannerStatus(banner)
                return (
                  <tr key={banner.id} className={cx(!banner.active && 'opacity-60')}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="tnum w-6 text-center font-bold text-gp-ink">{banner.sortOrder}</span>
                        <ReorderButtons
                          label={banner.title}
                          onMove={(direction) => moveBanner(banner.id, direction)}
                          isFirst={index === 0}
                          isLast={index === sorted.length - 1}
                        />
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Img
                          src={banner.image}
                          alt=""
                          className="h-12 w-24 shrink-0 rounded-md border border-gp-line object-cover"
                        />
                        <div className="min-w-0">
                          <p className="line-clamp-1 font-semibold text-gp-ink">{banner.title}</p>
                          <p className="line-clamp-1 text-xs text-gp-ink-soft">{banner.subtitle}</p>
                          <p className="mt-0.5 text-xs text-gp-ink-soft">
                            ปุ่ม “{banner.ctaLabel}” → {banner.ctaLink}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="tnum whitespace-nowrap px-4 py-3 text-xs text-gp-ink-soft">
                      {thaiDate(banner.startDate)}
                      <br />
                      ถึง {thaiDate(banner.endDate)}
                    </td>

                    <td className="px-4 py-3">
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => { setErrors({}); setEditing({ ...banner }) }}
                          aria-label={`แก้ไข ${banner.title}`}
                          className="rounded-md p-2 text-gp-ink-soft transition-colors hover:bg-gp-surface hover:text-gp-ink"
                        >
                          <EditIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`ลบแบนเนอร์ “${banner.title}” ใช่หรือไม่?`)) deleteBanner(banner.id)
                          }}
                          aria-label={`ลบ ${banner.title}`}
                          className="rounded-md p-2 text-gp-ink-soft transition-colors hover:bg-gp-red-tint hover:text-gp-red"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {sorted.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-gp-ink-soft">
            ยังไม่มีแบนเนอร์ — กด “เพิ่มแบนเนอร์” เพื่อเริ่มต้น
          </p>
        )}
      </Card>

      {/* ฟอร์มเพิ่ม/แก้ไขแบนเนอร์ */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={banners.some((b) => b.id === editing?.id) ? 'แก้ไขแบนเนอร์' : 'เพิ่มแบนเนอร์ใหม่'}
        wide
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>ยกเลิก</Button>
            <Button type="submit" form="banner-form">บันทึกแบนเนอร์</Button>
          </>
        }
      >
        {editing && (
          <form id="banner-form" onSubmit={handleSave} noValidate className="grid gap-4">
            <Field label="รูปภาพแบนเนอร์" required error={errors.image} hint="แนะนำอัตราส่วน 1600 × 640 พิกเซล">
              <SingleImagePicker
                value={editing.image}
                onChange={(image) => setEditing({ ...editing, image })}
              />
            </Field>

            <Field label="หัวข้อ" required error={errors.title}>
              <Input
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                placeholder="เช่น คอลเลกชันทางการ ฤดูกาล 2026"
              />
            </Field>

            <Field label="คำโปรย">
              <Input
                value={editing.subtitle}
                onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
                placeholder="ข้อความรองใต้หัวข้อ"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="ข้อความบนปุ่ม">
                <Input
                  value={editing.ctaLabel}
                  onChange={(e) => setEditing({ ...editing, ctaLabel: e.target.value })}
                />
              </Field>
              <Field label="ลิงก์ปลายทาง" hint="เช่น /products หรือ /product/p04">
                <Input
                  value={editing.ctaLink}
                  onChange={(e) => setEditing({ ...editing, ctaLink: e.target.value })}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="วันที่เริ่มแสดง" required error={errors.startDate}>
                <Input
                  type="date"
                  value={editing.startDate}
                  onChange={(e) => setEditing({ ...editing, startDate: e.target.value })}
                />
              </Field>
              <Field label="วันที่สิ้นสุด" required error={errors.endDate}>
                <Input
                  type="date"
                  value={editing.endDate}
                  onChange={(e) => setEditing({ ...editing, endDate: e.target.value })}
                />
              </Field>
              <Field label="ลำดับการแสดง" hint="เลขน้อยแสดงก่อน">
                <Input
                  type="number"
                  min={1}
                  value={editing.sortOrder}
                  onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) || 1 })}
                />
              </Field>
            </div>

            <Checkbox
              checked={editing.active}
              onChange={(active) => setEditing({ ...editing, active })}
              label="เปิดใช้งานแบนเนอร์นี้"
              description="ถ้าปิด จะไม่แสดงบนหน้าแรกแม้อยู่ในช่วงวันที่ที่กำหนด"
            />
          </form>
        )}
      </Modal>
    </>
  )
}
