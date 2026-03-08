import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'
import { SiteTabs } from '@/components/SiteTabs'

interface Props {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default async function SiteLayout({ children, params }: Props) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: site } = await supabase
    .from('sites')
    .select('id, name, domain, agent_name, agent_color')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (!site) notFound()

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Top bar */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 32px',
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          {/* Header row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '20px 0 16px',
          }}>
            <Link
              href="/dashboard"
              style={{ color: '#9ca3af', fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap' }}
            >
              ← All Agents
            </Link>
            <div style={{ width: 1, height: 16, background: '#e5e7eb' }} />
            <div
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: site.agent_color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, flexShrink: 0,
              }}
            >
              ✨
            </div>
            <div>
              <span style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>{site.name}</span>
              <span style={{ color: '#9ca3af', fontSize: 13, marginLeft: 10 }}>{site.domain}</span>
            </div>
          </div>

          {/* Tabs */}
          <SiteTabs siteId={id} />
        </div>
      </div>

      {/* Page content */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 32px' }}>
        {children}
      </div>
    </div>
  )
}
