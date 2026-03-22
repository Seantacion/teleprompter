'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { AvatarCircle } from '@/components/ui/AvatarCircle'

const PRESET_AVATARS = ['🐻', '🦊', '🐼', '🦁', '🐯', '🐨', '🦉', '🐸', '🐙', '🦋', '🌊', '🔥']
const PRESET_COLORS = ['#d4f564', '#e0e0e0', '#a78bfa', '#60a5fa', '#f87171', '#34d399']

type Props = {
  onClose: () => void
  streak: number
  longestStreak: number
  userAvatar: string
  userColor: string
  onSaved: (avatar: string, color: string) => void
}

export function ProfileModal({ onClose, streak, longestStreak, userAvatar, userColor, onSaved }: Props) {
  const { data: session, update } = useSession()
  const [profileName, setProfileName] = useState(session?.user?.name ?? '')
  const [profileAvatar, setProfileAvatar] = useState(userAvatar)
  const [profileColor, setProfileColor] = useState(userColor)
  const [profilePassword, setProfilePassword] = useState('')
  const [profileNewPassword, setProfileNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const save = async () => {
    setSaving(true)
    setError('')
    setSuccess(false)

    const res = await fetch('/api/auth/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: profileName,
        password: profilePassword,
        newPassword: profileNewPassword,
        image: profileAvatar || undefined,
      }),
    })

    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error); return }

    localStorage.setItem(`avatar:${session?.user?.id}`, profileAvatar)
    localStorage.setItem(`color:${session?.user?.id}`, profileColor)
    onSaved(profileAvatar, profileColor)
    await update({ image: profileAvatar || undefined, name: profileName })
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2000)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 24px', maxWidth: 380, width: '100%', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '90svh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Edit Profile</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <AvatarCircle userAvatar={profileAvatar} userColor={profileColor} name={session?.user?.name} image={session?.user?.image} size={56} />
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            <div style={{ fontWeight: 600, color: 'var(--text)' }}>{session?.user?.name}</div>
            <div>{session?.user?.email}</div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: 8 }}>PICK AVATAR</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PRESET_AVATARS.map(a => (
              <button key={a} onClick={() => setProfileAvatar(a)} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid ' + (profileAvatar === a ? 'var(--accent)' : 'var(--border)'), background: profileAvatar === a ? 'var(--accent-dim)' : 'var(--surface2)', fontSize: 20, cursor: 'pointer' }}>
                {a}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: 8 }}>AVATAR COLOR</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {PRESET_COLORS.map(c => (
              <div key={c} onClick={() => setProfileColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: profileColor === c ? '2px solid var(--text)' : '2px solid transparent' }} />
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: 8 }}>OR UPLOAD PHOTO</div>
          <input type="file" accept="image/*" onChange={async e => {
            const file = e.target.files?.[0]
            if (!file) return
            const img = new Image()
            const url = URL.createObjectURL(file)
            img.onload = () => {
              const canvas = document.createElement('canvas')
              const MAX = 100
              const ratio = Math.min(MAX / img.width, MAX / img.height)
              canvas.width = img.width * ratio
              canvas.height = img.height * ratio
              canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
              setProfileAvatar(canvas.toDataURL('image/jpeg', 0.7))
              URL.revokeObjectURL(url)
            }
            img.src = url
          }} style={{ width: '100%', fontSize: 13, color: 'var(--text-muted)' }} />
        </div>

        <div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: 8 }}>DISPLAY NAME</div>
          <input value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="Your name" style={{ width: '100%', padding: '11px 14px', fontSize: 14, borderRadius: 10 }} />
        </div>

        {!session?.user?.image?.includes('google') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>CHANGE PASSWORD</div>
            <input value={profilePassword} onChange={e => setProfilePassword(e.target.value)} placeholder="Current password" type="password" style={{ width: '100%', padding: '11px 14px', fontSize: 14, borderRadius: 10 }} />
            <input value={profileNewPassword} onChange={e => setProfileNewPassword(e.target.value)} placeholder="New password" type="password" style={{ width: '100%', padding: '11px 14px', fontSize: 14, borderRadius: 10 }} />
          </div>
        )}

        {error && <div style={{ fontSize: 13, color: 'var(--red)' }}>{error}</div>}
        {success && <div style={{ fontSize: 13, color: 'var(--accent)' }}>Saved!</div>}

        <div style={{ display: 'flex', gap: 12, padding: '12px 0', borderTop: '1px solid var(--border)' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>🔥 {streak}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>Current streak</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-muted)' }}>⭐ {longestStreak}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>Longest streak</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => signOut()} style={{ padding: '11px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', cursor: 'pointer' }}>
            Sign out
          </button>
          <button onClick={save} disabled={saving} style={{ flex: 1, padding: 11, background: 'var(--accent)', color: '#0c0c0e', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}