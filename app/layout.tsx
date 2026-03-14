import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fluent — English Teleprompter',
  description: 'Practice speaking English fluently with AI-generated scripts',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
