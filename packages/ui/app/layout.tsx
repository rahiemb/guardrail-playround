import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Guardrail Playground',
  description:
    'Visual tool for designing, testing, and composing input/output guardrails for LLM applications.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ height: '100dvh', overflow: 'hidden' }}>{children}</body>
    </html>
  )
}
