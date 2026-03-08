import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sites } = await supabase
    .from('sites')
    .select('id, name, domain, agent_name, agent_color, created_at')
    .order('created_at', { ascending: false })

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>✨ Your Agents</h1>
          <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: 14 }}>{user.email}</p>
        </div>
        <Link href="/dashboard/sites/new" style={btnLinkStyle}>
          + New Agent
        </Link>
      </div>

      {!sites || sites.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 12, border: '2px dashed #e5e7eb' }}>
          <p style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>No agents yet</p>
          <p style={{ color: '#6b7280', margin: '0 0 24px', fontSize: 14 }}>
            Create your first agent and get a script tag to paste into any website.
          </p>
          <Link href="/dashboard/sites/new" style={btnLinkStyle}>Create your first agent</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {sites.map((site) => (
            <Link key={site.id} href={`/dashboard/sites/${site.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', borderRadius: 12, padding: '20px 24px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'box-shadow 0.15s' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: site.agent_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  ✨
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 16, color: '#111827' }}>{site.name}</div>
                  <div style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>{site.domain} · {site.agent_name}</div>
                </div>
                <div style={{ color: '#6366f1', fontSize: 13, fontWeight: 500 }}>View →</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

const btnLinkStyle: React.CSSProperties = {
  display: 'inline-block', padding: '10px 20px', background: '#6366f1',
  color: 'white', borderRadius: 8, fontSize: 14, fontWeight: 600,
  textDecoration: 'none', cursor: 'pointer',
}
