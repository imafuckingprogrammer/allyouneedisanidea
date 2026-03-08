import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Zap, ArrowRight, User } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ConversationsPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: site } = await supabase.from('sites').select('id').eq('id', id).eq('owner_id', user.id).single()
  if (!site) notFound()

  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, user_fingerprint, started_at, last_active_at')
    .eq('site_id', id)
    .order('last_active_at', { ascending: false })
    .limit(50)

  const enriched = await Promise.all(
    (conversations || []).map(async (conv) => {
      const [{ count: msgCount }, { count: actionCount }, { data: firstMsg }] = await Promise.all([
        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('conversation_id', conv.id),
        supabase.from('action_logs').select('*', { count: 'exact', head: true }).eq('conversation_id', conv.id),
        supabase.from('messages').select('content').eq('conversation_id', conv.id).eq('role', 'user').order('created_at', { ascending: true }).limit(1).single(),
      ])
      return { ...conv, msgCount: msgCount ?? 0, actionCount: actionCount ?? 0, firstMessage: firstMsg?.content ?? null }
    })
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Conversations</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every chat session from your website visitors. Click to see the full transcript and action log.
        </p>
      </div>

      {enriched.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-background py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted mb-4">
            <MessageSquare className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1">No conversations yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Once visitors use the chat widget on your site, their sessions appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {enriched.map((conv) => (
            <Link
              key={conv.id}
              href={`/dashboard/sites/${id}/conversations/${conv.id}`}
              className="group flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/30"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {conv.firstMessage
                    ? `"${conv.firstMessage.slice(0, 80)}${conv.firstMessage.length > 80 ? '...' : ''}"`
                    : <span className="text-muted-foreground italic">No messages</span>
                  }
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{relativeTime(conv.last_active_at)}</span>
                  <span>·</span>
                  <span>{conv.msgCount} messages</span>
                  {conv.actionCount > 0 && (
                    <Badge variant="purple" className="gap-1">
                      <Zap className="h-2.5 w-2.5" />
                      {conv.actionCount} actions
                    </Badge>
                  )}
                  <span className="font-mono text-xs opacity-60">{conv.user_fingerprint.slice(0, 8)}</span>
                </div>
              </div>

              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
