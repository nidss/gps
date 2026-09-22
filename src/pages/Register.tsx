// ── หน้าสมัครสมาชิก ─────────────────────────────────────────────────
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Container } from '../components/Layout'
import { Alert, Button, Card, Field, Input } from '../components/ui'
import { useAuth } from '../store/AppStore'

export function Register() {
  const navigate = useNavigate()
  const { register, isLoggedIn } = useAuth()

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirm: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')

  if (isLoggedIn) return <Navigate to="/account" replace />

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next: Record<string, string> = {}

    if (!form.firstName.trim()) next.firstName = 'กรุณากรอกชื่อ'
    if (!form.lastName.trim()) next.lastName = 'กรุณากรอกนามสกุล'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'กรุณากรอกอีเมลให้ถูกต้อง'
    if (!/^[0-9\s-]{9,}$/.test(form.phone.trim())) next.phone = 'กรุณากรอกเบอร์โทรให้ถูกต้อง'
    if (form.password.length < 8) next.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'
    if (form.password !== form.confirm) next.confirm = 'รหัสผ่านทั้งสองช่องไม่ตรงกัน'

    if (Object.keys(next).length > 0) {
      setErrors(next)
      setFormError('')
      return
    }

    const result = register({
      email: form.email,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
    })

    if (!result.ok) {
      setErrors({})
      setFormError(result.error)
      return
    }
    navigate('/account', { replace: true })
  }

  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 text-center">
          <h1 className="section-title inline-block text-2xl font-bold text-gp-ink sm:text-3xl">สมัครสมาชิก</h1>
          <p className="mt-2 text-sm text-gp-ink-soft">
            สมัครฟรี เพื่อบันทึกที่อยู่จัดส่ง ข้อมูลใบกำกับภาษี และดูประวัติคำสั่งซื้อ
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          {formError && (
            <div className="mb-5">
              <Alert>{formError}</Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
            <Field label="ชื่อ" required error={errors.firstName}>
              <Input value={form.firstName} onChange={set('firstName')} autoComplete="given-name" />
            </Field>
            <Field label="นามสกุล" required error={errors.lastName}>
              <Input value={form.lastName} onChange={set('lastName')} autoComplete="family-name" />
            </Field>

            <div className="sm:col-span-2">
              <Field label="อีเมล" required error={errors.email} hint="ใช้อีเมลนี้สำหรับเข้าสู่ระบบ">
                <Input type="email" value={form.email} onChange={set('email')} autoComplete="email" placeholder="name@example.com" />
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label="เบอร์โทรติดต่อ" required error={errors.phone}>
                <Input value={form.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel" placeholder="08X-XXX-XXXX" />
              </Field>
            </div>

            <Field label="รหัสผ่าน" required error={errors.password} hint="อย่างน้อย 8 ตัวอักษร">
              <Input type="password" value={form.password} onChange={set('password')} autoComplete="new-password" />
            </Field>
            <Field label="ยืนยันรหัสผ่าน" required error={errors.confirm}>
              <Input type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
            </Field>

            <div className="sm:col-span-2">
              <Button type="submit" size="lg" className="w-full">สมัครสมาชิก</Button>
            </div>
          </form>

          <p className="mt-6 border-t border-gp-line pt-5 text-center text-sm text-gp-ink-soft">
            มีบัญชีอยู่แล้ว?{' '}
            <Link to="/login" className="font-bold text-gp-red hover:underline">เข้าสู่ระบบ</Link>
          </p>
        </Card>

        <p className="mt-4 text-center text-xs text-gp-ink-soft">
          เว็บไซต์สาธิต: ข้อมูลสมาชิกถูกเก็บไว้ในเบราว์เซอร์ของคุณเท่านั้น ไม่ได้ส่งไปเซิร์ฟเวอร์ใด
        </p>
      </div>
    </Container>
  )
}
