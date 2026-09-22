// ── แอนิเมชันรูปสินค้าวิ่งเข้าตะกร้า ────────────────────────────────
// กดเพิ่มลงตะกร้าแล้วมีรูปสินค้าย่อส่วนโค้งวิ่งไปลงที่ไอคอนตะกร้าบน navbar
// แล้วตะกร้าเด้งรับ เพื่อให้เห็นชัดว่าของถูกหยิบเข้าตะกร้าแล้วจริง
import { createContext, useCallback, useContext, useRef, type ReactNode, type RefObject } from 'react'

/** ระยะเวลาที่รูปวิ่งจากสินค้าไปถึงตะกร้า (มิลลิวินาที) */
const FLIGHT_MS = 700
/** ขนาดที่รูปย่อลงเหลือเมื่อถึงตะกร้า */
const END_SCALE = 0.18
/** ความสูงที่เส้นทางโค้งยกขึ้นจากเส้นตรง */
const ARC_LIFT = 90

interface FlyToCartValue {
  cartRef: RefObject<HTMLElement | null>
  fly: (sourceEl: HTMLElement | null) => void
}

const FlyToCartContext = createContext<FlyToCartValue | null>(null)

/** ผู้ใช้ที่ตั้งค่าลดการเคลื่อนไหวไว้ไม่ควรเห็นอะไรวิ่งไปมา */
function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * สั่งให้ปุ่มตะกร้าเด้ง
 *
 * ถอด class ออกแล้วบังคับ reflow ก่อนใส่กลับ เพราะถ้ากดรัว ๆ แล้ว class
 * ยังค้างอยู่ เบราว์เซอร์จะมองว่าไม่มีอะไรเปลี่ยนและไม่เล่นแอนิเมชันซ้ำ
 */
function bumpCart(cart: HTMLElement) {
  cart.classList.remove('gp-cart-bump')
  void cart.offsetWidth
  cart.classList.add('gp-cart-bump')
  cart.addEventListener(
    'animationend',
    () => cart.classList.remove('gp-cart-bump'),
    { once: true },
  )
}

export function FlyToCartProvider({ children }: { children: ReactNode }) {
  const cartRef = useRef<HTMLElement | null>(null)

  const fly = useCallback((sourceEl: HTMLElement | null) => {
    const cart = cartRef.current
    // ไม่มีปุ่มตะกร้าบนหน้าจอ (เช่นหน้าหลังบ้าน) ก็แค่ไม่ต้องทำอะไร
    if (!cart || !sourceEl) return

    if (prefersReducedMotion()) {
      bumpCart(cart)
      return
    }

    // ใช้รูปที่เรนเดอร์อยู่จริง จะได้ตรงกับที่ลูกค้าเห็น และถ้ารูปนั้นโหลดไม่ขึ้น
    // จนคอมโพเนนต์ Img สลับไปใช้ภาพสำรองแล้ว ตัวที่วิ่งก็จะเป็นภาพสำรองตามไปด้วย
    const sourceImg = sourceEl.querySelector('img')
    const src = sourceImg?.currentSrc || sourceImg?.src
    if (!src) return

    const from = sourceEl.getBoundingClientRect()
    const to = cart.getBoundingClientRect()
    if (from.width === 0 || to.width === 0) return

    const dx = to.left + to.width / 2 - (from.left + from.width / 2)
    const dy = to.top + to.height / 2 - (from.top + from.height / 2)

    const node = document.createElement('img')
    node.src = src
    node.alt = ''
    node.dataset.flyToCart = 'true'
    node.setAttribute('aria-hidden', 'true')
    node.style.cssText = [
      'position:fixed',
      `left:${from.left}px`,
      `top:${from.top}px`,
      `width:${from.width}px`,
      `height:${from.height}px`,
      'object-fit:cover',
      'border-radius:12px',
      'box-shadow:0 12px 28px rgba(51,57,70,0.35)',
      'pointer-events:none',
      // navbar เป็น z-40 ตัวที่วิ่งจึงต้องสูงกว่านั้นเพื่อไม่ให้ลอดไปข้างหลัง
      'z-index:100',
      'will-change:transform,opacity',
    ].join(';')
    document.body.appendChild(node)

    const animation = node.animate(
      [
        { transform: 'translate(0px, 0px) scale(1)', opacity: 1, offset: 0 },
        {
          // ยกขึ้นกลางทางเพื่อให้เป็นเส้นโค้งแทนที่จะพุ่งตรง
          transform: `translate(${dx * 0.5}px, ${dy * 0.5 - ARC_LIFT}px) scale(${(1 + END_SCALE) / 2})`,
          opacity: 1,
          offset: 0.55,
        },
        { transform: `translate(${dx}px, ${dy}px) scale(${END_SCALE})`, opacity: 0.2, offset: 1 },
      ],
      { duration: FLIGHT_MS, easing: 'cubic-bezier(0.4, 0, 0.5, 1)', fill: 'forwards' },
    )

    const cleanup = () => {
      node.remove()
      bumpCart(cart)
    }
    animation.onfinish = cleanup
    // เผื่อกรณีที่แอนิเมชันถูกยกเลิก (เช่นเปลี่ยนหน้าระหว่างที่ของกำลังวิ่ง)
    // จะได้ไม่มี element ค้างอยู่บนหน้าจอ
    animation.oncancel = () => node.remove()
  }, [])

  return (
    <FlyToCartContext.Provider value={{ cartRef, fly }}>
      {children}
    </FlyToCartContext.Provider>
  )
}

function useFlyToCartContext(): FlyToCartValue | null {
  return useContext(FlyToCartContext)
}

/** ref สำหรับผูกกับปุ่มตะกร้าบน navbar เพื่อใช้เป็นปลายทางของแอนิเมชัน */
export function useCartTarget(): RefObject<HTMLElement | null> {
  const ctx = useFlyToCartContext()
  // ref สำรองไว้เผื่อถูกใช้นอก provider จะได้ไม่พังทั้งหน้า
  const fallback = useRef<HTMLElement | null>(null)
  return ctx?.cartRef ?? fallback
}

/**
 * คืนฟังก์ชันสั่งให้รูปในกรอบที่ระบุวิ่งไปเข้าตะกร้า
 * ต้องเรียก `add()` ให้เรียบร้อยก่อนเสมอ แอนิเมชันเป็นแค่ของประกอบ
 * ถ้าส่วนนี้ทำงานไม่ได้ สินค้าก็ต้องเข้าตะกร้าอยู่ดี
 */
export function useFlyToCart(): (sourceEl: HTMLElement | null) => void {
  const ctx = useFlyToCartContext()
  return ctx?.fly ?? noop
}

function noop() {}
