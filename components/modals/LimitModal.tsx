'use client'

type Props = {
  session: any
  onClose: () => void
  onSignIn: () => void
}

export function LimitModal({ session, onClose, onSignIn }: Props) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 24px', maxWidth: 360, width: '100%', display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 36 }}>⚡</div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Daily limit reached</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {session
              ? "You've used all 25 generations for today. Come back tomorrow or browse History for existing scripts."
              : "You've used all 5 free generations for today. Sign in to get 25/day, browse scripts in History, or write your own in the script box."}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {!session && (
            <button onClick={onSignIn} style={{ width: '100%', padding: '12px', background: 'var(--accent)', color: '#0c0c0e', borderRadius: 10, fontSize: 14, fontWeight: 700, border: 'none', fontFamily: 'var(--font-display)', cursor: 'pointer' }}>
              Sign in / Register
            </button>
          )}
          <button onClick={onClose} style={{ padding: '11px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', cursor: 'pointer' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}