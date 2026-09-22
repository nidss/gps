// ── หน้าแรก: แบนเนอร์เลื่อนอัตโนมัติ + สินค้าแนะนำแบบตาราง 4 คอลัมน์ ──
import { Link } from 'react-router-dom'
import { HeroSlider } from '../components/HeroSlider'
import { ProductGrid } from '../components/ProductCard'
import { Container } from '../components/Layout'
import { ButtonLink, EmptyState, SectionTitle } from '../components/ui'
import { useCatalog } from '../store/AppStore'
import { discountPercent } from '../lib/format'

export function Home() {
  const { liveBanners, recommendedProducts, activeProducts, categories } = useCatalog()

  // สินค้าลดราคา เรียงตามส่วนลดมากไปน้อย
  const onSale = [...activeProducts]
    .filter((p) => discountPercent(p.price, p.salePrice) > 0)
    .sort((a, b) => discountPercent(b.price, b.salePrice) - discountPercent(a.price, a.salePrice))
    .slice(0, 4)

  // สินค้ามาใหม่ เรียงตามวันที่เพิ่มล่าสุด
  const newArrivals = [...activeProducts]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4)

  return (
    <>
      <HeroSlider banners={liveBanners} />

      {/* หมวดหมู่ลัด */}
      <Container className="py-8">
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

      {/* สินค้าแนะนำ — ตาราง 4 คอลัมน์ตามที่กำหนด */}
      <Container className="pb-12">
        <SectionTitle
          title="สินค้าแนะนำ"
          action={
            <Link to="/products" className="text-sm font-semibold text-gp-red hover:underline">
              ดูทั้งหมด →
            </Link>
          }
        />
        {recommendedProducts.length > 0 ? (
          <ProductGrid products={recommendedProducts} />
        ) : (
          <EmptyState
            title="ยังไม่มีสินค้าแนะนำ"
            description="ไปที่ระบบหลังบ้าน แล้วติ๊ก “แนะนำ” ให้กับสินค้าที่ต้องการแสดงบนหน้าแรก"
            action={<ButtonLink to="/admin/products" variant="outline" size="sm">ไปจัดการสินค้า</ButtonLink>}
          />
        )}
      </Container>

      {/* แถบโปรโมชันคูปอง */}
      <div className="bg-gp-ink">
        <div className="speed-lines">
          <Container className="flex flex-col items-center gap-4 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gp-red-light">คูปองส่วนลด</p>
              <h3 className="mt-1.5 text-xl font-bold text-white sm:text-2xl">
                ใส่โค้ด <span className="text-gp-red-light">GP10</span> ลดทันที 10% ทั้งร้าน
              </h3>
              <p className="mt-1 text-sm text-white/60">ใช้ได้ที่หน้าชำระเงิน ไม่มียอดขั้นต่ำ</p>
            </div>
            <ButtonLink to="/products" size="lg">เลือกซื้อสินค้า</ButtonLink>
          </Container>
        </div>
      </div>

      {/* สินค้าลดราคา */}
      {onSale.length > 0 && (
        <Container className="py-12">
          <SectionTitle title="กำลังลดราคา" />
          <ProductGrid products={onSale} />
        </Container>
      )}

      {/* สินค้ามาใหม่ */}
      <Container className="pb-12">
        <SectionTitle title="สินค้ามาใหม่" />
        <ProductGrid products={newArrivals} />
      </Container>
    </>
  )
}
