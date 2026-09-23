// ── ส่วนท้ายเว็บ ────────────────────────────────────────────────────
import { Link } from 'react-router-dom'
import { asset } from '../lib/asset'
import { ReceiptIcon, ShieldIcon, TruckIcon } from './Icons'

const guarantees = [
  { icon: TruckIcon, title: 'ส่งฟรีเมื่อซื้อครบ 1,500 ฿', text: 'จัดส่งทั่วประเทศภายใน 2–5 วันทำการ' },
  { icon: ShieldIcon, title: 'สินค้าลิขสิทธิ์แท้ 100%', text: 'ผลิตและจำหน่ายโดยผู้ได้รับสิทธิ์อย่างเป็นทางการ' },
  { icon: ReceiptIcon, title: 'ออกใบกำกับภาษีได้', text: 'รองรับทั้งบุคคลธรรมดาและนิติบุคคล' },
]

export function Footer() {
  return (
    <footer className="mt-16">
      <div className="border-y border-gp-line bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-3 lg:px-6">
          {guarantees.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-gp-red-tint text-gp-red">
                <Icon className="h-5.5 w-5.5" />
              </span>
              <span>
                <span className="block text-sm font-bold text-gp-ink">{title}</span>
                <span className="mt-0.5 block text-xs text-gp-ink-soft">{text}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gp-ink">
        <div className="speed-lines">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
            <div className="sm:col-span-2 lg:col-span-1">
              <img src={asset('logo-grandprix.png')} alt="Grandprix Online" className="h-10 w-auto" />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
                ร้านค้าสินค้าพรีเมี่ยมอย่างเป็นทางการของการแข่งขัน Grandprix
                รวมเสื้อผ้า ของสะสม และของที่ระลึกลิขสิทธิ์แท้
              </p>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-white">ช้อปปิ้ง</h4>
              <ul className="grid gap-2 text-sm text-white/60">
                <li><Link to="/products" className="hover:text-gp-red-light">สินค้าทั้งหมด</Link></li>
                <li><Link to="/cart" className="hover:text-gp-red-light">ตะกร้าสินค้า</Link></li>
                <li><Link to="/account" className="hover:text-gp-red-light">ข้อมูลส่วนตัว</Link></li>
                <li><Link to="/register" className="hover:text-gp-red-light">สมัครสมาชิก</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-white">ช่วยเหลือ</h4>
              <ul className="grid gap-2 text-sm text-white/60">
                <li>วิธีสั่งซื้อและชำระเงิน</li>
                <li>นโยบายการจัดส่ง</li>
                <li>เงื่อนไขการเปลี่ยน/คืนสินค้า</li>
                <li>คำถามที่พบบ่อย</li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-white">ติดต่อเรา</h4>
              <ul className="grid gap-2 text-sm text-white/60">
                <li>โทร. 02-123-4567 (จ.–ศ. 9:00–18:00)</li>
                <li>อีเมล shop@grandprix.test</li>
                <li>LINE: @grandprixonline</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10">
            <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between lg:px-6">
              <p>© {new Date().getFullYear()} Grandprix Online. สงวนลิขสิทธิ์.</p>
              <p>เว็บไซต์สาธิต - ข้อมูลทั้งหมดเก็บในเบราว์เซอร์ของคุณเท่านั้น</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
