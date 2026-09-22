// ── ชิ้นส่วน UI พื้นฐานที่ใช้ซ้ำทั้งเว็บ ──────────────────────────────
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { Link } from 'react-router-dom'
import { CloseIcon } from './Icons'
import { useLockBodyScroll } from '../store/AppStore'

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

type Variant = 'primary' | 'dark' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const variantClass: Record<Variant, string> = {
  primary: 'bg-gp-red text-white hover:bg-gp-red-dark focus-visible:outline-gp-red',
  dark: 'bg-gp-ink text-white hover:bg-gp-ink-dark focus-visible:outline-gp-ink',
  outline: 'border-2 border-gp-ink/20 text-gp-ink bg-white hover:border-gp-red hover:text-gp-red focus-visible:outline-gp-ink',
  ghost: 'text-gp-ink hover:bg-gp-ink/5 focus-visible:outline-gp-ink',
  danger: 'bg-white text-gp-red border-2 border-gp-red/30 hover:bg-gp-red hover:text-white focus-visible:outline-gp-red',
}

const sizeClass: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-5 py-2.5 text-sm gap-2',
  lg: 'px-7 py-3.5 text-base gap-2.5',
}

const buttonBase =
  'inline-flex items-center justify-center rounded-md font-semibold transition-colors ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

export function Button({
  variant = 'primary', size = 'md', className, ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button className={cx(buttonBase, variantClass[variant], sizeClass[size], className)} {...props} />
}

export function ButtonLink({
  to, variant = 'primary', size = 'md', className, children,
}: { to: string; variant?: Variant; size?: Size; className?: string; children: ReactNode }) {
  return (
    <Link to={to} className={cx(buttonBase, variantClass[variant], sizeClass[size], className)}>
      {children}
    </Link>
  )
}

const fieldBase =
  'w-full rounded-md border border-gp-line bg-white px-3.5 py-2.5 text-sm text-gp-ink ' +
  'placeholder:text-gp-ink-soft/60 transition-colors focus:border-gp-red focus:outline-none ' +
  'focus:ring-2 focus:ring-gp-red/20 disabled:bg-gp-surface disabled:text-gp-ink-soft'

export function Field({
  label, hint, error, required, children,
}: { label: string; hint?: string; error?: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-gp-ink">
        {label}
        {required && <span className="ml-1 text-gp-red">*</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-gp-ink-soft">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-gp-red">{error}</span>}
    </label>
  )
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(fieldBase, className)} {...props} />
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(fieldBase, 'min-h-28 resize-y', className)} {...props} />
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(fieldBase, 'cursor-pointer', className)} {...props}>
      {children}
    </select>
  )
}

export function Checkbox({
  checked, onChange, label, description,
}: { checked: boolean; onChange: (checked: boolean) => void; label: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-gp-red"
      />
      <span>
        <span className="block text-sm font-semibold text-gp-ink">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-gp-ink-soft">{description}</span>}
      </span>
    </label>
  )
}

type Tone = 'red' | 'ink' | 'green' | 'amber' | 'slate' | 'blue'

const toneClass: Record<Tone, string> = {
  red: 'bg-gp-red-tint text-gp-red-dark',
  ink: 'bg-gp-ink/10 text-gp-ink',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  slate: 'bg-slate-100 text-slate-600',
  blue: 'bg-sky-50 text-sky-700',
}

export function Badge({ tone = 'ink', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', toneClass[tone], className)}>
      {children}
    </span>
  )
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('rounded-lg border border-gp-line bg-white', className)}>{children}</div>
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <h2 className="section-title text-xl font-bold text-gp-ink sm:text-2xl">{title}</h2>
      {action}
    </div>
  )
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gp-line bg-white px-6 py-16 text-center">
      <p className="text-base font-semibold text-gp-ink">{title}</p>
      {description && <p className="mt-1.5 max-w-md text-sm text-gp-ink-soft">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function Alert({ tone = 'red', children }: { tone?: 'red' | 'green' | 'amber'; children: ReactNode }) {
  const map = {
    red: 'border-gp-red/30 bg-gp-red-tint text-gp-red-dark',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
  }
  return <div className={cx('rounded-md border px-4 py-3 text-sm font-medium', map[tone])}>{children}</div>
}

export function Modal({
  open, onClose, title, children, footer, wide,
}: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useLockBodyScroll(open)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-gp-ink-dark/60 p-4 sm:p-8">
      <div
        className={cx(
          'my-auto w-full rounded-lg bg-white shadow-2xl',
          wide ? 'max-w-4xl' : 'max-w-xl',
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between border-b border-gp-line px-6 py-4">
          <h3 className="text-lg font-bold text-gp-ink">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="rounded-md p-1.5 text-gp-ink-soft transition-colors hover:bg-gp-surface hover:text-gp-ink"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-3 border-t border-gp-line px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}

/** ตัวเลือกจำนวนสินค้า พร้อมปุ่มเพิ่ม/ลด */
export function QtyPicker({
  value, onChange, max = 99, size = 'md',
}: { value: number; onChange: (qty: number) => void; max?: number; size?: 'sm' | 'md' }) {
  const btn =
    size === 'sm'
      ? 'h-8 w-8 text-gp-ink-soft'
      : 'h-10 w-10 text-gp-ink-soft'
  return (
    <div className="inline-flex items-center rounded-md border border-gp-line bg-white">
      <button
        type="button"
        aria-label="ลดจำนวน"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        className={cx(btn, 'flex items-center justify-center rounded-l-md transition-colors hover:bg-gp-surface hover:text-gp-ink disabled:opacity-40')}
      >
        −
      </button>
      <input
        type="number"
        value={value}
        min={1}
        max={max}
        aria-label="จำนวน"
        onChange={(e) => {
          const n = Number(e.target.value)
          if (Number.isFinite(n)) onChange(Math.min(max, Math.max(1, Math.trunc(n))))
        }}
        className={cx(
          'tnum border-x border-gp-line text-center text-sm font-semibold text-gp-ink focus:outline-none',
          size === 'sm' ? 'h-8 w-12' : 'h-10 w-14',
        )}
      />
      <button
        type="button"
        aria-label="เพิ่มจำนวน"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={cx(btn, 'flex items-center justify-center rounded-r-md transition-colors hover:bg-gp-surface hover:text-gp-ink disabled:opacity-40')}
      >
        +
      </button>
    </div>
  )
}
