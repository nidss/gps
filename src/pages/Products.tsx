// ── หน้ารายการสินค้าทั้งหมด พร้อมกรองหมวดหมู่ ค้นหา และเรียงลำดับ ─────
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Container, PageHeader } from '../components/Layout'
import { ProductGrid } from '../components/ProductCard'
import { EmptyState, Select, cx } from '../components/ui'
import { useCatalog } from '../store/AppStore'
import { effectivePrice } from '../lib/format'

type SortKey = 'recommended' | 'price-asc' | 'price-desc' | 'newest'

const sortLabels: Record<SortKey, string> = {
  recommended: 'แนะนำก่อน',
  newest: 'สินค้ามาใหม่',
  'price-asc': 'ราคาต่ำไปสูง',
  'price-desc': 'ราคาสูงไปต่ำ',
}

export function Products() {
  const [params, setParams] = useSearchParams()
  const { activeProducts, categories } = useCatalog()

  const category = params.get('category') ?? ''
  const query = params.get('q') ?? ''
  const sort = (params.get('sort') as SortKey) || 'recommended'

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = activeProducts.filter((p) => {
      const matchCategory = !category || p.category === category
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      return matchCategory && matchQuery
    })

    switch (sort) {
      case 'price-asc':
        return list.sort(
          (a, b) => effectivePrice(a.price, a.salePrice) - effectivePrice(b.price, b.salePrice),
        )
      case 'price-desc':
        return list.sort(
          (a, b) => effectivePrice(b.price, b.salePrice) - effectivePrice(a.price, a.salePrice),
        )
      case 'newest':
        return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      default:
        return list.sort((a, b) => Number(b.recommended) - Number(a.recommended))
    }
  }, [activeProducts, category, query, sort])

  /** อัปเดต query string โดยคงค่าอื่นไว้ */
  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  return (
    <>
      <PageHeader
        title={category || (query ? `ผลการค้นหา “${query}”` : 'สินค้าทั้งหมด')}
        breadcrumb={<span>หน้าแรก / สินค้า{category ? ` / ${category}` : ''}</span>}
      />

      <Container className="py-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setParam('category', '')}
              className={cx(
                'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                !category
                  ? 'border-gp-red bg-gp-red text-white'
                  : 'border-gp-line bg-white text-gp-ink hover:border-gp-red hover:text-gp-red',
              )}
            >
              ทั้งหมด
            </button>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setParam('category', c)}
                className={cx(
                  'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                  category === c
                    ? 'border-gp-red bg-gp-red text-white'
                    : 'border-gp-line bg-white text-gp-ink hover:border-gp-red hover:text-gp-red',
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm text-gp-ink-soft sm:inline">เรียงตาม</span>
            <Select
              value={sort}
              onChange={(e) => setParam('sort', e.target.value)}
              aria-label="เรียงลำดับสินค้า"
              className="w-44"
            >
              {(Object.keys(sortLabels) as SortKey[]).map((k) => (
                <option key={k} value={k}>{sortLabels[k]}</option>
              ))}
            </Select>
          </div>
        </div>

        <p className="mb-4 text-sm text-gp-ink-soft">พบสินค้า {filtered.length} รายการ</p>

        {filtered.length > 0 ? (
          <ProductGrid products={filtered} />
        ) : (
          <EmptyState
            title="ไม่พบสินค้าที่ตรงกับเงื่อนไข"
            description="ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่นดูครับ"
          />
        )}
      </Container>
    </>
  )
}
