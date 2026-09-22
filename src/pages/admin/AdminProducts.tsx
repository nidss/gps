// ── จัดการสินค้า: รูปหลายรูป รายละเอียด จำนวน ราคาเต็ม ราคาลด ──────────
import { useMemo, useState } from 'react'
import { AdminPageHeader } from '../../components/AdminLayout'
import { MultiImagePicker } from '../../components/ImagePicker'
import { Badge, Button, Card, Checkbox, Field, Input, Modal, Textarea, cx } from '../../components/ui'
import { EditIcon, GridIcon, ListIcon, PlusIcon, TrashIcon } from '../../components/Icons'
import { useCatalog } from '../../store/AppStore'
import type { Product } from '../../types'
import { baht, discountPercent, num } from '../../lib/format'
import { uid } from '../../lib/id'
import { KEYS, read, write } from '../../lib/storage'
import { Img } from '../../components/Img'
import { AdminProductGrid } from '../../components/AdminProductCard'

type ViewMode = 'grid' | 'table'

function emptyProduct(): Product {
  return {
    id: uid('p'), name: '', slug: '', sku: '', category: '', description: '',
    images: [], price: 0, salePrice: null, stock: 0,
    recommended: false, active: true, createdAt: new Date().toISOString(),
  }
}

export function AdminProducts() {
  const { products, categories, saveProduct, deleteProduct } = useCatalog()
  const [editing, setEditing] = useState<Product | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')

  // อ่านค่าที่เลือกไว้ครั้งก่อนแบบ lazy initializer ไม่งั้นหน้าจะกระพริบ
  // เป็นมุมมองเริ่มต้นก่อนแล้วค่อยเด้งไปมุมมองที่ผู้ใช้เลือกไว้
  const [view, setView] = useState<ViewMode>(() => read<ViewMode>(KEYS.adminProductView, 'grid'))

  function changeView(next: ViewMode) {
    setView(next)
    write(KEYS.adminProductView, next)
  }

  /** เปิดฟอร์มแก้ไขสินค้า ใช้ร่วมกันทั้งมุมมองการ์ดและตาราง */
  function openEdit(product: Product) {
    setErrors({})
    setEditing({ ...product })
  }

  function confirmDelete(product: Product) {
    if (window.confirm(`ลบสินค้า “${product.name}” ใช่หรือไม่?`)) deleteProduct(product.id)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return [...products]
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [products, search])

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return

    const next: Record<string, string> = {}
    if (!editing.name.trim()) next.name = 'กรุณากรอกชื่อสินค้า'
    if (!editing.sku.trim()) next.sku = 'กรุณากรอกรหัสสินค้า'
    if (!editing.category.trim()) next.category = 'กรุณาระบุหมวดหมู่'
    if (editing.images.length === 0) next.images = 'กรุณาเพิ่มรูปสินค้าอย่างน้อย 1 รูป'
    if (!(editing.price > 0)) next.price = 'ราคาเต็มต้องมากกว่า 0'
    if (editing.salePrice !== null && editing.salePrice >= editing.price) {
      next.salePrice = 'ราคาลดต้องน้อยกว่าราคาเต็ม'
    }
    if (editing.stock < 0) next.stock = 'จำนวนสินค้าต้องไม่ติดลบ'

    setErrors(next)
    if (Object.keys(next).length > 0) return

    saveProduct({
      ...editing,
      name: editing.name.trim(),
      sku: editing.sku.trim(),
      category: editing.category.trim(),
      // สร้าง slug จากรหัสสินค้าถ้ายังไม่ได้ตั้ง
      slug: editing.slug.trim() || editing.sku.trim().toLowerCase(),
    })
    setEditing(null)
  }

  return (
    <>
      <AdminPageHeader
        title="จัดการสินค้า"
        description={`ทั้งหมด ${num(products.length)} รายการ · เปิดขายอยู่ ${num(products.filter((p) => p.active).length)} รายการ`}
        action={
          <Button onClick={() => { setErrors({}); setEditing(emptyProduct()) }}>
            <PlusIcon className="h-4 w-4" />
            เพิ่มสินค้า
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-full max-w-sm">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อสินค้าหรือรหัสสินค้า"
            aria-label="ค้นหาสินค้า"
          />
        </div>

        {/* สลับมุมมอง — การ์ดเห็นรูปชัด ตารางเทียบตัวเลขได้เร็ว */}
        <div className="ml-auto inline-flex rounded-md border border-gp-line bg-white p-1">
          {([
            { mode: 'grid', label: 'มุมมองการ์ด', icon: GridIcon },
            { mode: 'table', label: 'มุมมองตาราง', icon: ListIcon },
          ] as const).map(({ mode, label, icon: Icon }) => (
            <button
              key={mode}
              type="button"
              onClick={() => changeView(mode)}
              aria-label={label}
              aria-pressed={view === mode}
              title={label}
              className={cx(
                'flex h-9 w-10 items-center justify-center rounded transition-colors',
                view === mode
                  ? 'bg-gp-ink text-white'
                  : 'text-gp-ink-soft hover:bg-gp-surface hover:text-gp-ink',
              )}
            >
              <Icon className="h-4.5 w-4.5" />
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="px-5 py-12 text-center text-sm text-gp-ink-soft">
          ไม่พบสินค้าที่ตรงกับคำค้นหา
        </Card>
      ) : view === 'grid' ? (
        <AdminProductGrid products={filtered} onEdit={openEdit} onDelete={confirmDelete} />
      ) : (
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] text-sm">
            <thead>
              <tr className="border-b border-gp-line bg-gp-surface text-left text-xs text-gp-ink-soft">
                <th className="px-4 py-3 font-semibold">สินค้า</th>
                <th className="px-4 py-3 font-semibold">หมวดหมู่</th>
                <th className="px-4 py-3 text-right font-semibold">ราคาเต็ม</th>
                <th className="px-4 py-3 text-right font-semibold">ราคาลด</th>
                <th className="px-4 py-3 text-right font-semibold">คงเหลือ</th>
                <th className="px-4 py-3 font-semibold">สถานะ</th>
                <th className="px-4 py-3 text-right font-semibold">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gp-line">
              {filtered.map((product) => {
                const percent = discountPercent(product.price, product.salePrice)
                return (
                  <tr key={product.id} className={cx(!product.active && 'opacity-60')}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Img
                          src={product.images[0] ?? ''}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-md border border-gp-line object-cover"
                        />
                        <div className="min-w-0">
                          <p className="line-clamp-1 font-semibold text-gp-ink">{product.name}</p>
                          <p className="text-xs text-gp-ink-soft">
                            {product.sku} · {product.images.length} รูป
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gp-ink-soft">{product.category}</td>
                    <td className="tnum whitespace-nowrap px-4 py-3 text-right text-gp-ink">
                      {baht(product.price)}
                    </td>
                    <td className="tnum whitespace-nowrap px-4 py-3 text-right">
                      {product.salePrice ? (
                        <span className="font-semibold text-gp-red">
                          {baht(product.salePrice)}
                          {percent > 0 && <span className="ml-1 text-xs">(−{percent}%)</span>}
                        </span>
                      ) : (
                        <span className="text-gp-ink-soft">—</span>
                      )}
                    </td>
                    <td className="tnum px-4 py-3 text-right">
                      <span className={cx('font-semibold', product.stock <= 20 ? 'text-amber-600' : 'text-gp-ink')}>
                        {num(product.stock)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Badge tone={product.active ? 'green' : 'slate'}>
                          {product.active ? 'เปิดขาย' : 'ปิดขาย'}
                        </Badge>
                        {product.recommended && <Badge tone="red">แนะนำ</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(product)}
                          aria-label={`แก้ไข ${product.name}`}
                          className="rounded-md p-2 text-gp-ink-soft transition-colors hover:bg-gp-surface hover:text-gp-ink"
                        >
                          <EditIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmDelete(product)}
                          aria-label={`ลบ ${product.name}`}
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
      </Card>
      )}

      {/* ฟอร์มเพิ่ม/แก้ไขสินค้า */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={products.some((p) => p.id === editing?.id) ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
        wide
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>ยกเลิก</Button>
            <Button type="submit" form="product-form">บันทึกสินค้า</Button>
          </>
        }
      >
        {editing && (
          <form id="product-form" onSubmit={handleSave} noValidate className="grid gap-4">
            <Field label="รูปภาพสินค้า (ใส่ได้มากกว่า 1 รูป)" required error={errors.images}>
              <MultiImagePicker
                images={editing.images}
                onChange={(images) => setEditing({ ...editing, images })}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="ชื่อสินค้า" required error={errors.name}>
                  <Input
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    placeholder="เช่น เสื้อโปโลทีมแข่ง Grandprix 2026"
                  />
                </Field>
              </div>

              <Field label="รหัสสินค้า (SKU)" required error={errors.sku}>
                <Input
                  value={editing.sku}
                  onChange={(e) => setEditing({ ...editing, sku: e.target.value })}
                  placeholder="GP-101"
                />
              </Field>

              <Field label="หมวดหมู่" required error={errors.category}>
                <Input
                  value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  list="admin-category-list"
                  placeholder="เช่น เสื้อผ้า"
                />
              </Field>
            </div>

            <datalist id="admin-category-list">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>

            <Field label="รายละเอียดสินค้า" hint="ขึ้นบรรทัดใหม่เพื่อแยกย่อหน้า">
              <Textarea
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                placeholder="อธิบายวัสดุ ขนาด และจุดเด่นของสินค้า"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="ราคาเต็ม (บาท)" required error={errors.price}>
                <Input
                  type="number"
                  min={0}
                  value={editing.price || ''}
                  onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) || 0 })}
                />
              </Field>

              <Field label="ราคาลด (บาท)" error={errors.salePrice} hint="เว้นว่างถ้าไม่ลดราคา">
                <Input
                  type="number"
                  min={0}
                  value={editing.salePrice ?? ''}
                  onChange={(e) =>
                    setEditing({ ...editing, salePrice: e.target.value === '' ? null : Number(e.target.value) })
                  }
                />
              </Field>

              <Field label="จำนวนสินค้า (ชิ้น)" required error={errors.stock}>
                <Input
                  type="number"
                  min={0}
                  value={editing.stock}
                  onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) || 0 })}
                />
              </Field>
            </div>

            <div className="grid gap-3 rounded-md bg-gp-surface p-4">
              <Checkbox
                checked={editing.recommended}
                onChange={(recommended) => setEditing({ ...editing, recommended })}
                label="แสดงในส่วน “สินค้าแนะนำ” บนหน้าแรก"
              />
              <Checkbox
                checked={editing.active}
                onChange={(active) => setEditing({ ...editing, active })}
                label="เปิดขายสินค้านี้"
                description="ถ้าปิด สินค้าจะไม่แสดงในหน้าร้าน"
              />
            </div>

            {/* ตัวอย่างการแสดงราคาบนหน้าร้าน */}
            {editing.price > 0 && (
              <div className="rounded-md border border-dashed border-gp-line p-4">
                <p className="mb-1.5 text-xs font-semibold text-gp-ink-soft">ตัวอย่างการแสดงราคาบนหน้าร้าน</p>
                <div className="flex items-baseline gap-2">
                  <span className="tnum text-lg font-bold text-gp-red">
                    {baht(editing.salePrice ?? editing.price)}
                  </span>
                  {editing.salePrice !== null && editing.salePrice < editing.price && (
                    <>
                      <span className="tnum text-sm text-gp-ink-soft line-through">{baht(editing.price)}</span>
                      <Badge tone="red">ลด {discountPercent(editing.price, editing.salePrice)}%</Badge>
                    </>
                  )}
                </div>
              </div>
            )}
          </form>
        )}
      </Modal>
    </>
  )
}
