"use client"
import { useState, useEffect } from "react"

type Support = { id: string; name: string; message: string; createdAt: string }

export function SupportWall() {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [supports, setSupports] = useState<Support[]>([])
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle")

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    if (open && supports.length === 0) fetchSupports()
  }, [open])

  if (!mounted) return null

  async function fetchSupports() {
    const res = await fetch("/api/support")
    const data = await res.json()
    setSupports(data)
  }

  async function handleSubmit() {
    if (!message.trim()) return
    setStatus("loading")
    await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, message }),
    })
    setName("")
    setMessage("")
    setStatus("done")
    fetchSupports()
    setTimeout(() => setStatus("idle"), 2500)
  }

  return (
    <div style={{ position: "fixed", bottom: 24, right: 20, zIndex: 999, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, fontFamily: "var(--font-display)" }}>

      {/* Panel */}
      {open && (
        <div style={{
          width: 300,
          background: "#111113",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 24px 48px rgba(0,0,0,0.6)",
        }}>
          {/* header */}
          <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: 0 }}>wall of support</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "2px 0 0" }}>kasih kalimat terbaikmu</p>
          </div>

          {/* list */}
          <div style={{ maxHeight: 180, overflowY: "auto", padding: "10px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
            {supports.length === 0 && (
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", textAlign: "center", padding: "12px 0", margin: 0 }}>belum ada yang support. jadilah yang pertama!</p>
            )}
            {supports.map(s => (
              <div key={s.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.5)",
                  flexShrink: 0,
                }}>
                  {s.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)", margin: 0 }}>{s.name}</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "2px 0 0", lineHeight: 1.5 }}>{s.message}</p>
                </div>
              </div>
            ))}
          </div>

          {/* form */}
          <div style={{ padding: "10px 16px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="nama lo"
              maxLength={32}
              style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8, padding: "8px 10px", fontSize: 12, color: "#fff",
                outline: "none", width: "100%", boxSizing: "border-box",
                fontFamily: "var(--font-display)",
              }}
            />
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="tinggalin pesan..."
              maxLength={120}
              rows={2}
              style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8, padding: "8px 10px", fontSize: 12, color: "#fff",
                outline: "none", width: "100%", boxSizing: "border-box",
                resize: "none", fontFamily: "var(--font-display)", lineHeight: 1.5,
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={status === "loading" || !message.trim()}
              style={{
                background: status === "done" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 600,
                color: status === "done" ? "rgba(255,255,255,0.5)" : "#fff",
                cursor: status === "loading" || !message.trim() ? "not-allowed" : "pointer",
                opacity: !message.trim() ? 0.4 : 1,
                fontFamily: "var(--font-display)", transition: "all 0.15s",
              }}
            >
              {status === "done" ? "makasih udah support ✦" : "kirim"}
            </button>
          </div>

          {/* saweria */}
          <div style={{ padding: "8px 16px 12px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>mau support lebih?</span>
            <a href="https://saweria.co/nathing" target="_blank" style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textDecoration: "none", fontWeight: 600 }}>
              saweria ↗
            </a>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#111113", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 999, padding: "10px 16px",
          fontSize: 12, fontWeight: 600, color: "#fff",
          cursor: "pointer", boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          fontFamily: "var(--font-display)", transition: "border-color 0.15s",
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />
        support wall
      </button>
    </div>
  )
}