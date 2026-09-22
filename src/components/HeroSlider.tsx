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
      <div className="flex h-56 items-center justify-center bg-gp-ink text-sm text-white/70 sm:h-72">
        ยังไม่มีแบนเนอร์ที่อยู่ในช่วงวันที่แสดงผล
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
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {banners.map((banner, i) => (
          <div
            key={banner.id}
            className="relative w-full shrink-0"
            aria-hidden={i !== index}
            role="group"
            aria-label={`${i + 1} จาก ${total}`}
          >
            <Img
              src={banner.image}
              alt={banner.title}
              width={1600}
              height={640}
              loading={i === 0 ? 'eager' : 'lazy'}
              className="h-56 w-full object-cover sm:h-80 lg:h-[26rem]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-gp-ink-dark/90 via-gp-ink-dark/50 to-transparent" />
            <div className="absolute inset-0 flex items-center">
              <div className="mx-auto w-full max-w-7xl px-4 lg:px-6">
                <div className="max-w-xl">
                  <h2 className="text-2xl font-bold leading-tight text-white drop-shadow sm:text-4xl lg:text-5xl">
                    {banner.title}
                  </h2>
                  <p className="mt-3 hidden text-sm text-white/80 sm:block sm:text-base">{banner.subtitle}</p>
                  <Link
                    to={banner.ctaLink}
                    className="mt-5 inline-flex items-center rounded-md bg-gp-red px-6 py-3 text-sm font-bold text-white shadow-lg transition-colors hover:bg-gp-red-dark sm:mt-7"
                  >
                    {banner.ctaLabel}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="แบนเนอร์ก่อนหน้า"
            className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/30 sm:left-5 sm:h-12 sm:w-12"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="แบนเนอร์ถัดไป"
            className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/30 sm:right-5 sm:h-12 sm:w-12"
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>

          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 sm:bottom-6">
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
        </>
      )}
    </section>
  )
}
