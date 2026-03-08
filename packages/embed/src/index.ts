// ============================================================
// Entry point — bootstraps the widget and WebSocket connection
// Reads config from the <script> tag's data attributes
//
// Usage:
//   <script src="https://cdn.yourdomain.com/embed.js"
//           data-site-id="YOUR_SITE_ID"
//           data-server="wss://agent.yourdomain.com">
//   </script>
// ============================================================

import { createWidget } from './widget'
import { executeAction, getPageState, setupNavigationTracking } from './dom'
import { initOverlay, highlightElement, showScanOverlay, clearOverlay } from './overlay'

;(function () {
  // Read config from the script tag that loaded this file
  const scriptTag = document.currentScript as HTMLScriptElement | null
  const SITE_ID = scriptTag?.dataset.siteId
  const SERVER_URL = scriptTag?.dataset.server || 'wss://agent.yourdomain.com'

  if (!SITE_ID) {
    console.error('[AIAgent] Missing data-site-id on script tag.')
    return
  }

  // Stable anonymous fingerprint per browser+site (not privacy-invasive)
  function getFingerprint(): string {
    const key = `ai_agent_fp_${SITE_ID}`
    let fp = localStorage.getItem(key)
    if (!fp) {
      fp = Math.random().toString(36).slice(2) + Date.now().toString(36)
      localStorage.setItem(key, fp)
    }
    return fp
  }

  const USER_FP = getFingerprint()

  // ============================================================
  // WebSocket connection with reconnect logic
  // ============================================================

  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let reconnectDelay = 1000
  let widget: ReturnType<typeof createWidget> | null = null
  let pendingConfirmResolve: ((confirmed: boolean) => void) | null = null

  function connect() {
    const url = `${SERVER_URL}?siteId=${SITE_ID}&fp=${USER_FP}&url=${encodeURIComponent(window.location.href)}`
    ws = new WebSocket(url)

    ws.addEventListener('open', () => {
      reconnectDelay = 1000
      widget?.setStatus('connected')
      // Send current page context on connect
      ws!.send(JSON.stringify({ type: 'page_context', data: getPageState() }))
    })

    ws.addEventListener('message', async (event) => {
      const msg = JSON.parse(event.data as string)
      await handleServerMessage(msg)
    })

    ws.addEventListener('close', () => {
      widget?.setStatus('connecting')
      widget?.hideActionIndicator()
      scheduleReconnect()
    })

    ws.addEventListener('error', () => {
      widget?.setStatus('error')
    })
  }

  function scheduleReconnect() {
    if (reconnectTimer) return
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      reconnectDelay = Math.min(reconnectDelay * 2, 16000)
      connect()
    }, reconnectDelay)
  }

  // ============================================================
  // Handle messages from the agent server
  // ============================================================

  async function handleServerMessage(msg: Record<string, unknown>) {
    switch (msg.type) {
      case 'config': {
        // Server sends site config on connect (agent name, color)
        const config = msg.data as { agentName: string; agentColor: string }
        initOverlay(config.agentColor)
        if (!widget) {
          widget = createWidget({
            agentName: config.agentName,
            agentColor: config.agentColor,
            onMessage: sendUserMessage,
          })
          widget.setStatus('connecting') // connected event will flip this
        }
        break
      }

      case 'text_chunk': {
        widget?.appendAssistantChunk(msg.chunk as string)
        break
      }

      case 'text_done': {
        widget?.finalizeAssistantMessage()
        break
      }

      case 'action': {
        // Agent wants to do something on the page
        const action = msg.action as string
        const params = (msg.params as Record<string, unknown>) || {}
        const actionId = msg.actionId as string
        const label = msg.label as string || action

        widget?.showActionIndicator(label)

        // Show page-level overlay depending on action type
        if (action === 'get_page_state') {
          showScanOverlay()
        } else {
          const selector = (params.selector ?? params.target) as string | undefined
          if (selector && selector !== 'top' && selector !== 'bottom') {
            await highlightElement(selector, label)
          }
        }

        const result = await executeAction(action, params)

        clearOverlay()
        widget?.hideActionIndicator()

        // Report result back to server so agent can continue
        ws?.send(JSON.stringify({ type: 'action_result', actionId, result }))

        // After any action, send updated page state
        ws?.send(JSON.stringify({ type: 'page_context', data: getPageState() }))
        break
      }

      case 'confirm': {
        // Server requires user confirmation before proceeding
        const message = msg.message as string
        const confirmId = msg.confirmId as string

        widget?.showConfirmation(
          message,
          () => ws?.send(JSON.stringify({ type: 'confirm_result', confirmId, confirmed: true })),
          () => ws?.send(JSON.stringify({ type: 'confirm_result', confirmId, confirmed: false }))
        )
        break
      }

      case 'error': {
        widget?.finalizeAssistantMessage()
        widget?.hideActionIndicator()
        widget?.appendAssistantChunk(msg.message as string || 'Something went wrong.')
        widget?.finalizeAssistantMessage()
        break
      }
    }
  }

  // ============================================================
  // Send user message
  // ============================================================

  function sendUserMessage(text: string) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    widget?.appendUserMessage(text)
    ws.send(JSON.stringify({
      type: 'user_message',
      text,
      pageContext: getPageState(),
    }))
  }

  // ============================================================
  // Track SPA navigation — tell the server when URL changes
  // ============================================================

  setupNavigationTracking((url) => {
    ws?.send(JSON.stringify({ type: 'page_context', data: { ...getPageState(), url } }))
  })

  // ============================================================
  // Init — fetch site config then connect
  // ============================================================

  // Widget is created when server sends 'config' message.
  // Start the WebSocket immediately.
  connect()
})()
