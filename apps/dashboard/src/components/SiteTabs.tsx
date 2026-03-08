'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

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
    <div className="flex gap-0 border-b">
      {TABS.map((tab) => {
        const href = base + tab.href
        const active = tab.href === '' ? pathname === base : pathname.startsWith(href)
        return (
          <Link
            key={tab.label}
            href={href}
            className={cn(
              'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              active
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
