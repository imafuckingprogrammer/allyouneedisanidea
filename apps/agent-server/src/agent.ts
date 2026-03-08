import OpenAI from 'openai'
import { v4 as uuid } from 'uuid'
import {
  getSite,
  getOrCreateConversation,
  getConversationHistory,
  saveMessage,
  getUserMemories,
  upsertUserMemory,
  getSiteKnowledge,
  logAction,
} from './db'
import { AGENT_TOOLS, DOM_TOOLS, ACTION_LABELS, selectorIsDestructive } from './tools'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Model: gpt-4o-mini — cheap ($0.15/$0.60 per M tokens), solid tool use
// Upgrade to gpt-4o if tool-use reliability needs improvement
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

// ============================================================
// Session — represents one connected embed script
// ============================================================

export interface Session {
  siteId: string
  userFingerprint: string
  conversationId: string | null
  pageContext: Record<string, unknown>
  // Callbacks to send data back to the WebSocket client
  send: (msg: Record<string, unknown>) => void
  // Pending action result — resolved when embed reports back
  pendingActionResolve: ((result: unknown) => void) | null
  // Pending confirmation — resolved when user confirms/cancels
  pendingConfirmResolve: ((confirmed: boolean) => void) | null
}

// ============================================================
// Handle an incoming user message — runs the full agentic loop
// ============================================================

export async function handleUserMessage(session: Session, text: string) {
  // 1. Load site config
  const site = await getSite(session.siteId)
  if (!site) {
    session.send({ type: 'error', message: 'Site not found.' })
    return
  }

  // 2. Validate domain — basic SSRF / abuse protection
  // (In prod: check against site.domain + site.allowed_domains)

  // 3. Get or create conversation
  if (!session.conversationId) {
    session.conversationId = await getOrCreateConversation(
      session.siteId,
      session.userFingerprint
    )
  }
  const convId = session.conversationId

  // 4. Load memory + knowledge in parallel
  const [memories, knowledge] = await Promise.all([
    getUserMemories(session.siteId, session.userFingerprint),
    getSiteKnowledge(session.siteId, text),
  ])

  // 5. Build system prompt
  const systemPrompt = buildSystemPrompt(site.system_prompt, memories, knowledge, session.pageContext)

  // 6. Load conversation history
  const history = await getConversationHistory(convId)

  // 7. Persist user message
  await saveMessage(convId, 'user', text)

  // 8. Build messages array for OpenAI
  const messages = buildMessages(systemPrompt, history, text)

  // 9. Run the agentic loop
  await runAgentLoop(session, convId, site, messages)
}

// ============================================================
// Agentic loop — keeps running until Claude stops calling tools
// ============================================================

async function runAgentLoop(
  session: Session,
  convId: string,
  site: ReturnType<Awaited<ReturnType<typeof getSite>>> & {},
  messages: OpenAI.Chat.ChatCompletionMessageParam[]
) {
  const MAX_ITERATIONS = 10 // safety ceiling — prevent infinite loops
  let iterations = 0

  while (iterations < MAX_ITERATIONS) {
    iterations++

    // Stream the response
    const stream = await openai.chat.completions.create({
      model: MODEL,
      messages,
      tools: AGENT_TOOLS,
      tool_choice: 'auto',
      stream: true,
      temperature: 0.2, // low temp for reliable tool use
    })

    // Collect the full response while streaming text to the client
    let fullText = ''
    const toolCallAccumulator: Record<string, {
      id: string
      name: string
      argumentsRaw: string
    }> = {}

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta

      // Stream text tokens directly to the widget
      if (delta?.content) {
        fullText += delta.content
        session.send({ type: 'text_chunk', chunk: delta.content })
      }

      // Accumulate tool calls (they arrive in fragments)
      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index
          if (!toolCallAccumulator[idx]) {
            toolCallAccumulator[idx] = { id: tc.id || '', name: '', argumentsRaw: '' }
          }
          if (tc.id) toolCallAccumulator[idx].id = tc.id
          if (tc.function?.name) toolCallAccumulator[idx].name += tc.function.name
          if (tc.function?.arguments) toolCallAccumulator[idx].argumentsRaw += tc.function.arguments
        }
      }
    }

    const toolCalls = Object.values(toolCallAccumulator)

    // Persist assistant message
    if (fullText || toolCalls.length > 0) {
      await saveMessage(
        convId,
        'assistant',
        fullText || null,
        toolCalls.length > 0 ? toolCalls : undefined
      )
    }

    // If no tool calls, we're done
    if (toolCalls.length === 0) {
      session.send({ type: 'text_done' })
      return
    }

    // Finalize any partial text before showing action indicator
    if (fullText) session.send({ type: 'text_done' })

    // Add assistant message to local history
    messages.push({
      role: 'assistant',
      content: fullText || null,
      tool_calls: toolCalls.map((tc) => ({
        id: tc.id,
        type: 'function' as const,
        function: { name: tc.name, arguments: tc.argumentsRaw },
      })),
    })

    // Process each tool call
    for (const tc of toolCalls) {
      let args: Record<string, unknown> = {}
      try {
        args = JSON.parse(tc.argumentsRaw)
      } catch {
        // Malformed JSON from model — treat as empty
      }

      const toolResult = await executeToolCall(session, convId, site, tc.name, tc.id, args)

      // Add tool result to messages for next iteration
      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify(toolResult),
      })

      // Persist tool result
      await saveMessage(convId, 'tool', JSON.stringify(toolResult), undefined, tc.id, tc.name)
    }
  }

  // If we hit the ceiling, something is wrong
  session.send({ type: 'text_chunk', chunk: "\n\nI've reached the maximum number of steps. Please try again with a more specific request." })
  session.send({ type: 'text_done' })
}

// ============================================================
// Execute a single tool call
// ============================================================

async function executeToolCall(
  session: Session,
  convId: string,
  site: NonNullable<Awaited<ReturnType<typeof getSite>>>,
  toolName: string,
  toolCallId: string,
  args: Record<string, unknown>
): Promise<unknown> {
  // ── Server-side tools ──────────────────────────────────────

  if (toolName === 'save_user_memory') {
    await upsertUserMemory(
      session.siteId,
      session.userFingerprint,
      args.key as string,
      args.value as string
    )
    return { success: true }
  }

  if (toolName === 'request_confirmation') {
    const message = args.message as string
    const confirmId = uuid()

    // Ask the user via the widget
    session.send({ type: 'confirm', message, confirmId })

    // Wait for user response (resolved in handleConfirmResult)
    const confirmed = await new Promise<boolean>((resolve) => {
      session.pendingConfirmResolve = resolve
      // Auto-cancel after 60 seconds if user doesn't respond
      setTimeout(() => resolve(false), 60_000)
    })
    session.pendingConfirmResolve = null

    await logAction(convId, session.siteId, 'confirm_prompt', { message }, { confirmed }, confirmed)
    return { confirmed, message: confirmed ? 'User confirmed.' : 'User cancelled.' }
  }

  // ── DOM tools — forwarded to embed script ──────────────────

  if (DOM_TOOLS.has(toolName)) {
    // Safety check: if clicking something that looks destructive, require confirmation first
    if (toolName === 'click_element' && selectorIsDestructive(args.selector as string)) {
      // Force a confirmation before proceeding
      const confirmId = uuid()
      session.send({
        type: 'confirm',
        confirmId,
        message: `About to click "${args.description || args.selector}" — this looks like a destructive action. Continue?`,
      })
      const confirmed = await new Promise<boolean>((resolve) => {
        session.pendingConfirmResolve = resolve
        setTimeout(() => resolve(false), 60_000)
      })
      session.pendingConfirmResolve = null
      if (!confirmed) return { success: false, reason: 'User cancelled.' }
    }

    // Domain validation for navigation
    if (toolName === 'navigate_to') {
      const url = args.url as string
      const allowedDomains = [site.domain, ...site.allowed_domains]
      const isAllowed = allowedDomains.some((d) => url.includes(d)) || url.startsWith('/')
      if (!isAllowed) {
        return { success: false, error: `Navigation to ${url} is not allowed for this site.` }
      }
    }

    const actionId = uuid()
    const label = getActionLabel(toolName, args)

    session.send({
      type: 'action',
      action: toolName,
      params: args,
      actionId,
      label,
    })

    // Wait for the embed to report back
    const result = await new Promise<unknown>((resolve) => {
      session.pendingActionResolve = resolve
      // Timeout — if embed doesn't respond in 15s, continue anyway
      setTimeout(() => resolve({ success: false, error: 'Action timed out.' }), 15_000)
    })
    session.pendingActionResolve = null

    await logAction(convId, session.siteId, toolName, args, result)
    return result
  }

  return { success: false, error: `Unknown tool: ${toolName}` }
}

// ============================================================
// Helpers
// ============================================================

function getActionLabel(toolName: string, args: Record<string, unknown>): string {
  if (toolName === 'navigate_to') return `Navigating to ${args.url}...`
  if (toolName === 'click_element') return `Clicking "${args.description || args.selector}"...`
  if (toolName === 'fill_input') return `Filling in "${args.description}"...`
  if (toolName === 'wait') return args.reason as string || 'Waiting...'
  return ACTION_LABELS[toolName] || 'Working...'
}

function buildSystemPrompt(
  sitePrompt: string,
  memories: Array<{ key: string; value: string }>,
  knowledge: string,
  pageContext: Record<string, unknown>
): string {
  const parts = [sitePrompt]

  if (memories.length > 0) {
    parts.push(
      '\n## What I know about this user\n' +
      memories.map((m) => `- ${m.key}: ${m.value}`).join('\n')
    )
  }

  if (knowledge) {
    parts.push('\n## Relevant site information\n' + knowledge)
  }

  if (pageContext.url) {
    parts.push(
      '\n## Current page\n' +
      `URL: ${pageContext.url}\n` +
      `Title: ${pageContext.title || 'Unknown'}`
    )
  }

  parts.push(`
## Rules
- Always call get_page_state() or wait() after navigating or clicking, to verify the action worked before continuing.
- For React/SPA sites, use wait() with 500-1000ms after clicking to let the UI update.
- NEVER click destructive elements (cancel, delete, remove) without first calling request_confirmation().
- If you cannot find an element after trying, tell the user honestly rather than retrying endlessly.
- Keep responses concise. Don't explain what you are about to do — just do it and confirm when done.
- Save useful facts about the user with save_user_memory() when they share them.
`)

  return parts.join('\n')
}

function buildMessages(
  systemPrompt: string,
  history: Array<Record<string, unknown>>,
  newUserMessage: string
): OpenAI.Chat.ChatCompletionMessageParam[] {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
  ]

  for (const msg of history) {
    if (msg.role === 'user') {
      messages.push({ role: 'user', content: msg.content as string })
    } else if (msg.role === 'assistant') {
      messages.push({
        role: 'assistant',
        content: (msg.content as string) || null,
        tool_calls: msg.tool_calls as OpenAI.Chat.ChatCompletionMessageToolCall[] | undefined,
      })
    } else if (msg.role === 'tool') {
      messages.push({
        role: 'tool',
        tool_call_id: msg.tool_call_id as string,
        content: msg.content as string,
      })
    }
  }

  // The new message is already in history (we saved it before calling this),
  // but history query is run before the save so it won't be there — add it
  messages.push({ role: 'user', content: newUserMessage })

  return messages
}
