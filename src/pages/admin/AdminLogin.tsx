// ── หน้าเข้าสู่ระบบหลังบ้าน ─────────────────────────────────────────
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ADMIN_PASSWORD, ADMIN_USERNAME, useAuth } from '../../store/AppStore'
import { Alert, Button, Field, Input } from '../../components/ui'
import { asset } from '../../lib/asset'

export function AdminLogin() {
  const navigate = useNavigate()
  const { adminLogin, adminLoggedIn } = useAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (adminLoggedIn) return <Navigate to="/admin" replace />

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = adminLogin(username, password)
    if (!result.ok) {
      setError(result.error)
      return
    }
    navigate('/admin', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col bg-gp-ink">
      <div className="speed-lines flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <img src={asset('logo-grandprix.png')} alt="Grandprix Online" className="mx-auto h-11 w-auto" />
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-gp-red-light">
              ระบบหลังบ้าน
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-2xl sm:p-8">
            <h1 className="mb-5 text-lg font-bold text-gp-ink">เข้าสู่ระบบผู้ดูแล</h1>

            {error && (
              <div className="mb-4">
                <Alert>{error}</Alert>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="grid gap-4">
              <Field label="ชื่อผู้ใช้" required>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
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

            <div className="mt-5 rounded-md border border-dashed border-gp-line bg-gp-surface p-4">
              <p className="text-xs font-bold text-gp-ink">บัญชีสำหรับสาธิต</p>
              <p className="tnum mt-1.5 text-xs text-gp-ink-soft">
                ชื่อผู้ใช้ <span className="font-semibold text-gp-ink">{ADMIN_USERNAME}</span>
                <br />
                รหัสผ่าน <span className="font-semibold text-gp-ink">{ADMIN_PASSWORD}</span>
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={() => {
                  setUsername(ADMIN_USERNAME)
                  setPassword(ADMIN_PASSWORD)
                }}
              >
                กรอกบัญชีสาธิตให้อัตโนมัติ
              </Button>
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-white/50">
            <Link to="/" className="hover:text-white">← กลับไปหน้าร้าน</Link>
          </p>
          <p className="mt-2 text-center text-[11px] leading-relaxed text-white/35">
            เว็บไซต์สาธิตแบบ static — การตรวจสิทธิ์ทำฝั่งเบราว์เซอร์เท่านั้น
            <br />
            ไม่ควรใช้รูปแบบนี้กับข้อมูลจริง
          </p>
        </div>
      </div>
    </div>
  )
}
