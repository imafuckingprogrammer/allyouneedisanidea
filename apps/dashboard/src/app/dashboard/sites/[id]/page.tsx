import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScriptTag } from './ScriptTag'
import { MessageSquare, Zap, Mail } from 'lucide-react'

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

  const [{ count: convCount }, { count: actionCount }] = await Promise.all([
    supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('site_id', id),
    supabase.from('action_logs').select('*', { count: 'exact', head: true }).eq('site_id', id),
  ])

  const agentServerUrl = process.env.NEXT_PUBLIC_AGENT_SERVER_URL || 'wss://your-agent-server.railway.app'
  const embedUrl = process.env.NEXT_PUBLIC_EMBED_URL || 'https://your-cdn.pages.dev/embed.js'

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<MessageSquare className="h-5 w-5 text-muted-foreground" />} label="Conversations" value={convCount ?? 0} />
        <StatCard icon={<Zap className="h-5 w-5 text-muted-foreground" />} label="Actions Taken" value={actionCount ?? 0} />
        <StatCard icon={<Mail className="h-5 w-5 text-muted-foreground" />} label="Site ID" value={site.id.slice(0, 8) + '...'} raw />
      </div>

      {/* Script tag */}
      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Installation</h2>
          <p className="text-sm text-muted-foreground">Paste this snippet before the closing <code className="rounded bg-muted px-1 py-0.5 text-xs">&lt;/body&gt;</code> tag on your site.</p>
        </div>
        <ScriptTag siteId={site.id} embedUrl={embedUrl} agentServerUrl={agentServerUrl} />
      </div>

      {/* Config preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuration</CardTitle>
          <CardDescription>Edit everything in the Settings tab.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {[
            { label: 'Agent Name', value: site.agent_name },
            { label: 'Domain', value: site.domain },
            { label: 'Brand Color', value: site.agent_color, color: true },
            { label: 'Allowed Actions', value: (site.allowed_actions as string[] || []).join(', ') || 'all' },
          ].map(({ label, value, color }, i, arr) => (
            <div key={label} className={`flex items-center gap-4 px-6 py-3.5 ${i < arr.length - 1 ? 'border-b' : ''}`}>
              <span className="w-36 shrink-0 text-sm text-muted-foreground">{label}</span>
              {color ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border" style={{ background: value as string }} />
                  <span className="text-sm font-mono">{value}</span>
                </div>
              ) : (
                <span className="text-sm">{value}</span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ icon, label, value, raw }: { icon: React.ReactNode; label: string; value: number | string; raw?: boolean }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">
            {raw ? value : typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
