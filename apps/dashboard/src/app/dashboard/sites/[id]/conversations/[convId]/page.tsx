import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Zap, CheckCircle2, XCircle, Clock } from 'lucide-react'

interface Props {
  params: Promise<{ id: string; convId: string }>
}

interface ToolCall {
  id: string
  type: string
  function: { name: string; arguments: string }
}

const TOOL_ICONS: Record<string, string> = {
  navigate_to: '🔗', click_element: '👆', fill_input: '✏️',
  scroll_to: '↕️', extract_text: '📄', get_page_state: '👁️',
  wait: '⏳', request_confirmation: '⚠️', save_user_memory: '🧠',
}
const TOOL_LABELS: Record<string, string> = {
  navigate_to: 'Navigate to', click_element: 'Click', fill_input: 'Fill input',
  scroll_to: 'Scroll to', extract_text: 'Read text', get_page_state: 'Read page',
  wait: 'Wait', request_confirmation: 'Confirm', save_user_memory: 'Save memory',
}

function toolSummary(name: string, args: Record<string, unknown>): string {
  return (args.url ?? args.description ?? args.value ?? args.target ?? args.key ?? args.message ?? args.selector ?? '') as string
}

export default async function ConversationDetailPage({ params }: Props) {
  const { id, convId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, user_fingerprint, started_at, sites!inner(owner_id)')
    .eq('id', convId)
    .eq('site_id', id)
    .single()

  if (!conversation || (conversation.sites as unknown as { owner_id: string }).owner_id !== user.id) notFound()

  const [{ data: messages }, { data: actionLogs }] = await Promise.all([
    supabase.from('messages').select('id, role, content, tool_calls, tool_call_id, tool_name, created_at').eq('conversation_id', convId).order('created_at', { ascending: true }),
    supabase.from('action_logs').select('id, action_type, action_data, result, confirmed_by_user, created_at').eq('conversation_id', convId).order('created_at', { ascending: true }),
  ])

  const msgs = (messages || []) as Array<{
    id: string; role: string; content: string | null;
    tool_calls: ToolCall[] | null; tool_call_id: string | null;
    tool_name: string | null; created_at: string
  }>
  const actions = (actionLogs || []) as Array<{
    id: string; action_type: string; action_data: Record<string, unknown>;
    result: Record<string, unknown> | null; confirmed_by_user: boolean; created_at: string
  }>

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="space-y-3">
        <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
          <Link href={`/dashboard/sites/${id}/conversations`}>
            <ArrowLeft className="h-4 w-4" />
            All Conversations
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Conversation</h2>
            <p className="text-sm text-muted-foreground">
              User <code className="rounded bg-muted px-1 text-xs">{conversation.user_fingerprint.slice(0, 8)}</code>
              {' · '}{new Date(conversation.started_at).toLocaleString()}
            </p>
          </div>
          {actions.length > 0 && (
            <Badge variant="purple" className="gap-1">
              <Zap className="h-3 w-3" />
              {actions.length} actions
            </Badge>
          )}
        </div>
      </div>

      {/* Chat transcript */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Transcript</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {msgs.length === 0 && <p className="text-sm text-muted-foreground">No messages.</p>}
          {msgs.map((msg) => {
            if (msg.role === 'user') {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[72%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground leading-relaxed">
                    {msg.content}
                  </div>
                </div>
              )
            }

            if (msg.role === 'assistant') {
              const tcs = msg.tool_calls as ToolCall[] | null
              return (
                <div key={msg.id} className="space-y-2">
                  {msg.content && (
                    <div className="flex">
                      <div className="max-w-[72%] rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5 text-sm leading-relaxed">
                        {msg.content}
                      </div>
                    </div>
                  )}
                  {tcs?.map((tc) => {
                    let args: Record<string, unknown> = {}
                    try { args = JSON.parse(tc.function.arguments) } catch {}
                    return (
                      <div key={tc.id} className="flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs text-violet-700 w-fit">
                        <span>{TOOL_ICONS[tc.function.name] || '🔧'}</span>
                        <span className="font-medium">{TOOL_LABELS[tc.function.name] || tc.function.name}</span>
                        {toolSummary(tc.function.name, args) && (
                          <span className="opacity-75 truncate max-w-xs">{toolSummary(tc.function.name, args)}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            }

            if (msg.role === 'tool') {
              let result: Record<string, unknown> = {}
              try { result = JSON.parse(msg.content || '{}') } catch {}
              const ok = result.success !== false
              return (
                <div key={msg.id} className="flex items-center gap-1.5 pl-1 text-xs text-muted-foreground">
                  {ok
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    : <XCircle className="h-3.5 w-3.5 text-destructive" />
                  }
                  <span>{ok ? `${msg.tool_name} completed` : `${msg.tool_name} failed: ${result.error ?? 'unknown'}`}</span>
                </div>
              )
            }
            return null
          })}
        </CardContent>
      </Card>

      {/* Action log */}
      {actions.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Zap className="h-3.5 w-3.5" /> Action Log
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {actions.map((action, i) => {
              const ok = action.result ? (action.result as Record<string,unknown>).success !== false : true
              return (
                <div key={action.id}>
                  {i > 0 && <Separator />}
                  <div className="flex items-center gap-3 px-6 py-3">
                    <span className="text-base">{TOOL_ICONS[action.action_type] || '🔧'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {TOOL_LABELS[action.action_type] || action.action_type}
                        {!!(action.action_data.url ?? action.action_data.description ?? action.action_data.key) && (
                          <span className="text-primary ml-2 font-normal">
                            {String(action.action_data.url ?? action.action_data.description ?? `${action.action_data.key} = ${action.action_data.value}`)}
                          </span>
                        )}
                      </p>
                      {action.confirmed_by_user && (
                        <p className="text-xs text-emerald-600 mt-0.5">User confirmed</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {new Date(action.created_at).toLocaleTimeString()}
                      </span>
                      <div className={`h-2 w-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-destructive'}`} />
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
