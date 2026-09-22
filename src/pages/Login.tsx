// ── หน้าเข้าสู่ระบบสมาชิก ───────────────────────────────────────────
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Container } from '../components/Layout'
import { Alert, Button, Card, Field, Input } from '../components/ui'
import { useAuth } from '../store/AppStore'

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoggedIn } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  // กลับไปหน้าเดิมที่พามาที่นี่ ถ้าไม่มีให้ไปหน้าข้อมูลส่วนตัว
  const from = (location.state as { from?: string } | null)?.from ?? '/account'

  if (isLoggedIn) return <Navigate to={from} replace />

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = login(email, password)
    if (!result.ok) {
      setError(result.error)
      return
    }
    navigate(from, { replace: true })
  }

  return (
    <Container className="py-10 sm:py-16">
      <div className="mx-auto max-w-md">
        <h1 className="section-title mb-6 text-2xl font-bold text-gp-ink sm:text-3xl">เข้าสู่ระบบ</h1>

        <Card className="p-6 sm:p-8">
          {error && (
            <div className="mb-5">
              <Alert>{error}</Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="grid gap-4">
            <Field label="อีเมล" required>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="name@example.com"
              />
            </Field>
            <Field label="รหัสผ่าน" required>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </Field>
            <Button type="submit" size="lg" className="mt-1 w-full">เข้าสู่ระบบ</Button>
          </form>

          <div className="mt-6 rounded-md border border-dashed border-gp-line bg-gp-surface p-4">
            <p className="text-xs font-bold text-gp-ink">บัญชีสำหรับทดลองใช้งาน</p>
            <p className="tnum mt-1.5 text-xs text-gp-ink-soft">
              อีเมล <span className="font-semibold text-gp-ink">demo@grandprix.test</span>
              <br />
              รหัสผ่าน <span className="font-semibold text-gp-ink">demo1234</span>
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={() => {
                setEmail('demo@grandprix.test')
                setPassword('demo1234')
              }}
            >
              กรอกบัญชีทดลองให้อัตโนมัติ
            </Button>
          </div>

          <p className="mt-6 border-t border-gp-line pt-5 text-center text-sm text-gp-ink-soft">
            ยังไม่มีบัญชี?{' '}
            <Link to="/register" className="font-bold text-gp-red hover:underline">สมัครสมาชิก</Link>
          </p>
        </Card>
      </div>
    </Container>
  )
}
