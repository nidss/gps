// ── จัดการ section หน้าแรก: เพิ่ม แก้ไข ซ่อน และจัดลำดับการแสดง ─────────
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminPageHeader } from '../../components/AdminLayout'
import {
  Badge, Button, Card, Checkbox, ConfirmDialog, Field, Input, Modal, ReorderButtons, Select, cx,
} from '../../components/ui'
import { EditIcon, PlusIcon, TrashIcon } from '../../components/Icons'
import { Img } from '../../components/Img'
import { useCatalog, useHomeSections } from '../../store/AppStore'
import type { HomeSection, HomeSectionKind, ProductSource } from '../../types'
import { baht, effectivePrice, num, thaiDate, todayKey } from '../../lib/format'
import { uid } from '../../lib/id'
import { nextSortOrder } from '../../lib/sortOrder'
import { blankHomeSection } from '../../lib/seed'

const KIND_LABEL: Record<HomeSectionKind, string> = {
  products: 'รายการสินค้า',
  categories: 'ปุ่มลัดหมวดหมู่',
  coupon: 'แถบโปรโมชันคูปอง',
}

const SOURCE_LABEL: Record<ProductSource, string> = {
  recommended: 'สินค้าที่ติ๊ก “แนะนำ”',
  sale: 'สินค้าลดราคา (ส่วนลดมากสุดก่อน)',
  new: 'สินค้ามาใหม่ (เพิ่มล่าสุดก่อน)',
  category: 'สินค้าในหมวดหมู่',
  manual: 'เลือกสินค้าเอง',
}

const MAX_LIMIT = 24

export function AdminHomeSections() {
  const { activeProducts, categoryList, categories, coupons } = useCatalog()
  const { sections, resolveProducts, resolveCoupon, saveSection, deleteSection, moveSection } = useHomeSections()
  const [editing, setEditing] = useState<HomeSection | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [deleting, setDeleting] = useState<HomeSection | null>(null)

  const isNew = editing !== null && !sections.some((s) => s.id === editing.id)

  /** ข้อความสรุปเนื้อหา และเหตุผลที่ section จะไม่ขึ้นหน้าแรก (ถ้ามี) */
  function describe(section: HomeSection): { detail: string; hiddenReason: string | null } {
    switch (section.kind) {
      case 'categories':
        return {
          detail: `${num(categories.length)} หมวดที่แสดงบนหน้าร้าน`,
          hiddenReason: categories.length === 0 ? 'ไม่มีหมวดให้แสดง' : null,
        }
      case 'coupon':
        return {
          detail: `คูปอง ${section.couponCode || '-'}`,
          hiddenReason: resolveCoupon(section) ? null : 'คูปองปิดใช้หรือหมดอายุ',
        }
      case 'products': {
        const count = resolveProducts(section).length
        const category = categoryList.find((c) => c.id === section.categoryId)?.name
        const source =
          section.source === 'category' ? `หมวด “${category ?? 'ถูกลบแล้ว'}”` : SOURCE_LABEL[section.source]
        return {
          detail: `${source} · แสดง ${num(count)} ชิ้น`,
          hiddenReason: count === 0 ? 'ไม่มีสินค้าให้แสดง' : null,
        }
      }
    }
  }

  function openNew() {
    setErrors({})
    setEditing(blankHomeSection(uid('hs'), nextSortOrder(sections)))
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return

    const next: Record<string, string> = {}
    if (editing.kind === 'products') {
      if (!editing.title.trim()) next.title = 'กรุณากรอกหัวข้อ section'
      if (editing.source === 'category' && !editing.categoryId) next.categoryId = 'กรุณาเลือกหมวดหมู่'
      if (editing.source === 'manual' && editing.productIds.length === 0) {
        next.productIds = 'กรุณาเลือกสินค้าอย่างน้อย 1 ชิ้น'
      }
    }
    if (editing.kind === 'coupon' && !editing.couponCode) next.couponCode = 'กรุณาเลือกคูปอง'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    saveSection({
      ...editing,
      title: editing.title.trim(),
      // เลือกสินค้าเอง: แสดงครบทุกชิ้นที่เลือก
      limit:
        editing.source === 'manual'
          ? Math.max(1, editing.productIds.length)
          : Math.min(MAX_LIMIT, Math.max(1, editing.limit)),
    })
    setEditing(null)
  }

  return (
    <>
      <AdminPageHeader
        title="จัดการหน้าแรก"
        description="section ทั้งหมดที่อยู่ใต้แบนเนอร์บนหน้าแรก - เรียงลำดับ ซ่อน หรือเพิ่ม section ใหม่ได้"
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/"
              target="_blank"
              className="inline-flex items-center rounded-md px-3 py-2.5 text-sm font-semibold text-gp-ink-soft hover:text-gp-red"
            >
              ดูหน้าแรก ↗
            </Link>
            <Button onClick={openNew}>
              <PlusIcon className="h-4 w-4" />
              เพิ่ม section
            </Button>
          </div>
        }
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem] text-sm">
            <thead>
              <tr className="border-b border-gp-line bg-gp-surface text-left text-xs text-gp-ink-soft">
                <th className="px-4 py-3 font-semibold">ลำดับ</th>
                <th className="px-4 py-3 font-semibold">section</th>
                <th className="px-4 py-3 font-semibold">สถานะ</th>
                <th className="px-4 py-3 text-right font-semibold">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gp-line">
              {sections.map((section, index) => {
                const { detail, hiddenReason } = describe(section)
                const label = section.title || KIND_LABEL[section.kind]
                return (
                  <tr key={section.id} className={cx(!section.active && 'opacity-60')}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="tnum w-6 text-center font-bold text-gp-ink">{index + 1}</span>
                        <ReorderButtons
                          label={label}
                          onMove={(direction) => moveSection(section.id, direction)}
                          isFirst={index === 0}
                          isLast={index === sections.length - 1}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gp-ink">{label}</p>
                      <p className="mt-0.5 text-xs text-gp-ink-soft">
                        {KIND_LABEL[section.kind]} · {detail}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {!section.active ? (
                        <Badge tone="slate">ซ่อนอยู่</Badge>
                      ) : hiddenReason ? (
                        <Badge tone="amber">{hiddenReason}</Badge>
                      ) : (
                        <Badge tone="green">แสดงอยู่</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => saveSection({ ...section, active: !section.active })}
                        >
                          {section.active ? 'ซ่อน' : 'แสดง'}
                        </Button>
                        <button
                          type="button"
                          onClick={() => { setErrors({}); setEditing({ ...section }) }}
                          aria-label={`แก้ไข ${label}`}
                          className="rounded-md p-2 text-gp-ink-soft transition-colors hover:bg-gp-surface hover:text-gp-ink"
                        >
                          <EditIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(section)}
                          aria-label={`ลบ ${label}`}
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

        {sections.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-gp-ink-soft">
            หน้าแรกยังไม่มี section - กด “เพิ่ม section” เพื่อเริ่มต้น
          </p>
        )}
      </Card>

      {/* ฟอร์มเพิ่ม/แก้ไข section */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={isNew ? 'เพิ่ม section ใหม่' : 'แก้ไข section'}
        wide
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>ยกเลิก</Button>
            <Button type="submit" form="section-form">บันทึก section</Button>
          </>
        }
      >
        {editing && (
          <form id="section-form" onSubmit={handleSave} noValidate className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="ชนิด section" required>
                <Select
                  value={editing.kind}
                  onChange={(e) => setEditing({ ...editing, kind: e.target.value as HomeSectionKind })}
                >
                  {(Object.keys(KIND_LABEL) as HomeSectionKind[]).map((k) => (
                    <option key={k} value={k}>{KIND_LABEL[k]}</option>
                  ))}
                </Select>
              </Field>

              <Field
                label={editing.kind === 'coupon' ? 'ป้ายข้อความเล็กด้านบน' : 'หัวข้อ'}
                required={editing.kind === 'products'}
                error={errors.title}
                hint={editing.kind === 'products' ? undefined : 'เว้นว่างได้'}
              >
                <Input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  placeholder={editing.kind === 'coupon' ? 'เช่น คูปองส่วนลด' : 'เช่น สินค้าขายดี'}
                />
              </Field>
            </div>

            {editing.kind === 'products' && (
              <ProductSourceFields
                section={editing}
                onChange={setEditing}
                errors={errors}
              />
            )}

            {editing.kind === 'coupon' && (
              <Field label="คูปองที่จะโปรโมต" required error={errors.couponCode} hint="ถ้าคูปองถูกปิดหรือหมดอายุ section นี้จะซ่อนเองอัตโนมัติ">
                <Select
                  value={editing.couponCode}
                  onChange={(e) => setEditing({ ...editing, couponCode: e.target.value })}
                >
                  <option value="">- เลือกคูปอง -</option>
                  {coupons.map((c) => {
                    const expired = c.expiresAt < todayKey()
                    return (
                      <option key={c.code} value={c.code}>
                        {c.code} - {c.description}
                        {expired ? ' (หมดอายุแล้ว)' : !c.active ? ' (ปิดใช้)' : ` (ถึง ${thaiDate(c.expiresAt)})`}
                      </option>
                    )
                  })}
                </Select>
              </Field>
            )}

            {editing.kind === 'categories' && (
              <p className="rounded-md bg-gp-surface p-4 text-sm text-gp-ink-soft">
                แสดงปุ่มลัดของหมวดหมู่ที่เปิดแสดงอยู่ ({num(categories.length)} หมวด) ตามลำดับในหน้า{' '}
                <Link to="/admin/categories" className="font-semibold text-gp-red hover:underline">จัดการหมวดหมู่</Link>
              </p>
            )}

            <Checkbox
              checked={editing.active}
              onChange={(active) => setEditing({ ...editing, active })}
              label="แสดง section นี้บนหน้าแรก"
            />

            {editing.kind === 'products' && (
              <p className="text-xs text-gp-ink-soft">
                ขณะนี้จะแสดงสินค้า {num(resolveProducts({
                  ...editing,
                  limit: editing.source === 'manual' ? Math.max(1, editing.productIds.length) : editing.limit,
                }).length)} ชิ้น (นับเฉพาะสินค้าที่เปิดขาย จากทั้งหมด {num(activeProducts.length)} ชิ้น)
              </p>
            )}
          </form>
        )}
      </Modal>

      {/* ยืนยันก่อนลบ section */}
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) deleteSection(deleting.id)
          setDeleting(null)
        }}
        title="ลบ section"
        confirmLabel="ลบ section"
      >
        {deleting && (
          <>
            <p>
              ลบ section <span className="font-bold">“{deleting.title || KIND_LABEL[deleting.kind]}”</span> ออกจากหน้าแรกใช่หรือไม่?
            </p>
            <p className="text-gp-ink-soft">
              ลบแล้วกู้คืนไม่ได้ - ถ้าแค่ไม่อยากให้แสดงชั่วคราว กดปุ่ม “ซ่อน” แทนได้ สินค้าและคูปองใน section ไม่ถูกลบไปด้วย
            </p>
          </>
        )}
      </ConfirmDialog>
    </>
  )
}

/** ช่องตั้งค่าแหล่งสินค้าของ section ชนิดรายการสินค้า */
function ProductSourceFields({
  section, onChange, errors,
}: { section: HomeSection; onChange: (next: HomeSection) => void; errors: Record<string, string> }) {
  const { categoryList } = useCatalog()
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="แหล่งสินค้า" required>
          <Select
            value={section.source}
            onChange={(e) => onChange({ ...section, source: e.target.value as ProductSource })}
          >
            {(Object.keys(SOURCE_LABEL) as ProductSource[]).map((s) => (
              <option key={s} value={s}>{SOURCE_LABEL[s]}</option>
            ))}
          </Select>
        </Field>

        {section.source === 'category' && (
          <Field label="หมวดหมู่" required error={errors.categoryId}>
            <Select
              value={section.categoryId ?? ''}
              onChange={(e) => onChange({ ...section, categoryId: e.target.value || null })}
            >
              <option value="">- เลือกหมวดหมู่ -</option>
              {categoryList.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
        )}

        {section.source !== 'manual' && (
          <Field label="จำนวนที่แสดงสูงสุด" hint={`1–${MAX_LIMIT} ชิ้น (แถวละ 4 ชิ้น)`}>
            <Input
              type="number"
              min={1}
              max={MAX_LIMIT}
              value={section.limit}
              onChange={(e) => onChange({ ...section, limit: Number(e.target.value) || 1 })}
            />
          </Field>
        )}
      </div>

      {section.source === 'manual' && (
        <ManualProductPicker
          productIds={section.productIds}
          onChange={(productIds) => onChange({ ...section, productIds })}
          error={errors.productIds}
        />
      )}
    </>
  )
}

/** เลือกสินค้าเองพร้อมจัดลำดับ - ซ้าย: ที่เลือกแล้ว, ขวา: ค้นหาเพื่อเพิ่ม */
function ManualProductPicker({
  productIds, onChange, error,
}: { productIds: string[]; onChange: (ids: string[]) => void; error?: string }) {
  const { products, activeProducts } = useCatalog()
  const [search, setSearch] = useState('')

  const selected = productIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p) => p !== undefined)

  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase()
    return activeProducts
      .filter((p) => !productIds.includes(p.id))
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
  }, [activeProducts, productIds, search])

  function move(id: string, direction: -1 | 1) {
    const index = productIds.indexOf(id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= productIds.length) return
    const next = [...productIds]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <p className="mb-1.5 text-sm font-semibold text-gp-ink">
          สินค้าที่เลือก ({num(selected.length)})<span className="ml-1 text-gp-red">*</span>
        </p>
        <div className="max-h-80 overflow-y-auto rounded-md border border-gp-line">
          {selected.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-gp-ink-soft">ยังไม่ได้เลือกสินค้า - กดเพิ่มจากรายการด้านขวา</p>
          ) : (
            <ul className="divide-y divide-gp-line">
              {selected.map((p, index) => (
                <li key={p.id} className={cx('flex items-center gap-2 px-2 py-2', !p.active && 'opacity-60')}>
                  <ReorderButtons
                    label={p.name}
                    onMove={(direction) => move(p.id, direction)}
                    isFirst={index === 0}
                    isLast={index === selected.length - 1}
                  />
                  <Img src={p.images[0] ?? ''} alt="" className="h-10 w-10 shrink-0 rounded border border-gp-line object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-xs font-semibold text-gp-ink">{p.name}</p>
                    <p className="text-xs text-gp-ink-soft">{p.active ? baht(effectivePrice(p.price, p.salePrice)) : 'ปิดขายอยู่ - ไม่แสดงบนหน้าแรก'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onChange(productIds.filter((id) => id !== p.id))}
                    aria-label={`นำ ${p.name} ออก`}
                    className="rounded-md p-1.5 text-gp-ink-soft transition-colors hover:bg-gp-red-tint hover:text-gp-red"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {error && selected.length === 0 && <p className="mt-1 text-xs font-medium text-gp-red">{error}</p>}
      </div>

      <div>
        <p className="mb-1.5 text-sm font-semibold text-gp-ink">เพิ่มสินค้า</p>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อหรือรหัสสินค้า"
          aria-label="ค้นหาสินค้าเพื่อเพิ่ม"
          className="mb-2"
        />
        <ul className="max-h-68 divide-y divide-gp-line overflow-y-auto rounded-md border border-gp-line">
          {candidates.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onChange([...productIds, p.id])}
                className="flex w-full items-center gap-2 px-2 py-2 text-left transition-colors hover:bg-gp-surface"
              >
                <Img src={p.images[0] ?? ''} alt="" className="h-10 w-10 shrink-0 rounded border border-gp-line object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 text-xs font-semibold text-gp-ink">{p.name}</span>
                  <span className="text-xs text-gp-ink-soft">{p.sku} · {baht(effectivePrice(p.price, p.salePrice))}</span>
                </span>
                <PlusIcon className="h-4 w-4 shrink-0 text-gp-red" />
              </button>
            </li>
          ))}
          {candidates.length === 0 && (
            <li className="px-4 py-8 text-center text-xs text-gp-ink-soft">ไม่พบสินค้าที่เพิ่มได้</li>
          )}
        </ul>
      </div>
    </div>
  )
}
