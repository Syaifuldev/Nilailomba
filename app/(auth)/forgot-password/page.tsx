'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, Medal } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email) {
      setError('Email wajib diisi')
      return
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Format email tidak valid')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    if (resetError) {
      toast.error('Gagal mengirim email reset password')
    } else {
      setSent(true)
      toast.success('Email reset password telah dikirim')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-200">
            <Medal className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Lupa Password</h1>
          <p className="mt-1 text-sm text-slate-500">
            Masukkan email Anda untuk reset password
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {sent ? (
            <div className="text-center py-4">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <Mail className="h-7 w-7 text-emerald-600" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Email Terkirim!</h3>
              <p className="mt-2 text-sm text-slate-500">
                Link reset password telah dikirim ke{' '}
                <span className="font-medium text-slate-700">{email}</span>.
                Periksa inbox atau folder spam Anda.
              </p>
              <Link href="/login">
                <Button variant="outline" className="mt-5 w-full" size="md">
                  Kembali ke Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                id="forgot-email"
                type="email"
                label="Email"
                placeholder="email@lombaku.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={error}
                leftIcon={<Mail className="h-4 w-4" />}
                autoComplete="email"
                required
              />
              <Button
                type="submit"
                size="lg"
                loading={loading}
                className="w-full"
                id="forgot-password-submit"
              >
                Kirim Link Reset
              </Button>
            </form>
          )}
        </div>

        <Link
          href="/login"
          className="mt-5 flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Login
        </Link>
      </div>
    </div>
  )
}
