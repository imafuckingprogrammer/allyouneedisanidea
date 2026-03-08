import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string; convId: string }>
}

interface Message {
  id: string
  role: string
  content: string | null
  tool_calls: ToolCall[] | null
  tool_call_id: string | null
  tool_name: string | null
  created_at: string
}

interface ToolCall {
  id: string
  type: string
  function: { name: string; arguments: string }
}

interface ActionLog {
  id: string
  action_type: string
  action_data: Record<string, unknown>
  result: Record<string, unknown> | null
  confirmed_by_user: boolean
  created_at: string
}

const TOOL_ICONS: Record<string, string> = {
  navigate_to: '🔗',
  click_element: '👆',
  fill_input: '✏️',
  scroll_to: '↕️',
  extract_text: '📄',
  get_page_state: '👁️',
  wait: '⏳',
  request_confirmation: '⚠️',
  save_user_memory: '🧠',
}

const TOOL_LABELS: Record<string, string> = {
  navigate_to: 'Navigated to',
  click_element: 'Clicked',
  fill_input: 'Filled input',
  scroll_to: 'Scrolled to',
  extract_text: 'Read text from',
  get_page_state: 'Read page state',
  wait: 'Waited',
  request_confirmation: 'Asked user to confirm',
  save_user_memory: 'Saved to memory',
}

export default async function ConversationDetailPage({ params }: Props) {
  const { id, convId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify ownership through site
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, user_fingerprint, started_at, sites!inner(owner_id)')
    .eq('id', convId)
    .eq('site_id', id)
    .single()

  if (!conversation || (conversation.sites as { owner_id: string }).owner_id !== user.id) {
    notFound()
  }

  const [{ data: messages }, { data: actionLogs }] = await Promise.all([
    supabase
      .from('messages')
      .select('id, role, content, tool_calls, tool_call_id, tool_name, created_at')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true }),
    supabase
      .from('action_logs')
      .select('id, action_type, action_data, result, confirmed_by_user, created_at')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true }),
  ])

  // Build a map of tool_call_id → action log for enrichment
  const actionMap = new Map<string, ActionLog>()
  // We'll match by action_type timing — for display purposes, just show them inline

  const msgs = (messages || []) as Message[]
  const actions = (actionLogs || []) as ActionLog[]

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <Link
          href={`/dashboard/sites/${id}/conversations`}
          style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}
        >
          ← All Conversations
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Conversation</h2>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: '#9ca3af' }}>
              User {conversation.user_fingerprint.slice(0, 8)} ·{' '}
              {new Date(conversation.started_at).toLocaleString()}
            </p>
          </div>
          {actions.length > 0 && (
            <span style={{
              background: '#ede9fe', color: '#6d28d9', borderRadius: 20,
              padding: '3px 10px', fontSize: 12, fontWeight: 600,
            }}>
              ⚡ {actions.length} actions taken
            </span>
          )}
        </div>
      </div>

      {/* Transcript */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {msgs.map((msg) => {
          if (msg.role === 'user') {
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{
                  maxWidth: '70%', background: '#6366f1', color: 'white',
                  padding: '10px 16px', borderRadius: '12px 12px 4px 12px',
                  fontSize: 14, lineHeight: 1.6,
                }}>
                  {msg.content}
                </div>
              </div>
            )
          }

          if (msg.role === 'assistant') {
            const toolCalls = msg.tool_calls as ToolCall[] | null
            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
                {msg.content && (
                  <div style={{
                    maxWidth: '70%', background: 'white', color: '#111827',
                    padding: '10px 16px', borderRadius: '12px 12px 12px 4px',
                    fontSize: 14, lineHeight: 1.6, border: '1px solid #e5e7eb',
                  }}>
                    {msg.content}
                  </div>
                )}
                {toolCalls && toolCalls.map((tc) => {
                  let args: Record<string, unknown> = {}
                  try { args = JSON.parse(tc.function.arguments) } catch {}
                  const icon = TOOL_ICONS[tc.function.name] || '🔧'
                  const label = TOOL_LABELS[tc.function.name] || tc.function.name

                  return (
                    <div key={tc.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: '#f5f3ff', border: '1px solid #ede9fe',
                      borderRadius: 8, padding: '8px 12px', fontSize: 13,
                    }}>
                      <span>{icon}</span>
                      <span style={{ color: '#6d28d9', fontWeight: 500 }}>{label}</span>
                      <span style={{ color: '#7c3aed' }}>
                        {args.url as string ||
                         args.description as string ||
                         args.value as string ||
                         args.target as string ||
                         args.key as string ||
                         args.message as string ||
                         args.selector as string || ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          }

          if (msg.role === 'tool') {
            let result: Record<string, unknown> = {}
            try { result = JSON.parse(msg.content || '{}') } catch {}
            const success = result.success !== false

            return (
              <div key={msg.id} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, color: '#9ca3af', paddingLeft: 4,
              }}>
                <span style={{ color: success ? '#10b981' : '#ef4444' }}>
                  {success ? '✓' : '✗'}
                </span>
                <span>
                  {success
                    ? `${msg.tool_name} completed`
                    : `${msg.tool_name} failed: ${result.error as string || 'unknown'}`}
                </span>
              </div>
            )
          }

          return null
        })}

        {msgs.length === 0 && (
          <p style={{ color: '#9ca3af', fontSize: 14 }}>No messages in this conversation.</p>
        )}
      </div>

      {/* Action log panel */}
      {actions.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>
            ⚡ Action Log
          </h3>
          <div style={{
            background: 'white', border: '1px solid #e5e7eb',
            borderRadius: 12, overflow: 'hidden',
          }}>
            {actions.map((action, i) => (
              <div
                key={action.id}
                style={{
                  padding: '12px 16px',
                  borderBottom: i < actions.length - 1 ? '1px solid #f3f4f6' : 'none',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}
              >
                <span style={{ fontSize: 16 }}>
                  {TOOL_ICONS[action.action_type] || '🔧'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
                    {TOOL_LABELS[action.action_type] || action.action_type}
                    {action.action_data.url && (
                      <span style={{ color: '#6366f1', marginLeft: 6 }}>
                        {action.action_data.url as string}
                      </span>
                    )}
                    {action.action_data.description && (
                      <span style={{ color: '#6366f1', marginLeft: 6 }}>
                        {action.action_data.description as string}
                      </span>
                    )}
                    {action.action_data.key && (
                      <span style={{ color: '#6366f1', marginLeft: 6 }}>
                        {action.action_data.key as string} = {action.action_data.value as string}
                      </span>
                    )}
                  </div>
                  {action.confirmed_by_user && (
                    <div style={{ fontSize: 11, color: '#10b981', marginTop: 2 }}>
                      User confirmed
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>
                  {new Date(action.created_at).toLocaleTimeString()}
                </div>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: action.result && (action.result as Record<string, unknown>).success !== false
                    ? '#10b981' : '#ef4444',
                }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
