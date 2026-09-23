// ── แบนเนอร์หน้าแรกแบบเลื่อนอัตโนมัติ ───────────────────────────────
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Banner } from '../types'
import { ChevronLeftIcon, ChevronRightIcon } from './Icons'
import { cx } from './ui'
import { Img } from './Img'

const AUTOPLAY_MS = 6000

export function HeroSlider({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const total = banners.length

  const go = useCallback(
    (next: number) => {
      if (total === 0) return
      setIndex(((next % total) + total) % total)
    },
    [total],
  )

  // เลื่อนอัตโนมัติ หยุดเมื่อเอาเมาส์ไปวาง
  useEffect(() => {
    if (paused || total <= 1) return
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % total), AUTOPLAY_MS)
    return () => window.clearInterval(timer)
  }, [paused, total])

  // กันกรณี banner ถูกลบจนดัชนีเกินขอบเขต
  useEffect(() => {
    if (index >= total && total > 0) setIndex(0)
  }, [index, total])

  if (total === 0) {
    return (
      <div className="bg-gp-ink">
        <div className="mx-auto flex aspect-[4/1] max-w-[1600px] items-center justify-center px-4 text-center text-sm text-white/70">
          ยังไม่มีแบนเนอร์ที่อยู่ในช่วงวันที่แสดงผล
        </div>
      </div>
    )
  }

  return (
    <section
      className="relative overflow-hidden bg-gp-ink"
      aria-roledescription="carousel"
      aria-label="แบนเนอร์โปรโมชัน"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/*
        พื้นหลังด้านข้างบนจอที่กว้างกว่า 1600px: ใช้รูปแบนเนอร์ที่กำลังแสดงอยู่แบบเบลอแทนพื้นสีเรียบ
        ซ้อนไว้ทุกรูปแล้วสลับความทึบตามสไลด์ จะได้เปลี่ยนแบบค่อย ๆ จางไปพร้อมกับสไลด์
      */}
      <div className="absolute inset-0" aria-hidden="true">
        {banners.map((banner, i) => (
          <Img
            key={banner.id}
            src={banner.image}
            alt=""
            className={cx(
              'absolute inset-0 h-full w-full scale-110 object-cover blur-2xl transition-opacity duration-700',
              i === index ? 'opacity-60' : 'opacity-0',
            )}
          />
        ))}
        {/* ทับด้วยสีเข้มอีกชั้น ให้ขอบรูปจริงยังเด่นกว่าพื้นหลัง และข้อความใต้รูปบนจอเล็กอ่านง่าย */}
        <div className="absolute inset-0 bg-gp-ink-dark/40" />
      </div>

      {/*
        กรอบรูปใช้สัดส่วนคงที่ 4:1 ให้ตรงกับขนาดที่หลังบ้านแนะนำ (1600 × 400) รูปจึงแสดงครบทุกขนาดจอ
        และจำกัดกว้างสุด 1600px ไม่ให้รูปถูกขยายจนแตก
      */}
      <div className="relative mx-auto max-w-[1600px] overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {banners.map((banner, i) => (
            <div
              key={banner.id}
              className="w-full shrink-0"
              aria-hidden={i !== index}
              role="group"
              aria-label={`${i + 1} จาก ${total}`}
            >
              <div className="relative aspect-[4/1]">
                {banner.hideText ? (
                  // รูปที่มีข้อความในตัวแล้ว: แสดงรูปล้วน และให้ทั้งรูปเป็นลิงก์แทนปุ่ม
                  <Link to={banner.ctaLink} aria-label={banner.title} tabIndex={i === index ? 0 : -1} className="block h-full">
                    <SlideImage banner={banner} eager={i === 0} />
                  </Link>
                ) : (
                  <>
                    <SlideImage banner={banner} eager={i === 0} />
                    {/* จอ lg ขึ้นไป: ข้อความทับรูป */}
                    <div className="absolute inset-0 hidden bg-gradient-to-r from-gp-ink-dark/90 via-gp-ink-dark/50 to-transparent lg:block" />
                    <div className="absolute inset-0 hidden items-center lg:flex">
                      {/* เว้นขอบซ้าย-ขวาให้พ้นปุ่มลูกศร ไม่ให้ปุ่มทับตัวหนังสือ */}
                      <div className="mx-auto w-full max-w-7xl px-16">
                        <div className="max-w-xl">
                          <h2 className="text-3xl font-bold leading-tight text-white drop-shadow xl:text-4xl">
                            {banner.title}
                          </h2>
                          <p className="mt-2 text-base text-white/80">{banner.subtitle}</p>
                          <CtaLink banner={banner} focusable={i === index} className="mt-4" />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* จอเล็กกว่า lg: รูปเตี้ยเกินกว่าจะวางข้อความทับได้ จึงย้ายข้อความมาไว้ใต้รูป */}
              {!banner.hideText && (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4 lg:hidden">
                  <h2 className="text-lg font-bold leading-snug text-white sm:text-xl">{banner.title}</h2>
                  <CtaLink banner={banner} focusable={i === index} className="sm:ml-auto" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ปุ่มเลื่อนและจุดบอกตำแหน่ง วางในชั้นที่สัดส่วนเท่ารูป ให้อยู่กลางรูปเสมอแม้มีข้อความใต้รูปบนมือถือ */}
        {total > 1 && (
          <div className="pointer-events-none absolute inset-x-0 top-0 aspect-[4/1] [&_button]:pointer-events-auto">
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="แบนเนอร์ก่อนหน้า"
            className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/30 sm:left-4 sm:h-10 sm:w-10"
          >
            <ChevronLeftIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="แบนเนอร์ถัดไป"
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/30 sm:right-4 sm:h-10 sm:w-10"
          >
            <ChevronRightIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-2 sm:bottom-4">
            {banners.map((banner, i) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`ไปที่แบนเนอร์ที่ ${i + 1}`}
                aria-current={i === index}
                className={cx(
                  'h-2 rounded-full transition-all',
                  i === index ? 'w-8 bg-gp-red' : 'w-2 bg-white/50 hover:bg-white/80',
                )}
              />
            ))}
          </div>
          </div>
        )}
      </div>
    </section>
  )
}

function SlideImage({ banner, eager }: { banner: Banner; eager: boolean }) {
  return (
    <Img
      src={banner.image}
      alt={banner.title}
      width={1600}
      height={400}
      loading={eager ? 'eager' : 'lazy'}
      className="h-full w-full object-cover"
    />
  )
}

/** ปุ่มไปหน้าปลายทาง - สไลด์ที่ไม่ได้แสดงอยู่เอาออกจากลำดับ Tab ไม่ให้โฟกัสไปโดนของที่มองไม่เห็น */
function CtaLink({ banner, focusable, className }: { banner: Banner; focusable: boolean; className?: string }) {
  return (
    <Link
      to={banner.ctaLink}
      tabIndex={focusable ? 0 : -1}
      className={cx(
        'inline-flex items-center rounded-md bg-gp-red px-6 py-3 text-sm font-bold text-white shadow-lg transition-colors hover:bg-gp-red-dark',
        className,
      )}
    >
      {banner.ctaLabel}
    </Link>
  )
}
