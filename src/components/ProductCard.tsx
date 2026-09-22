// ── กล่องสินค้า ใช้ทั้งหน้าแรกและหน้ารายการสินค้า ────────────────────
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../types'
import { baht, discountPercent, effectivePrice } from '../lib/format'
import { useCart } from '../store/AppStore'
import { Badge, Button, cx } from './ui'
import { Img } from './Img'
import { useFlyToCart } from './FlyToCart'

/**
 * กรอบรูปสินค้าทรงสี่เหลี่ยมจัตุรัส พร้อมป้ายส่วนลดและป้ายสินค้าหมด
 * แยกออกมาเพื่อให้การ์ดฝั่งหลังบ้านใช้ดีไซน์เดียวกันได้โดยไม่ต้องคัดลอกโค้ด
 */
export function ProductThumb({
  product, className, zoomOnHover = true,
}: { product: Product; className?: string; zoomOnHover?: boolean }) {
  const percent = discountPercent(product.price, product.salePrice)
  const soldOut = product.stock <= 0

  return (
    <div className={cx('relative block aspect-square overflow-hidden bg-gp-surface', className)}>
      <Img
        src={product.images[0] ?? ''}
        alt={product.name}
        loading="lazy"
        width={800}
        height={800}
        className={cx(
          'h-full w-full object-cover transition-transform duration-500',
          zoomOnHover && 'group-hover:scale-105',
        )}
      />
      {percent > 0 && (
        <span className="absolute left-0 top-3 bg-gp-red px-3 py-1 text-xs font-bold text-white shadow-md">
          ลด {percent}%
        </span>
      )}
      {soldOut && (
        <span className="absolute inset-0 flex items-center justify-center bg-gp-ink/65 text-sm font-bold text-white">
          สินค้าหมดชั่วคราว
        </span>
      )}
    </div>
  )
}

/** ราคาที่ขายจริง พร้อมราคาเต็มขีดฆ่าเมื่อมีส่วนลด */
export function PriceTag({ product, className }: { product: Product; className?: string }) {
  const price = effectivePrice(product.price, product.salePrice)
  const percent = discountPercent(product.price, product.salePrice)

  return (
    <div className={cx('flex items-baseline gap-2', className)}>
      <span className="tnum text-lg font-bold text-gp-red">{baht(price)}</span>
      {percent > 0 && (
        <span className="tnum text-sm text-gp-ink-soft line-through">{baht(product.price)}</span>
      )}
    </div>
  )
}

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart()
  const fly = useFlyToCart()
  // ผูกกับ <Link> ที่ห่อรูปอยู่แล้ว ไม่เพิ่ม element ใหม่ เลย์เอาต์จึงไม่ขยับ
  const thumbRef = useRef<HTMLAnchorElement>(null)
  const soldOut = product.stock <= 0

  function handleAdd() {
    // เพิ่มลงตะกร้าก่อนเสมอ แอนิเมชันเป็นแค่ของประกอบ
    add(product.id, 1)
    fly(thumbRef.current)
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-gp-line bg-white transition-shadow hover:shadow-xl">
      <Link to={`/product/${product.id}`} ref={thumbRef}>
        <ProductThumb product={product} />
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Badge tone="slate" className="mb-2 self-start">{product.category}</Badge>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-gp-ink">
          <Link to={`/product/${product.id}`} className="hover:text-gp-red">{product.name}</Link>
        </h3>

        <PriceTag product={product} className="mt-3" />

        <p className="mt-1 text-xs text-gp-ink-soft">
          {soldOut ? 'หมดสต็อก' : `คงเหลือ ${product.stock.toLocaleString('th-TH')} ชิ้น`}
        </p>

        <Button
          size="sm"
          className="mt-4 w-full"
          disabled={soldOut}
          onClick={handleAdd}
        >
          {soldOut ? 'สินค้าหมด' : 'เพิ่มลงตะกร้า'}
        </Button>
      </div>
    </article>
  )
}

/** ตารางสินค้า 4 คอลัมน์บนจอใหญ่ ตามที่กำหนดในหน้าแรก */
export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  )
}
