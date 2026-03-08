import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AllYouNeedIsAnIdea — AI Agent Platform',
  description: 'Add an AI agent to your website with one script tag.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
