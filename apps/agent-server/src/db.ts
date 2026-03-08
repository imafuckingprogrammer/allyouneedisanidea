import { createClient } from '@supabase/supabase-js'

// Use SERVICE ROLE key — this bypasses RLS and is only used server-side
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export interface Site {
  id: string
  name: string
  domain: string
  agent_name: string
  agent_color: string
  system_prompt: string
  allowed_domains: string[]
  allowed_actions: string[]
}

export interface Memory {
  key: string
  value: string
}

export async function getSite(siteId: string): Promise<Site | null> {
  const { data } = await supabase
    .from('sites')
    .select('id, name, domain, agent_name, agent_color, system_prompt, allowed_domains, allowed_actions')
    .eq('id', siteId)
    .single()
  return data
}

export async function getOrCreateConversation(
  siteId: string,
  userFingerprint: string
): Promise<string> {
  // Look for an active conversation in the last 30 minutes
  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString()
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('site_id', siteId)
    .eq('user_fingerprint', userFingerprint)
    .gte('last_active_at', cutoff)
    .order('last_active_at', { ascending: false })
    .limit(1)
    .single()

  if (existing) {
    // Bump last_active_at
    await supabase
      .from('conversations')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', existing.id)
    return existing.id
  }

  const { data: created } = await supabase
    .from('conversations')
    .insert({ site_id: siteId, user_fingerprint: userFingerprint })
    .select('id')
    .single()

  return created!.id
}

export async function getConversationHistory(conversationId: string) {
  const { data } = await supabase
    .from('messages')
    .select('role, content, tool_calls, tool_call_id, tool_name')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(40) // sliding window — last 40 messages
  return data || []
}

export async function saveMessage(
  conversationId: string,
  role: string,
  content: string | null,
  toolCalls?: unknown,
  toolCallId?: string,
  toolName?: string
) {
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    role,
    content,
    tool_calls: toolCalls || null,
    tool_call_id: toolCallId || null,
    tool_name: toolName || null,
  })
}

export async function getUserMemories(
  siteId: string,
  userFingerprint: string
): Promise<Memory[]> {
  const { data } = await supabase
    .from('user_memories')
    .select('key, value')
    .eq('site_id', siteId)
    .eq('user_fingerprint', userFingerprint)
  return data || []
}

export async function upsertUserMemory(
  siteId: string,
  userFingerprint: string,
  key: string,
  value: string
) {
  await supabase.from('user_memories').upsert(
    { site_id: siteId, user_fingerprint: userFingerprint, key, value, updated_at: new Date().toISOString() },
    { onConflict: 'site_id,user_fingerprint,key' }
  )
}

export async function getSiteKnowledge(siteId: string, query: string): Promise<string> {
  // Fetch all knowledge for this site (demo-scale: typically < 20 entries)
  // and do simple keyword filtering. No pgvector needed for the demo.
  const { data } = await supabase
    .from('site_knowledge')
    .select('title, content')
    .eq('site_id', siteId)
    .limit(20)

  if (!data || data.length === 0) return ''

  // Score entries by how many query words appear in title+content
  const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2)
  const scored = data
    .map((entry) => {
      const text = (entry.title + ' ' + entry.content).toLowerCase()
      const score = queryWords.reduce((acc, word) => acc + (text.includes(word) ? 1 : 0), 0)
      return { ...entry, score }
    })
    .filter((e) => e.score > 0 || data.length <= 5) // if few entries, include all
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)

  if (scored.length === 0) {
    // No keyword matches — still include top 2 entries so agent has some context
    return data.slice(0, 2).map((d) => `### ${d.title}\n${d.content}`).join('\n\n')
  }

  return scored.map((d) => `### ${d.title}\n${d.content}`).join('\n\n')
}

export async function logAction(
  conversationId: string,
  siteId: string,
  actionType: string,
  actionData: unknown,
  result: unknown,
  confirmedByUser = false
) {
  await supabase.from('action_logs').insert({
    conversation_id: conversationId,
    site_id: siteId,
    action_type: actionType,
    action_data: actionData,
    result,
    confirmed_by_user: confirmedByUser,
  })
}
