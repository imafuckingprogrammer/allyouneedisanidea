import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'
import { ScriptTag } from './ScriptTag'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SitePage({ params }: Props) {
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

  const { count: conversationCount } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('site_id', id)

  const { count: messageCount } = await supabase
    .from('messages')
    .select('*, conversations!inner(site_id)', { count: 'exact', head: true })
    .eq('conversations.site_id', id)

  const agentServerUrl = process.env.NEXT_PUBLIC_AGENT_SERVER_URL || 'wss://your-agent-server.railway.app'
  const embedUrl = process.env.NEXT_PUBLIC_EMBED_URL || 'https://your-cdn.pages.dev/embed.js'

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <Link href="/dashboard" style={{ color: '#6b7280', fontSize: 14, textDecoration: 'none' }}>← All Agents</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: site.agent_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>✨</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>{site.name}</h1>
            <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>{site.domain} · Agent: {site.agent_name}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        <StatCard label="Conversations" value={conversationCount || 0} />
        <StatCard label="Messages" value={messageCount || 0} />
      </div>

      {/* Script Tag */}
      <Section title="Your Script Tag" hint="Paste this before the closing </body> tag on your website. That's it.">
        <ScriptTag siteId={site.id} embedUrl={embedUrl} agentServerUrl={agentServerUrl} />
      </Section>

      {/* System Prompt */}
      <Section title="Agent Instructions" hint="What the agent knows and how it behaves.">
        <pre style={{ background: '#f3f4f6', padding: 16, borderRadius: 8, fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
          {site.system_prompt}
        </pre>
        <Link href={`/dashboard/sites/${id}/edit`} style={{ display: 'inline-block', marginTop: 12, fontSize: 13, color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}>
          Edit instructions →
        </Link>
      </Section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: '20px 24px', border: '1px solid #e5e7eb' }}>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{label}</div>
    </div>
  )
}

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 4px' }}>{title}</h2>
      <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 16px' }}>{hint}</p>
      {children}
    </div>
  )
}
