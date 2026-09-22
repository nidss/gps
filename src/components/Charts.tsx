// ── กราฟสำหรับหน้า dashboard (เขียนด้วย SVG เอง ไม่พึ่งไลบรารีภายนอก) ──
import { baht, num } from '../lib/format'

export interface BarDatum {
  label: string
  value: number
}

/**
 * กราฟแท่งแนวตั้ง แสดงยอดขายรายวัน
 * ใช้ SVG แบบ responsive (viewBox) จึงยืดตามความกว้างคอนเทนเนอร์
 */
export function BarChart({ data, height = 220 }: { data: BarDatum[]; height?: number }) {
  const width = 720
  const padding = { top: 16, right: 8, bottom: 28, left: 52 }
  const plotW = width - padding.left - padding.right
  const plotH = height - padding.top - padding.bottom

  const max = Math.max(...data.map((d) => d.value), 1)
  // ปัดเพดานแกน Y ขึ้นให้เป็นเลขกลม ๆ อ่านง่าย
  const step = Math.pow(10, Math.floor(Math.log10(max)))
  const niceMax = Math.ceil(max / step) * step
  const ticks = [0, niceMax / 2, niceMax]

  const slot = plotW / data.length
  const barW = Math.min(34, slot * 0.6)

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label="กราฟยอดขายรายวัน 14 วันล่าสุด"
    >
      {/* เส้นกริดและป้ายแกน Y */}
      {ticks.map((t) => {
        const y = padding.top + plotH - (t / niceMax) * plotH
        return (
          <g key={t}>
            <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#e2e5ea" strokeWidth={1} />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize={11} fill="#6b7385">
              {t >= 1000 ? `${num(Math.round(t / 1000))}k` : num(t)}
            </text>
          </g>
        )
      })}

      {data.map((d, i) => {
        const h = niceMax > 0 ? (d.value / niceMax) * plotH : 0
        const x = padding.left + i * slot + (slot - barW) / 2
        const y = padding.top + plotH - h
        return (
          <g key={d.label}>
            <title>{`${d.label} · ${baht(d.value)}`}</title>
            <rect
              x={x}
              y={h > 0 ? y : padding.top + plotH - 2}
              width={barW}
              height={h > 0 ? h : 2}
              rx={3}
              fill={h > 0 ? '#dd3333' : '#e2e5ea'}
            />
            {/* แสดงป้ายวันที่เว้นแท่งเพื่อไม่ให้ตัวอักษรทับกัน */}
            {i % 2 === 0 && (
              <text
                x={padding.left + i * slot + slot / 2}
                y={height - 8}
                textAnchor="middle"
                fontSize={11}
                fill="#6b7385"
              >
                {d.label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

/**
 * แถบสัดส่วนแนวนอน แสดงจำนวนออเดอร์แยกตามสถานะ
 */
export function StackedBar({ segments }: { segments: Array<{ label: string; value: number; color: string }> }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  if (total === 0) {
    return <p className="py-6 text-center text-sm text-gp-ink-soft">ยังไม่มีออเดอร์ในระบบ</p>
  }
  return (
    <div>
      <div className="flex h-4 overflow-hidden rounded-full bg-gp-surface">
        {segments
          .filter((s) => s.value > 0)
          .map((s) => (
            <div
              key={s.label}
              style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }}
              title={`${s.label} ${s.value} รายการ`}
            />
          ))}
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-gp-ink-soft">{s.label}</span>
            <span className="tnum ml-auto font-semibold text-gp-ink">{num(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
