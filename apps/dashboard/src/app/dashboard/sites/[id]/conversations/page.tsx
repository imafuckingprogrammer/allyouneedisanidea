import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ConversationsPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: site } = await supabase
    .from('sites')
    .select('id')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (!site) notFound()

  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, user_fingerprint, started_at, last_active_at')
    .eq('site_id', id)
    .order('last_active_at', { ascending: false })
    .limit(50)

  // For each conversation, get message count, action count, and first user message
  const enriched = await Promise.all(
    (conversations || []).map(async (conv) => {
      const [{ count: msgCount }, { count: actionCount }, { data: firstMsg }] = await Promise.all([
        supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id),
        supabase
          .from('action_logs')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id),
        supabase
          .from('messages')
          .select('content')
          .eq('conversation_id', conv.id)
          .eq('role', 'user')
          .order('created_at', { ascending: true })
          .limit(1)
          .single(),
      ])
      return {
        ...conv,
        msgCount: msgCount ?? 0,
        actionCount: actionCount ?? 0,
        firstMessage: firstMsg?.content ?? null,
      }
    })
  )

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Conversations</h2>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' }}>
          Every chat session from your website visitors. Click to see the full transcript.
        </p>
      </div>

      {enriched.length === 0 ? (
        <div style={{
          background: 'white', border: '2px dashed #e5e7eb', borderRadius: 12,
          padding: '48px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
          <p style={{ fontWeight: 600, fontSize: 16, margin: '0 0 6px' }}>No conversations yet</p>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
            Once visitors use the chat widget on your site, their conversations appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {enriched.map((conv) => (
            <Link
              key={conv.id}
              href={`/dashboard/sites/${id}/conversations/${conv.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                background: 'white', border: '1px solid #e5e7eb', borderRadius: 12,
                padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
                cursor: 'pointer', transition: 'border-color 0.15s',
              }}>
                {/* Avatar */}
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: '#f3f4f6', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 16, flexShrink: 0,
                }}>
                  👤
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, color: '#111827', fontWeight: 500,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    marginBottom: 4,
                  }}>
                    {conv.firstMessage
                      ? `"${conv.firstMessage.slice(0, 80)}${conv.firstMessage.length > 80 ? '...' : ''}"`
                      : 'No messages'}
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#9ca3af' }}>
                    <span>{relativeTime(conv.last_active_at)}</span>
                    <span>·</span>
                    <span>{conv.msgCount} messages</span>
                    {conv.actionCount > 0 && (
                      <>
                        <span>·</span>
                        <span style={{ color: '#6366f1', fontWeight: 500 }}>
                          ⚡ {conv.actionCount} actions
                        </span>
                      </>
                    )}
                    <span>·</span>
                    <span style={{ fontFamily: 'monospace', fontSize: 11 }}>
                      {conv.user_fingerprint.slice(0, 8)}
                    </span>
                  </div>
                </div>

                <div style={{ color: '#d1d5db', fontSize: 18 }}>→</div>
              </div>
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
