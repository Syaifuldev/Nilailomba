'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Medal, Lock, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-100/50 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-100/50 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-200">
            <Medal className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Sistem Penilaian</h1>
          <p className="mt-1 text-sm text-slate-500">Lomba Wudu & Salat</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-slate-900">Masuk</h2>

          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <Input
              id="login-email"
              type="email"
              label="Email"
              placeholder="admin@lombaku.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              leftIcon={<Mail className="h-4 w-4" />}
              autoComplete="email"
              required
            />

            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="Masukkan password"
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

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
              >
                Lupa password?
              </Link>
            </div>

            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="w-full"
              id="login-submit-btn"
            >
              Masuk
            </Button>
          </form>
        </div>



        <p className="mt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Sistem Penilaian Lomba - Design by Syaiful Dev
        </p>
      </div>
    </div>
  )
}
