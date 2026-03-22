'use client'

type Props = {
  prevStreak: number
  onClose: () => void
}

export function StreakLostModal({ prevStreak, onClose }: Props) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 24px', maxWidth: 360, width: '100%', display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 40 }}>😔</div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Streak lost</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Your {prevStreak}-day streak ended. Don't worry — start fresh today and build it back up!
          </div>
        </div>
        <button onClick={onClose} style={{ padding: '12px', background: 'var(--accent)', color: '#0c0c0e', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', cursor: 'pointer' }}>
          Let's go 💪
        </button>
      </div>
    </div>
  )
}