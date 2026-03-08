import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AllYouNeedIsAnIdea — AI Agent Platform',
  description: 'Add an AI agent to your website with one script tag.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#f9fafb', color: '#111827' }}>
        {children}
      </body>
    </html>
  )
}
