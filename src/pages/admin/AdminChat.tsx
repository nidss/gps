// ── แชทลูกค้า: ตอบข้อความ และตั้งค่าคำตอบอัตโนมัติของบอท ────────────────
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AdminPageHeader } from '../../components/AdminLayout'
import {
  Badge, Button, Card, Checkbox, Field, Input, Modal, ReorderButtons, Textarea, cx,
} from '../../components/ui'
import { ChevronLeftIcon, EditIcon, PlusIcon, SendIcon, TrashIcon } from '../../components/Icons'
import { useChat } from '../../store/AppStore'
import type { ChatFaq, ChatThread } from '../../types'
import { num, thaiDateTime } from '../../lib/format'
import { uid } from '../../lib/id'
import { nextSortOrder } from '../../lib/sortOrder'
import { BOT_FALLBACK, matchFaq } from '../../lib/chatBot'

type Tab = 'threads' | 'faqs'

export function AdminChat() {
  const [params, setParams] = useSearchParams()
  const tab: Tab = params.get('tab') === 'faqs' ? 'faqs' : 'threads'
  const { threads, adminUnreadCount, faqs } = useChat()

  return (
    <>
      <AdminPageHeader
        title="แชทลูกค้า"
        description="ตอบข้อความจากหน้าร้าน และตั้งคำตอบอัตโนมัติให้บอทตอบคำถามที่พบบ่อย — ระบบสาธิต ข้อความอยู่ในเบราว์เซอร์นี้เท่านั้น"
      />

      <div className="mb-4 inline-flex rounded-md border border-gp-line bg-white p-1" role="tablist">
        {([
          { key: 'threads', label: `ข้อความลูกค้า (${num(threads.length)})`, badge: adminUnreadCount },
          { key: 'faqs', label: `คำตอบอัตโนมัติ (${num(faqs.length)})`, badge: 0 },
        ] as const).map(({ key, label, badge }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setParams(key === 'faqs' ? { tab: 'faqs' } : {}, { replace: true })}
            className={cx(
              'flex items-center gap-2 rounded px-3.5 py-2 text-sm font-semibold transition-colors',
              tab === key ? 'bg-gp-ink text-white' : 'text-gp-ink-soft hover:bg-gp-surface hover:text-gp-ink',
            )}
          >
            {label}
            {badge > 0 && <span className="tnum rounded-full bg-gp-red px-1.5 text-xs text-white">{badge}</span>}
          </button>
        ))}
      </div>

      {tab === 'threads' ? <ThreadsPanel /> : <FaqPanel />}
    </>
  )
}

// ── ข้อความลูกค้า ───────────────────────────────────────────────────

function ThreadsPanel() {
  const { threads, isUnreadByAdmin, markAdminRead, sendAdminMessage, deleteThread } = useChat()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  const selected = threads.find((t) => t.id === selectedId) ?? null
  const messageCount = selected?.messages.length ?? 0

  // เปิดห้องอยู่ ข้อความลูกค้าที่เข้ามาใหม่ถือว่าอ่านแล้ว และเลื่อนลงล่างสุด
  useEffect(() => {
    if (!selectedId) return
    markAdminRead(selectedId)
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [selectedId, messageCount, markAdminRead])

  function reply(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !draft.trim()) return
    sendAdminMessage(selected.id, draft)
    setDraft('')
  }

  if (threads.length === 0) {
    return (
      <Card className="px-5 py-12 text-center text-sm text-gp-ink-soft">
        ยังไม่มีข้อความจากลูกค้า — ลองเปิดหน้าร้านแล้วกดปุ่มแชทมุมขวาล่าง
      </Card>
    )
  }

  return (
    <Card className="grid h-[calc(100vh-16rem)] min-h-[30rem] overflow-hidden lg:grid-cols-[20rem_1fr]">
      {/* รายการห้อง — มือถือแสดงเฉพาะตอนยังไม่ได้เลือกห้อง */}
      <ul className={cx('min-h-0 divide-y divide-gp-line overflow-y-auto border-gp-line lg:block lg:border-r', selected && 'hidden')}>
        {threads.map((t) => {
          const unread = isUnreadByAdmin(t)
          const last = t.messages[t.messages.length - 1]
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setSelectedId(t.id)}
                className={cx(
                  'flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-gp-surface',
                  t.id === selectedId && 'bg-gp-red-tint hover:bg-gp-red-tint',
                )}
              >
                <span className="flex items-center gap-2">
                  {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-gp-red" aria-label="ยังไม่ได้อ่าน" />}
                  <span className={cx('min-w-0 flex-1 truncate text-sm text-gp-ink', unread ? 'font-bold' : 'font-semibold')}>
                    {t.name}
                  </span>
                  <Badge tone={t.userId ? 'blue' : 'slate'}>{t.userId ? 'สมาชิก' : 'ผู้เยี่ยมชม'}</Badge>
                </span>
                {last && (
                  <span className="line-clamp-1 text-xs text-gp-ink-soft">
                    {last.from === 'admin' ? 'คุณ: ' : last.from === 'bot' ? 'บอท: ' : ''}
                    {last.text}
                  </span>
                )}
                <span className="text-[11px] text-gp-ink-soft">{thaiDateTime(t.updatedAt)}</span>
              </button>
            </li>
          )
        })}
      </ul>

      {/* ห้องที่เลือก */}
      {selected ? (
        <ThreadView
          thread={selected}
          listRef={listRef}
          draft={draft}
          onDraft={setDraft}
          onReply={reply}
          onBack={() => setSelectedId(null)}
          onDelete={() => {
            if (window.confirm(`ลบบทสนทนากับ “${selected.name}” ใช่หรือไม่?`)) {
              deleteThread(selected.id)
              setSelectedId(null)
            }
          }}
        />
      ) : (
        <div className="hidden items-center justify-center bg-gp-surface text-sm text-gp-ink-soft lg:flex">
          เลือกบทสนทนาทางซ้ายเพื่ออ่านและตอบกลับ
        </div>
      )}
    </Card>
  )
}

function ThreadView({
  thread, listRef, draft, onDraft, onReply, onBack, onDelete,
}: {
  thread: ChatThread
  listRef: React.RefObject<HTMLDivElement | null>
  draft: string
  onDraft: (value: string) => void
  onReply: (e: React.FormEvent) => void
  onBack: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-gp-line px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="กลับไปรายการบทสนทนา"
          className="rounded-md p-1.5 text-gp-ink-soft hover:bg-gp-surface hover:text-gp-ink lg:hidden"
        >
          <ChevronLeftIcon />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-gp-ink">{thread.name}</p>
          <p className="text-xs text-gp-ink-soft">
            {thread.userId ? 'สมาชิก' : 'ผู้เยี่ยมชม (ไม่ได้ล็อกอิน)'} · {num(thread.messages.length)} ข้อความ
          </p>
        </div>
        <button
          type="button"
          onClick={onDelete}
          aria-label="ลบบทสนทนา"
          className="rounded-md p-2 text-gp-ink-soft transition-colors hover:bg-gp-red-tint hover:text-gp-red"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-gp-surface p-4">
        {thread.messages.map((m) => {
          const mine = m.from !== 'customer'
          return (
            <div key={m.id} className={cx('flex flex-col', mine ? 'items-end' : 'items-start')}>
              <span className="mb-0.5 px-1 text-[11px] font-semibold text-gp-ink-soft">
                {m.from === 'customer' ? thread.name : m.from === 'bot' ? 'ผู้ช่วยอัตโนมัติ' : 'แอดมิน'}
              </span>
              <p
                className={cx(
                  'max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-line break-words',
                  m.from === 'customer' && 'rounded-bl-sm bg-white text-gp-ink shadow-sm',
                  m.from === 'admin' && 'rounded-br-sm bg-gp-red text-white',
                  m.from === 'bot' && 'rounded-br-sm border border-dashed border-gp-ink-soft/40 bg-white/60 text-gp-ink-soft',
                )}
              >
                {m.text}
              </p>
              <span className="mt-0.5 px-1 text-[10px] text-gp-ink-soft">{thaiDateTime(m.createdAt)}</span>
            </div>
          )
        })}
      </div>

      <form onSubmit={onReply} className="flex items-end gap-2 border-t border-gp-line p-3">
        <Textarea
          value={draft}
          onChange={(e) => onDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter ส่ง, Shift+Enter ขึ้นบรรทัดใหม่
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              e.currentTarget.form?.requestSubmit()
            }
          }}
          placeholder={`ตอบกลับ ${thread.name}… (Shift+Enter ขึ้นบรรทัดใหม่)`}
          aria-label="ข้อความตอบกลับ"
          rows={2}
          // ทับความสูงขั้นต่ำของ Textarea พื้นฐาน ช่องตอบแชทไม่ต้องสูงเท่าช่องรายละเอียดสินค้า
          className="min-h-0! resize-none"
        />
        <Button type="submit" disabled={!draft.trim()} className="shrink-0">
          <SendIcon className="h-4 w-4" />
          ส่ง
        </Button>
      </form>
    </div>
  )
}

// ── คำตอบอัตโนมัติ ──────────────────────────────────────────────────

/** ฟอร์มเก็บคำค้นเป็นข้อความเดียวคั่นด้วยจุลภาค แล้วค่อยแยกตอนบันทึก */
type FaqDraft = Omit<ChatFaq, 'keywords'> & { keywordsText: string }

function FaqPanel() {
  const { faqs, saveFaq, deleteFaq, moveFaq } = useChat()
  const [editing, setEditing] = useState<FaqDraft | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [probe, setProbe] = useState('')

  const isNew = editing !== null && !faqs.some((f) => f.id === editing.id)
  const probeMatch = probe.trim() ? matchFaq(probe, faqs) : null

  function openEdit(faq: ChatFaq) {
    setErrors({})
    setEditing({ ...faq, keywordsText: faq.keywords.join(', ') })
  }

  function openNew() {
    setErrors({})
    setEditing({
      id: uid('f'), question: '', keywordsText: '', answer: '', sortOrder: nextSortOrder(faqs), active: true,
    })
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    const next: Record<string, string> = {}
    if (!editing.question.trim()) next.question = 'กรุณากรอกคำถาม'
    if (!editing.answer.trim()) next.answer = 'กรุณากรอกคำตอบ'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    const { keywordsText, ...rest } = editing
    saveFaq({
      ...rest,
      question: editing.question.trim(),
      answer: editing.answer.trim(),
      keywords: Array.from(new Set(keywordsText.split(/[,，\n]/).map((k) => k.trim()).filter(Boolean))),
    })
    setEditing(null)
  }

  return (
    <>
      <div className="mb-4 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        {/* ทดสอบว่าข้อความแบบนี้บอทจะตอบด้วยข้อไหน */}
        <Card className="p-4">
          <Field label="ทดสอบบอท" hint="พิมพ์ข้อความแบบที่ลูกค้าจะพิมพ์ เพื่อดูว่าบอทจะตอบด้วยคำตอบข้อไหน">
            <Input value={probe} onChange={(e) => setProbe(e.target.value)} placeholder="เช่น ส่งของกี่วันถึง" />
          </Field>
          {probe.trim() && (
            <p className="mt-2 text-sm text-gp-ink">
              {probeMatch ? (
                <>บอทตอบด้วย: <span className="font-semibold">“{probeMatch.question}”</span></>
              ) : (
                <span className="text-gp-ink-soft">ไม่ตรงข้อไหน — บอทจะตอบว่า “{BOT_FALLBACK}” แล้วรอแอดมินตอบ</span>
              )}
            </p>
          )}
        </Card>
        <Button onClick={openNew} className="justify-self-start">
          <PlusIcon className="h-4 w-4" />
          เพิ่มคำตอบอัตโนมัติ
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem] text-sm">
            <thead>
              <tr className="border-b border-gp-line bg-gp-surface text-left text-xs text-gp-ink-soft">
                <th className="px-4 py-3 font-semibold">ลำดับ</th>
                <th className="px-4 py-3 font-semibold">คำถาม / คำค้น</th>
                <th className="px-4 py-3 font-semibold">คำตอบ</th>
                <th className="px-4 py-3 font-semibold">สถานะ</th>
                <th className="px-4 py-3 text-right font-semibold">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gp-line">
              {faqs.map((faq, index) => (
                <tr key={faq.id} className={cx(!faq.active && 'opacity-60', probeMatch?.id === faq.id && 'bg-gp-red-tint')}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="tnum w-6 text-center font-bold text-gp-ink">{index + 1}</span>
                      <ReorderButtons
                        label={faq.question}
                        onMove={(direction) => moveFaq(faq.id, direction)}
                        isFirst={index === 0}
                        isLast={index === faqs.length - 1}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gp-ink">{faq.question}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {faq.keywords.map((k) => (
                        <Badge key={k} tone="slate">{k}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="max-w-sm px-4 py-3 text-xs text-gp-ink-soft">
                    <p className="line-clamp-3">{faq.answer}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Badge tone={faq.active ? 'green' : 'slate'}>{faq.active ? 'ใช้งาน' : 'ปิดอยู่'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(faq)}
                        aria-label={`แก้ไข ${faq.question}`}
                        className="rounded-md p-2 text-gp-ink-soft transition-colors hover:bg-gp-surface hover:text-gp-ink"
                      >
                        <EditIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`ลบคำตอบ “${faq.question}” ใช่หรือไม่?`)) deleteFaq(faq.id)
                        }}
                        aria-label={`ลบ ${faq.question}`}
                        className="rounded-md p-2 text-gp-ink-soft transition-colors hover:bg-gp-red-tint hover:text-gp-red"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {faqs.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-gp-ink-soft">
            ยังไม่มีคำตอบอัตโนมัติ — บอทจะตอบทุกข้อความว่าแอดมินจะติดต่อกลับ
          </p>
        )}
      </Card>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={isNew ? 'เพิ่มคำตอบอัตโนมัติ' : 'แก้ไขคำตอบอัตโนมัติ'}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>ยกเลิก</Button>
            <Button type="submit" form="faq-form">บันทึก</Button>
          </>
        }
      >
        {editing && (
          <form id="faq-form" onSubmit={handleSave} noValidate className="grid gap-4">
            <Field label="คำถาม" required error={errors.question} hint="แสดงเป็นปุ่มคำถามด่วนในหน้าต่างแชท">
              <Input
                value={editing.question}
                onChange={(e) => setEditing({ ...editing, question: e.target.value })}
                placeholder="เช่น ค่าจัดส่งเท่าไหร่?"
              />
            </Field>
            <Field label="คำค้น" hint="คั่นด้วยจุลภาค — ถ้าข้อความลูกค้ามีคำใดคำหนึ่ง บอทจะตอบด้วยข้อนี้ (ข้อที่อยู่ลำดับบนกว่าได้ก่อน)">
              <Input
                value={editing.keywordsText}
                onChange={(e) => setEditing({ ...editing, keywordsText: e.target.value })}
                placeholder="ค่าส่ง, ส่งฟรี, shipping"
              />
            </Field>
            <Field label="คำตอบ" required error={errors.answer}>
              <Textarea
                value={editing.answer}
                onChange={(e) => setEditing({ ...editing, answer: e.target.value })}
              />
            </Field>
            <Checkbox
              checked={editing.active}
              onChange={(active) => setEditing({ ...editing, active })}
              label="ใช้งานคำตอบนี้"
              description="ถ้าปิด บอทจะไม่ใช้ข้อนี้ตอบ และไม่แสดงเป็นปุ่มคำถามด่วน"
            />
          </form>
        )}
      </Modal>
    </>
  )
}
