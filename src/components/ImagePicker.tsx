// ── ตัวเลือกรูปภาพ: ใส่ที่อยู่รูป หรืออัปโหลดไฟล์จากเครื่อง ────────────
// อัปโหลดแล้วแปลงเป็น base64 เก็บลง localStorage จึงต้องจำกัดขนาดไฟล์
import { useRef, useState } from 'react'
import { Button, Input } from './ui'
import { ArrowDownIcon, ArrowUpIcon, ImageIcon, TrashIcon } from './Icons'
import { Img } from './Img'

/** ขนาดไฟล์สูงสุดที่ยอมให้อัปโหลด (localStorage มีพื้นที่จำกัดราว 5 MB) */
const MAX_FILE_BYTES = 1024 * 1024

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'))
    reader.readAsDataURL(file)
  })
}

/** เลือกรูปเดียว (ใช้กับแบนเนอร์) */
export function SingleImagePicker({
  value, onChange,
}: { value: string; onChange: (next: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (file.size > MAX_FILE_BYTES) {
      setError('ไฟล์ใหญ่เกิน 1 MB - กรุณาย่อรูปก่อนอัปโหลด (พื้นที่เก็บในเบราว์เซอร์จำกัด)')
      return
    }
    setError('')
    onChange(await readFileAsDataUrl(file))
  }

  return (
    <div>
      <div className="flex gap-3">
        <div className="h-24 w-40 shrink-0 overflow-hidden rounded-md border border-gp-line bg-gp-surface">
          {value ? (
            <Img src={value} alt="ตัวอย่างแบนเนอร์" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-gp-ink-soft">
              <ImageIcon className="h-6 w-6" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <Input
            value={value.startsWith('data:') ? '' : value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={value.startsWith('data:') ? 'ใช้รูปที่อัปโหลดไว้' : 'images/banners/banner-1.svg หรือ https://...'}
            aria-label="ที่อยู่รูปภาพ"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              อัปโหลดรูปจากเครื่อง
            </Button>
            {value && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')}>
                ลบรูป
              </Button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void handleFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </div>
      </div>
      {error && <p className="mt-2 text-xs font-medium text-gp-red">{error}</p>}
    </div>
  )
}

/** เลือกได้หลายรูป พร้อมจัดลำดับ (ใช้กับสินค้า - รูปแรกคือรูปปก) */
export function MultiImagePicker({
  images, onChange,
}: { images: string[]; onChange: (next: string[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  function addUrl() {
    const trimmed = url.trim()
    if (!trimmed) return
    onChange([...images, trimmed])
    setUrl('')
    setError('')
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const accepted: string[] = []
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_BYTES) {
        setError(`ข้ามไฟล์ “${file.name}” เพราะใหญ่เกิน 1 MB`)
        continue
      }
      accepted.push(await readFileAsDataUrl(file))
    }
    if (accepted.length > 0) onChange([...images, ...accepted])
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= images.length) return
    const next = [...images]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div>
      {images.length > 0 ? (
        <ul className="mb-3 grid gap-2">
          {images.map((src, i) => (
            <li key={`${src}-${i}`} className="flex items-center gap-3 rounded-md border border-gp-line bg-white p-2">
              <Img
                src={src}
                alt={`รูปที่ ${i + 1}`}
                className="h-14 w-14 shrink-0 rounded-md border border-gp-line object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-gp-ink">
                  {src.startsWith('data:') ? 'รูปที่อัปโหลดจากเครื่อง' : src}
                </p>
                {i === 0 && (
                  <span className="mt-0.5 inline-block rounded-full bg-gp-red-tint px-2 py-0.5 text-[11px] font-bold text-gp-red-dark">
                    รูปปก
                  </span>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label={`เลื่อนรูปที่ ${i + 1} ขึ้น`}
                  className="rounded-md p-1.5 text-gp-ink-soft transition-colors hover:bg-gp-surface hover:text-gp-ink disabled:opacity-30"
                >
                  <ArrowUpIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === images.length - 1}
                  aria-label={`เลื่อนรูปที่ ${i + 1} ลง`}
                  className="rounded-md p-1.5 text-gp-ink-soft transition-colors hover:bg-gp-surface hover:text-gp-ink disabled:opacity-30"
                >
                  <ArrowDownIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(images.filter((_, index) => index !== i))}
                  aria-label={`ลบรูปที่ ${i + 1}`}
                  className="rounded-md p-1.5 text-gp-ink-soft transition-colors hover:bg-gp-red-tint hover:text-gp-red"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-3 rounded-md border border-dashed border-gp-line px-4 py-6 text-center text-sm text-gp-ink-soft">
          ยังไม่มีรูปสินค้า - เพิ่มได้มากกว่า 1 รูป รูปแรกจะถูกใช้เป็นรูปปก
        </p>
      )}

      <div className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addUrl()
            }
          }}
          placeholder="images/products/polo-1.svg หรือ https://..."
          aria-label="ที่อยู่รูปสินค้า"
        />
        <Button type="button" variant="dark" onClick={addUrl}>เพิ่ม</Button>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={() => inputRef.current?.click()}
      >
        อัปโหลดรูปจากเครื่อง (เลือกได้หลายไฟล์)
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files)
          e.target.value = ''
        }}
      />

      {error && <p className="mt-2 text-xs font-medium text-gp-red">{error}</p>}
      <p className="mt-2 text-xs text-gp-ink-soft">
        รองรับไฟล์ไม่เกิน 1 MB ต่อรูป เพราะข้อมูลถูกเก็บในเบราว์เซอร์
      </p>
    </div>
  )
}
