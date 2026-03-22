'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'

type Props = {
  onClose: () => void
}

export function AuthModal({ onClose }: Props) {
  const [mode, setMode] = useState<'signin' | 'register'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAuth = async () => {
    setError('')
    setLoading(true)

    if (mode === 'register') {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setLoading(false); return }
    }

    const result = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (result?.error) { setError('Invalid email or password'); return }
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 24px', maxWidth: 380, width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{mode === 'signin' ? 'Welcome back' : 'Create account'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer', fontFamily: 'var(--font-display)' }}>×</button>
        </div>

        <button onClick={() => signIn('google', { callbackUrl: '/' })} style={{ width: '100%', padding: 11, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--text)', fontFamily: 'var(--font-display)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"/></svg>
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {mode === 'register' && (
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" style={{ width: '100%', padding: '11px 14px', fontSize: 14, borderRadius: 10 }} />
        )}
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" style={{ width: '100%', padding: '11px 14px', fontSize: 14, borderRadius: 10 }} />
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" style={{ width: '100%', padding: '11px 14px', fontSize: 14, borderRadius: 10 }} />

        {error && <div style={{ fontSize: 13, color: 'var(--red)' }}>{error}</div>}

        <button onClick={handleAuth} disabled={loading} style={{ width: '100%', padding: 12, background: 'var(--accent)', color: '#0c0c0e', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>

        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <span onClick={() => { setMode(m => m === 'signin' ? 'register' : 'signin'); setError('') }} style={{ color: 'var(--accent)', cursor: 'pointer' }}>
            {mode === 'signin' ? 'Register' : 'Sign in'}
          </span>
        </div>
      </div>
    </div>
  )
}