// ── หน้าต่างแชทลอยมุมขวาล่างของหน้าร้าน ─────────────────────────────
// บอทตอบคำถามที่พบบ่อยให้ทันที ส่วนข้อความอื่นรอแอดมินตอบจากหน้า /admin/chat
// ระบบสาธิต: ข้อความเก็บใน localStorage จึงคุยกันได้เฉพาะในเบราว์เซอร์เดียวกัน
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useChat } from '../store/AppStore'
import type { ChatMessage } from '../types'
import { ChatIcon, CloseIcon, SendIcon } from './Icons'
import { Button, Input, cx } from './ui'

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}

export function ChatWidget() {
  const {
    owner, myThread, customerUnread, faqs, setGuestName, sendCustomerMessage, markCustomerRead,
  } = useChat()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [nameDraft, setNameDraft] = useState('')
  // จำนวนข้อความที่รอบอทตอบอยู่ (ส่งรัวได้หลายข้อความ)
  const [pending, setPending] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const messages = myThread?.messages ?? []
  const activeFaqs = faqs.filter((f) => f.active)

  // เปิดหน้าต่างอยู่ ข้อความใหม่จากร้านถือว่าอ่านแล้ว
  useEffect(() => {
    if (open) markCustomerRead()
  }, [open, markCustomerRead])

  // เลื่อนลงข้อความล่าสุดทุกครั้งที่มีข้อความใหม่หรือบอทเริ่มพิมพ์
  useEffect(() => {
    const list = listRef.current
    if (open && list) list.scrollTop = list.scrollHeight
  }, [open, messages.length, pending])

  // โฟกัสช่องพิมพ์เมื่อเปิด และปิดหน้าต่างด้วย Esc
  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, owner])

  async function send(text: string) {
    if (!text.trim()) return
    setDraft('')
    setPending((n) => n + 1)
    await sendCustomerMessage(text)
    setPending((n) => n - 1)
  }

  function startAsGuest(e: React.FormEvent) {
    e.preventDefault()
    if (nameDraft.trim()) setGuestName(nameDraft)
  }

  return (
    <>
      {/* ปุ่มเปิดแชท */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={customerUnread > 0 ? `เปิดแชท มีข้อความใหม่ ${customerUnread} ข้อความ` : 'เปิดแชทกับร้าน'}
          className="fixed right-4 bottom-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gp-red text-white shadow-xl transition-colors hover:bg-gp-red-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gp-red sm:right-6 sm:bottom-6"
        >
          <ChatIcon className="h-6 w-6" />
          {customerUnread > 0 && (
            <span className="tnum absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-gp-ink px-1 text-[11px] font-bold">
              {customerUnread}
            </span>
          )}
        </button>
      )}

      {open && (
        <section
          role="dialog"
          aria-label="แชทกับร้าน Grandprix Online"
          className="fixed inset-0 z-50 flex flex-col bg-white shadow-2xl sm:inset-auto sm:right-6 sm:bottom-6 sm:h-[34rem] sm:max-h-[calc(100vh-3rem)] sm:w-96 sm:overflow-hidden sm:rounded-lg sm:border sm:border-gp-line"
        >
          <header className="flex items-center gap-3 bg-gp-ink px-4 py-3 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gp-red">
              <ChatIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">แชทกับ Grandprix Online</p>
              <p className="text-xs text-white/60">บอทตอบทันที · แอดมินตอบ จ.–ศ. 9:00–18:00</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="ปิดหน้าต่างแชท"
              className="rounded-md p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <CloseIcon />
            </button>
          </header>

          {!owner ? (
            // ผู้เยี่ยมชมต้องบอกชื่อก่อน แอดมินจะได้รู้ว่าคุยกับใคร
            <form onSubmit={startAsGuest} className="flex flex-1 flex-col justify-center gap-4 p-6">
              <div>
                <p className="text-base font-bold text-gp-ink">สวัสดีค่ะ ยินดีให้บริการ</p>
                <p className="mt-1 text-sm text-gp-ink-soft">กรุณาบอกชื่อของคุณเพื่อเริ่มแชท</p>
              </div>
              <Input
                ref={inputRef}
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="ชื่อของคุณ"
                aria-label="ชื่อของคุณ"
                maxLength={60}
              />
              <Button type="submit" disabled={!nameDraft.trim()}>เริ่มแชท</Button>
              <p className="text-center text-xs text-gp-ink-soft">
                เป็นสมาชิกอยู่แล้ว?{' '}
                <Link to="/login" onClick={() => setOpen(false)} className="font-semibold text-gp-red hover:underline">
                  เข้าสู่ระบบ
                </Link>
              </p>
            </form>
          ) : (
            <>
              <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-gp-surface px-4 py-4" aria-live="polite">
                {/* คำทักทายแสดงทุกครั้ง ไม่บันทึกลงห้องแชท */}
                <Bubble
                  message={{
                    id: 'greeting', from: 'bot', createdAt: '',
                    text: `สวัสดีค่ะ คุณ${owner.name} มีอะไรให้ช่วยไหมคะ เลือกคำถามด้านล่าง หรือพิมพ์ข้อความถึงแอดมินได้เลย`,
                  }}
                />
                {messages.map((m) => (
                  <Bubble key={m.id} message={m} />
                ))}
                {pending > 0 && (
                  <div className="flex items-center gap-1 text-xs text-gp-ink-soft" aria-label="ผู้ช่วยอัตโนมัติกำลังพิมพ์">
                    <span className="flex gap-1 rounded-lg bg-white px-3 py-2.5 shadow-sm">
                      {[0, 150, 300].map((delay) => (
                        <span
                          key={delay}
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-gp-ink-soft motion-reduce:animate-none"
                          style={{ animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </span>
                    กำลังพิมพ์…
                  </div>
                )}
              </div>

              {activeFaqs.length > 0 && (
                <div className="flex gap-2 overflow-x-auto border-t border-gp-line bg-white px-3 py-2">
                  {activeFaqs.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => send(f.question)}
                      className="shrink-0 rounded-full border border-gp-red/30 px-3 py-1 text-xs font-medium text-gp-red transition-colors hover:bg-gp-red-tint"
                    >
                      {f.question}
                    </button>
                  ))}
                </div>
              )}

              <form
                onSubmit={(e) => { e.preventDefault(); send(draft) }}
                className="flex items-center gap-2 border-t border-gp-line bg-white p-3"
              >
                <Input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="พิมพ์ข้อความ…"
                  aria-label="พิมพ์ข้อความ"
                  maxLength={1000}
                />
                <Button type="submit" aria-label="ส่งข้อความ" disabled={!draft.trim()} className="h-10.5 shrink-0 px-3.5">
                  <SendIcon className="h-4.5 w-4.5" />
                </Button>
              </form>
              <p className="bg-white px-3 pb-2 text-center text-[11px] text-gp-ink-soft">
                ระบบสาธิต - ข้อความเก็บไว้ในเบราว์เซอร์นี้เท่านั้น
              </p>
            </>
          )}
        </section>
      )}
    </>
  )
}

/** ฟองข้อความ - ลูกค้าชิดขวา ฝั่งร้าน (บอท/แอดมิน) ชิดซ้าย */
function Bubble({ message }: { message: ChatMessage }) {
  const mine = message.from === 'customer'
  return (
    <div className={cx('flex flex-col', mine ? 'items-end' : 'items-start')}>
      {!mine && (
        <span className="mb-0.5 px-1 text-[11px] font-semibold text-gp-ink-soft">
          {message.from === 'admin' ? 'แอดมิน' : 'ผู้ช่วยอัตโนมัติ'}
        </span>
      )}
      <p
        className={cx(
          'max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-line break-words',
          mine && 'rounded-br-sm bg-gp-red text-white',
          message.from === 'bot' && 'rounded-bl-sm bg-white text-gp-ink shadow-sm',
          message.from === 'admin' && 'rounded-bl-sm bg-gp-ink text-white',
        )}
      >
        {message.text}
      </p>
      {message.createdAt && (
        <span className="mt-0.5 px-1 text-[10px] text-gp-ink-soft">{timeLabel(message.createdAt)}</span>
      )}
    </div>
  )
}
