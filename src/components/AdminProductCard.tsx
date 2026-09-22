// ── การ์ดสินค้าสำหรับระบบหลังบ้าน ──────────────────────────────────
// ใช้กรอบรูปและป้ายราคาชุดเดียวกับการ์ดหน้าร้าน เพื่อให้คนจัดหน้าร้าน
// เห็นภาพตรงกับที่ลูกค้าจะเห็นจริง แล้วเติมข้อมูลที่เฉพาะหลังบ้านต้องใช้
import type { Product } from '../types'
import { num } from '../lib/format'
import { PriceTag, ProductThumb } from './ProductCard'
import { Badge, Button, cx } from './ui'
import { EditIcon, TrashIcon } from './Icons'

/** จำนวนคงเหลือที่ถือว่าใกล้หมด (เกณฑ์เดียวกับมุมมองตาราง) */
const LOW_STOCK = 20

export function AdminProductCard({
  product, onEdit, onDelete,
}: { product: Product; onEdit: () => void; onDelete: () => void }) {
  const lowStock = product.stock <= LOW_STOCK

  return (
    <article
      className={cx(
        'group relative flex flex-col overflow-hidden rounded-lg border border-gp-line bg-white transition-shadow hover:shadow-xl',
        !product.active && 'opacity-60',
      )}
    >
      <ProductThumb product={product} />

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex flex-wrap items-center gap-1">
          <Badge tone="slate">{product.category}</Badge>
          {product.recommended && <Badge tone="red">แนะนำ</Badge>}
          {!product.active && <Badge tone="ink">ปิดขาย</Badge>}
        </div>

        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-gp-ink">
          {product.name}
        </h3>
        <p className="mt-1 text-xs text-gp-ink-soft">
          {product.sku} · {product.images.length} รูป
        </p>

        <PriceTag product={product} className="mt-3" />

        <p className="mt-1 text-xs">
          <span className="text-gp-ink-soft">คงเหลือ </span>
          <span className={cx('tnum font-semibold', lowStock ? 'text-amber-600' : 'text-gp-ink')}>
            {num(product.stock)} ชิ้น
          </span>
          {lowStock && <span className="ml-1 text-amber-600">· ใกล้หมด</span>}
        </p>

        {/* z-20 ทำให้แถวปุ่มลอยเหนือปุ่มที่ทับทั้งการ์ด (z-10) จึงกดได้ตามปกติ */}
        <div className="relative z-20 mt-4 flex gap-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={onEdit}>
            <EditIcon className="h-4 w-4" />
            แก้ไข
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={onDelete}
            aria-label={`ลบ ${product.name}`}
            className="px-3"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/*
        ปุ่มโปร่งใสทับทั้งการ์ดเป็นเป้าคลิก (รูปแบบ stretched link)
        วางไว้ท้ายสุดและให้ z-10 เพื่อให้ลอยอยู่เหนือรูปและข้อความ
        ถ้าวางไว้ต้น DOM ด้วย z-0 รูปที่มาทีหลังจะทับปุ่มนี้จนกดไม่โดน

        ใช้วิธีนี้แทน onClick ที่ตัว article เพราะกดด้วยคีย์บอร์ดได้
        และไม่เกิดปุ่มซ้อนปุ่มซึ่งผิดหลัก accessibility
      */}
      <button
        type="button"
        onClick={onEdit}
        aria-label={`แก้ไข ${product.name}`}
        className="absolute inset-0 z-10 cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gp-red"
      />
    </article>
  )
}

/**
 * ตารางการ์ดสำหรับหลังบ้าน
 * ใช้คอลัมน์น้อยกว่าหน้าร้านเพราะมี sidebar กินความกว้างไป
 * ถ้าอัด 4 คอลัมน์ตั้งแต่จอ lg การ์ดจะแคบจนดูรูปไม่ออก ซึ่งขัดกับจุดประสงค์
 */
export function AdminProductGrid({
  products, onEdit, onDelete,
}: {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {products.map((product) => (
        <AdminProductCard
          key={product.id}
          product={product}
          onEdit={() => onEdit(product)}
          onDelete={() => onDelete(product)}
        />
      ))}
    </div>
  )
}
