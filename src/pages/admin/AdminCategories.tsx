// ── จัดการหมวดหมู่สินค้า: เพิ่ม เปลี่ยนชื่อ เรียงลำดับ ซ่อน และลบ ─────────
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminPageHeader } from '../../components/AdminLayout'
import { Alert, Badge, Button, Card, Checkbox, Field, Input, Modal, ReorderButtons, Select, cx } from '../../components/ui'
import { EditIcon, PlusIcon, TrashIcon } from '../../components/Icons'
import { useCatalog } from '../../store/AppStore'
import type { Category } from '../../types'
import { num } from '../../lib/format'
import { uid } from '../../lib/id'
import { nextSortOrder } from '../../lib/sortOrder'

export function AdminCategories() {
  const { products, categoryList, categories, saveCategory, deleteCategory, moveCategory } = useCatalog()
  const [editing, setEditing] = useState<Category | null>(null)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [moveTo, setMoveTo] = useState('')

  /** จำนวนสินค้าในแต่ละหมวด (นับทั้งที่เปิดและปิดขาย) */
  const productCount = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of products) map.set(p.category, (map.get(p.category) ?? 0) + 1)
    return map
  }, [products])

  const isNew = editing !== null && !categoryList.some((c) => c.id === editing.id)
  const deletingCount = deleting ? productCount.get(deleting.name) ?? 0 : 0

  function openNew() {
    setError('')
    setEditing({ id: uid('c'), name: '', sortOrder: nextSortOrder(categoryList), active: true })
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    const name = editing.name.trim()
    if (!name) return setError('กรุณากรอกชื่อหมวดหมู่')
    if (categoryList.some((c) => c.id !== editing.id && c.name.toLowerCase() === name.toLowerCase())) {
      return setError('มีหมวดหมู่ชื่อนี้อยู่แล้ว')
    }
    saveCategory({ ...editing, name })
    setEditing(null)
  }

  function openDelete(category: Category) {
    setDeleting(category)
    setMoveTo(categoryList.find((c) => c.id !== category.id)?.name ?? '')
  }

  function handleDelete() {
    if (!deleting) return
    deleteCategory(deleting.id, deletingCount > 0 ? moveTo : null)
    setDeleting(null)
  }

  return (
    <>
      <AdminPageHeader
        title="จัดการหมวดหมู่"
        description={`ทั้งหมด ${num(categoryList.length)} หมวด · แสดงบนหน้าร้าน ${num(categories.length)} หมวด — ลำดับที่นี่คือลำดับในเมนูและปุ่มลัดหน้าแรก`}
        action={
          <Button onClick={openNew}>
            <PlusIcon className="h-4 w-4" />
            เพิ่มหมวดหมู่
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="border-b border-gp-line bg-gp-surface text-left text-xs text-gp-ink-soft">
                <th className="px-4 py-3 font-semibold">ลำดับ</th>
                <th className="px-4 py-3 font-semibold">ชื่อหมวดหมู่</th>
                <th className="px-4 py-3 text-right font-semibold">จำนวนสินค้า</th>
                <th className="px-4 py-3 font-semibold">สถานะ</th>
                <th className="px-4 py-3 text-right font-semibold">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gp-line">
              {categoryList.map((category, index) => {
                const count = productCount.get(category.name) ?? 0
                const shown = categories.includes(category.name)
                return (
                  <tr key={category.id} className={cx(!category.active && 'opacity-60')}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="tnum w-6 text-center font-bold text-gp-ink">{index + 1}</span>
                        <ReorderButtons
                          label={category.name}
                          onMove={(direction) => moveCategory(category.id, direction)}
                          isFirst={index === 0}
                          isLast={index === categoryList.length - 1}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/products?category=${encodeURIComponent(category.name)}`}
                        className="font-semibold text-gp-ink hover:text-gp-red"
                      >
                        {category.name}
                      </Link>
                    </td>
                    <td className="tnum px-4 py-3 text-right text-gp-ink">{num(count)}</td>
                    <td className="px-4 py-3">
                      {!category.active ? (
                        <Badge tone="slate">ซ่อนจากเมนู</Badge>
                      ) : shown ? (
                        <Badge tone="green">แสดงอยู่</Badge>
                      ) : (
                        <Badge tone="amber">ไม่มีสินค้าเปิดขาย</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => { setError(''); setEditing({ ...category }) }}
                          aria-label={`แก้ไข ${category.name}`}
                          className="rounded-md p-2 text-gp-ink-soft transition-colors hover:bg-gp-surface hover:text-gp-ink"
                        >
                          <EditIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDelete(category)}
                          aria-label={`ลบ ${category.name}`}
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

        {categoryList.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-gp-ink-soft">
            ยังไม่มีหมวดหมู่ — กด “เพิ่มหมวดหมู่” เพื่อเริ่มต้น
          </p>
        )}
      </Card>

      {/* ฟอร์มเพิ่ม/แก้ไขหมวดหมู่ */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={isNew ? 'เพิ่มหมวดหมู่ใหม่' : 'แก้ไขหมวดหมู่'}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>ยกเลิก</Button>
            <Button type="submit" form="category-form">บันทึกหมวดหมู่</Button>
          </>
        }
      >
        {editing && (
          <form id="category-form" onSubmit={handleSave} noValidate className="grid gap-4">
            <Field
              label="ชื่อหมวดหมู่"
              required
              error={error}
              hint={
                !isNew && (productCount.get(editing.name) ?? 0) > 0
                  ? 'เปลี่ยนชื่อแล้ว สินค้าทุกชิ้นในหมวดนี้จะย้ายไปใช้ชื่อใหม่ให้อัตโนมัติ'
                  : undefined
              }
            >
              <Input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="เช่น เสื้อผ้า"
                autoFocus
              />
            </Field>
            <Checkbox
              checked={editing.active}
              onChange={(active) => setEditing({ ...editing, active })}
              label="แสดงหมวดนี้ในเมนูและปุ่มลัดหน้าแรก"
              description="ถ้าปิด จะซ่อนแค่ในเมนู สินค้าในหมวดยังเปิดขายและค้นหาเจอตามปกติ"
            />
          </form>
        )}
      </Modal>

      {/* ยืนยันการลบ — ถ้ามีสินค้าอยู่ต้องเลือกหมวดที่จะย้ายสินค้าไป */}
      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="ลบหมวดหมู่"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setDeleting(null)}>ยกเลิก</Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              disabled={deletingCount > 0 && !moveTo}
            >
              {deletingCount > 0 ? 'ย้ายสินค้าและลบหมวด' : 'ลบหมวดหมู่'}
            </Button>
          </>
        }
      >
        {deleting && (
          <div className="grid gap-4">
            <p className="text-sm text-gp-ink">
              ลบหมวดหมู่ <span className="font-bold">“{deleting.name}”</span> ใช่หรือไม่?
            </p>
            {deletingCount > 0 &&
              (categoryList.length > 1 ? (
                <Field
                  label={`หมวดนี้มีสินค้า ${num(deletingCount)} ชิ้น — ย้ายสินค้าไปที่หมวด`}
                  required
                >
                  <Select value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
                    {categoryList
                      .filter((c) => c.id !== deleting.id)
                      .map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                  </Select>
                </Field>
              ) : (
                <Alert tone="amber">
                  หมวดนี้มีสินค้า {num(deletingCount)} ชิ้น และไม่มีหมวดอื่นให้ย้ายไป — เพิ่มหมวดใหม่ก่อนแล้วค่อยลบ
                </Alert>
              ))}
          </div>
        )}
      </Modal>
    </>
  )
}
