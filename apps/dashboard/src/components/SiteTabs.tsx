'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { label: 'Overview',      href: '' },
  { label: 'Knowledge',     href: '/knowledge' },
  { label: 'Conversations', href: '/conversations' },
  { label: 'Settings',      href: '/settings' },
]

export function SiteTabs({ siteId }: { siteId: string }) {
  const pathname = usePathname()
  const base = `/dashboard/sites/${siteId}`

  return (
    <div style={{
      display: 'flex', gap: 2, borderBottom: '1px solid #e5e7eb',
      marginBottom: 32, paddingBottom: 0,
    }}>
      {TABS.map((tab) => {
        const href = base + tab.href
        // Active: exact match for overview, prefix match for others
        const active = tab.href === ''
          ? pathname === base
          : pathname.startsWith(href)

        return (
          <Link
            key={tab.label}
            href={href}
            style={{
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: active ? 600 : 400,
              color: active ? '#6366f1' : '#6b7280',
              textDecoration: 'none',
              borderBottom: active ? '2px solid #6366f1' : '2px solid transparent',
              marginBottom: -1,
              whiteSpace: 'nowrap',
              transition: 'color 0.15s',
            }}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
