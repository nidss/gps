// ── หน้าแรก: แบนเนอร์เลื่อนอัตโนมัติ + section ที่จัดการได้จากหลังบ้าน ──
// ลำดับ การเปิด-ปิด และเนื้อหาของแต่ละ section ตั้งค่าที่ /admin/home
import { Link } from 'react-router-dom'
import { HeroSlider } from '../components/HeroSlider'
import { ProductGrid } from '../components/ProductCard'
import { Container } from '../components/Layout'
import { ButtonLink, SectionTitle } from '../components/ui'
import { useCatalog, useHomeSections } from '../store/AppStore'
import type { HomeSection } from '../types'
import { num, thaiDate } from '../lib/format'

export function Home() {
  const { liveBanners } = useCatalog()
  const { liveSections } = useHomeSections()

  return (
    <>
      <HeroSlider banners={liveBanners} />

      <div className="pt-2 pb-6">
        {liveSections.map((section) => {
          switch (section.kind) {
            case 'categories':
              return <CategoryShortcuts key={section.id} section={section} />
            case 'coupon':
              return <CouponStrip key={section.id} section={section} />
            case 'products':
              return <ProductSection key={section.id} section={section} />
          }
        })}
      </div>
    </>
  )
}

/** ปุ่มลัดหมวดหมู่ — หัวข้อไม่บังคับ เว้นว่างได้ */
function CategoryShortcuts({ section }: { section: HomeSection }) {
  const { categories } = useCatalog()
  if (categories.length === 0) return null
  return (
    <Container className="py-6">
      {section.title && <SectionTitle title={section.title} />}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map((c) => (
          <Link
            key={c}
            to={`/products?category=${encodeURIComponent(c)}`}
            className="flex items-center justify-center rounded-md border border-gp-line bg-white px-3 py-4 text-center text-sm font-semibold text-gp-ink transition-colors hover:border-gp-red hover:text-gp-red"
          >
            {c}
          </Link>
        ))}
      </div>
    </Container>
  )
}

/** แถบโปรโมชันคูปอง — ไม่แสดงถ้าคูปองถูกปิดหรือหมดอายุ */
function CouponStrip({ section }: { section: HomeSection }) {
  const { resolveCoupon } = useHomeSections()
  const coupon = resolveCoupon(section)
  if (!coupon) return null
  return (
    <div className="my-6 bg-gp-ink">
      <div className="speed-lines">
        <Container className="flex flex-col items-center gap-4 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            {section.title && (
              <p className="text-xs font-bold uppercase tracking-widest text-gp-red-light">{section.title}</p>
            )}
            <h3 className="mt-1.5 text-xl font-bold text-white sm:text-2xl">
              ใส่โค้ด <span className="text-gp-red-light">{coupon.code}</span> {coupon.description}
            </h3>
            <p className="mt-1 text-sm text-white/60">
              ใช้ได้ที่หน้าชำระเงิน{' '}
              {coupon.minSpend > 0 ? `เมื่อซื้อครบ ${num(coupon.minSpend)} บาท` : 'ไม่มียอดขั้นต่ำ'}
              {' · '}ถึง {thaiDate(coupon.expiresAt)}
            </p>
          </div>
          <ButtonLink to="/products" size="lg">เลือกซื้อสินค้า</ButtonLink>
        </Container>
      </div>
    </div>
  )
}

/** รายการสินค้าแบบตาราง 4 คอลัมน์ — ไม่แสดงถ้าไม่มีสินค้าให้แสดง */
function ProductSection({ section }: { section: HomeSection }) {
  const { categoryList } = useCatalog()
  const { resolveProducts } = useHomeSections()
  const products = resolveProducts(section)
  if (products.length === 0) return null

  const categoryName =
    section.source === 'category' ? categoryList.find((c) => c.id === section.categoryId)?.name : undefined
  const moreLink = categoryName ? `/products?category=${encodeURIComponent(categoryName)}` : '/products'

  return (
    <Container className="py-6">
      <SectionTitle
        title={section.title}
        action={
          <Link to={moreLink} className="text-sm font-semibold text-gp-red hover:underline">
            ดูทั้งหมด →
          </Link>
        }
      />
      <ProductGrid products={products} />
    </Container>
  )
}
