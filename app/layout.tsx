import type { Metadata } from 'next'
import './globals.css'
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: `Nathing — Let's Fluent to Speak English!`,
  description: 'Practice speaking English fluently with AI-generated scripts',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
