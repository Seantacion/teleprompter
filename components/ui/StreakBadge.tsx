type Props = { streak: number }

export function StreakBadge({ streak }: Props) {
  if (streak === 0) return null
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 999, padding: '3px 10px' }}>
      <span style={{ fontSize: 13 }}>🔥</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{streak}</span>
    </div>
  )
}