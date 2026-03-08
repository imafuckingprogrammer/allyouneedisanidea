import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { ScriptTag } from './ScriptTag'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SiteOverviewPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: site } = await supabase
    .from('sites')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (!site) notFound()

  const [{ count: convCount }, { count: msgCount }, { count: actionCount }] = await Promise.all([
    supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('site_id', id),
    supabase.from('messages')
      .select('*, conversations!inner(site_id)', { count: 'exact', head: true })
      .eq('conversations.site_id', id),
    supabase.from('action_logs').select('*', { count: 'exact', head: true }).eq('site_id', id),
  ])

  const agentServerUrl = process.env.NEXT_PUBLIC_AGENT_SERVER_URL || 'wss://your-agent-server.railway.app'
  const embedUrl = process.env.NEXT_PUBLIC_EMBED_URL || 'https://your-cdn.pages.dev/embed.js'

  return (
    <div>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard label="Conversations" value={convCount ?? 0} icon="💬" />
        <StatCard label="Messages" value={msgCount ?? 0} icon="✉️" />
        <StatCard label="Actions Taken" value={actionCount ?? 0} icon="⚡" />
      </div>

      {/* Script tag */}
      <Section
        title="Script Tag"
        hint="Paste this before the closing </body> tag on your website. The agent appears instantly."
      >
        <ScriptTag siteId={site.id} embedUrl={embedUrl} agentServerUrl={agentServerUrl} />
      </Section>

      {/* Quick config preview */}
      <Section title="Agent Configuration" hint="Manage in Settings tab.">
        <div style={{
          background: 'white', border: '1px solid #e5e7eb', borderRadius: 12,
          overflow: 'hidden',
        }}>
          <Row label="Name" value={site.agent_name} />
          <Row label="Domain" value={site.domain} />
          <Row label="Brand Color" value={
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 16, height: 16, borderRadius: 4, background: site.agent_color, display: 'inline-block' }} />
              {site.agent_color}
            </span>
          } />
          <Row label="Allowed Actions" value={(site.allowed_actions as string[] || []).join(', ')} last />
        </div>
      </Section>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div style={{
      background: 'white', border: '1px solid #e5e7eb', borderRadius: 12,
      padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div style={{ fontSize: 28 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{value.toLocaleString()}</div>
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{label}</div>
      </div>
    </div>
  )
}

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>{title}</h2>
        <p style={{ margin: '3px 0 0', fontSize: 13, color: '#9ca3af' }}>{hint}</p>
      </div>
      {children}
    </div>
  )
}

function Row({ label, value, last }: { label: string; value: React.ReactNode; last?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '14px 20px',
      borderBottom: last ? 'none' : '1px solid #f3f4f6',
      gap: 16,
    }}>
      <span style={{ width: 140, fontSize: 13, color: '#6b7280', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 14, color: '#111827' }}>{value}</span>
    </div>
  )
}
