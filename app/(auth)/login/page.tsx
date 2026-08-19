'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Logo from '@/components/ui/Logo'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  // Check if already logged in
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace('/dashboard')
    })
  }, [router])

  const validate = () => {
    const newErrors: typeof errors = {}
    if (!email) newErrors.email = 'Email wajib diisi'
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Format email tidak valid'
    if (!password) newErrors.password = 'Password wajib diisi'
    else if (password.length < 6) newErrors.password = 'Password minimal 6 karakter'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error(
        error.message.includes('Invalid login')
          ? 'Email atau password salah'
          : error.message
      )
      setLoading(false)
      return
    }

    toast.success('Login berhasil!')
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-[var(--color-secondary)]/10 blur-[100px] pointer-events-none" />

      {/* Left side - Logo & Branding */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 relative z-10">
        <div className="text-center flex flex-col items-center w-full max-w-lg xl:max-w-xl">
          <Logo className="w-full h-auto shadow-none border-none bg-transparent" />
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 z-10">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Selamat Datang</h2>
          <p className="text-sm text-slate-500 mb-8">Silakan masuk untuk melanjutkan</p>

          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            <Input
              id="login-email"
              type="email"
              placeholder="Username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              autoComplete="email"
              required
            />

            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
              autoComplete="current-password"
              required
            />

            <div className="pt-2">
              <Button
                type="submit"
                size="lg"
                loading={loading}
                className="w-full bg-[var(--color-primary)] hover:bg-[#09357a] text-white rounded-xl py-6 font-semibold"
                id="login-submit-btn"
              >
                Masuk
              </Button>
            </div>

            <div className="flex justify-center pt-4">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-[var(--color-primary)] hover:text-[#09357a] hover:underline"
              >
                Lupa Password?
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
