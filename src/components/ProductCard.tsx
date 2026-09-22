// ── กล่องสินค้า ใช้ทั้งหน้าแรกและหน้ารายการสินค้า ────────────────────
import { Link } from 'react-router-dom'
import type { Product } from '../types'
import { baht, discountPercent, effectivePrice } from '../lib/format'
import { useCart } from '../store/AppStore'
import { Badge, Button } from './ui'
import { Img } from './Img'

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart()
  const price = effectivePrice(product.price, product.salePrice)
  const percent = discountPercent(product.price, product.salePrice)
  const soldOut = product.stock <= 0

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-gp-line bg-white transition-shadow hover:shadow-xl">
      <Link to={`/product/${product.id}`} className="relative block aspect-square overflow-hidden bg-gp-surface">
        <Img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          width={800}
          height={800}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
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
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Badge tone="slate" className="mb-2 self-start">{product.category}</Badge>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-gp-ink">
          <Link to={`/product/${product.id}`} className="hover:text-gp-red">{product.name}</Link>
        </h3>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="tnum text-lg font-bold text-gp-red">{baht(price)}</span>
          {percent > 0 && (
            <span className="tnum text-sm text-gp-ink-soft line-through">{baht(product.price)}</span>
          )}
        </div>

        <p className="mt-1 text-xs text-gp-ink-soft">
          {soldOut ? 'หมดสต็อก' : `คงเหลือ ${product.stock.toLocaleString('th-TH')} ชิ้น`}
        </p>

        <Button
          size="sm"
          className="mt-4 w-full"
          disabled={soldOut}
          onClick={() => add(product.id, 1)}
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
