// ============================================================
// Chat Widget — rendered inside Shadow DOM so it never
// conflicts with the host site's CSS
// ============================================================

export interface WidgetConfig {
  agentName: string
  agentColor: string
  onMessage: (text: string) => void
}

export interface Widget {
  appendUserMessage: (text: string) => void
  appendAssistantChunk: (chunk: string) => void
  finalizeAssistantMessage: () => void
  showActionIndicator: (label: string) => void
  hideActionIndicator: () => void
  showConfirmation: (message: string, onConfirm: () => void, onCancel: () => void) => void
  setStatus: (status: 'connected' | 'connecting' | 'error') => void
}

const CSS = (color: string) => `
  :host { all: initial; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  * { box-sizing: border-box; margin: 0; padding: 0; }

  #launcher {
    position: fixed; bottom: 24px; right: 24px; z-index: 2147483647;
    width: 56px; height: 56px; border-radius: 50%;
    background: ${color}; border: none; cursor: pointer;
    box-shadow: 0 4px 24px rgba(0,0,0,0.25);
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  #launcher:hover { transform: scale(1.1); box-shadow: 0 6px 30px rgba(0,0,0,0.3); }
  #launcher svg { width: 26px; height: 26px; fill: white; transition: transform 0.2s ease; }
  #launcher.open svg { transform: rotate(90deg); }

  #window {
    position: fixed; bottom: 92px; right: 24px; z-index: 2147483647;
    width: 380px; height: 580px; border-radius: 20px;
    background: #ffffff;
    box-shadow: 0 16px 60px rgba(0,0,0,0.15), 0 4px 20px rgba(0,0,0,0.08);
    display: flex; flex-direction: column; overflow: hidden;
    transform-origin: bottom right;
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease;
  }
  #window.hidden { transform: scale(0.85); opacity: 0; pointer-events: none; }

  #header {
    padding: 16px 18px; background: ${color};
    display: flex; align-items: center; gap: 12px; flex-shrink: 0;
  }
  #header .avatar {
    width: 36px; height: 36px; border-radius: 50%;
    background: rgba(255,255,255,0.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 17px; flex-shrink: 0;
  }
  #header .info { flex: 1; min-width: 0; }
  #header .name { color: white; font-weight: 700; font-size: 15px; }
  #header .status {
    color: rgba(255,255,255,0.8); font-size: 12px; margin-top: 2px;
    display: flex; align-items: center; gap: 5px;
  }
  #header .status-dot {
    width: 6px; height: 6px; border-radius: 50%; background: #86efac; flex-shrink: 0;
  }
  #header .status-dot.offline { background: rgba(255,255,255,0.4); }
  #close-btn {
    background: rgba(255,255,255,0.15); border: none; cursor: pointer;
    color: white; width: 28px; height: 28px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; line-height: 1; flex-shrink: 0; transition: background 0.15s;
  }
  #close-btn:hover { background: rgba(255,255,255,0.25); }

  #messages {
    flex: 1; overflow-y: auto; padding: 14px 14px 6px;
    display: flex; flex-direction: column; gap: 8px; scroll-behavior: smooth;
  }
  #messages::-webkit-scrollbar { width: 4px; }
  #messages::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
  #messages::-webkit-scrollbar-track { background: transparent; }

  .msg {
    max-width: 82%; padding: 10px 14px; border-radius: 14px;
    font-size: 14px; line-height: 1.55; word-break: break-word;
    animation: fadeUp 0.18s ease;
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .msg.user {
    align-self: flex-end; background: ${color}; color: white;
    border-bottom-right-radius: 4px;
  }
  .msg.assistant {
    align-self: flex-start; background: #f4f4f5; color: #111827;
    border-bottom-left-radius: 4px;
  }
  .msg.assistant.streaming::after {
    content: '▋'; animation: blink 0.7s step-end infinite;
  }
  @keyframes blink { 50% { opacity: 0; } }

  .action-pill {
    align-self: flex-start; display: flex; align-items: center; gap: 7px;
    font-size: 12.5px; color: #6d28d9; background: #f5f3ff;
    padding: 6px 12px; border-radius: 20px; border: 1px solid #ede9fe;
    animation: fadeUp 0.18s ease;
  }
  .action-pill .spinner {
    width: 12px; height: 12px; border: 2px solid #ddd6fe;
    border-top-color: #7c3aed; border-radius: 50%;
    animation: spin 0.7s linear infinite; flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .confirmation {
    align-self: stretch;
    background: #fffbeb; border: 1px solid #fde68a;
    border-radius: 12px; padding: 14px 16px;
    font-size: 13.5px; color: #92400e;
    animation: fadeUp 0.18s ease;
  }
  .confirmation .conf-label { font-weight: 700; margin-bottom: 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  .confirmation .conf-msg { margin-bottom: 12px; line-height: 1.5; }
  .confirmation .actions { display: flex; gap: 8px; }
  .confirmation button {
    flex: 1; padding: 8px 12px; border-radius: 8px;
    font-size: 13px; font-weight: 600; cursor: pointer; border: none;
    transition: opacity 0.15s;
  }
  .confirmation button:hover { opacity: 0.85; }
  .confirm-yes { background: #dc2626; color: white; }
  .confirm-no { background: #e5e7eb; color: #374151; }

  #input-area {
    padding: 10px 12px 14px; border-top: 1px solid #f3f4f6;
    display: flex; gap: 8px; align-items: flex-end; flex-shrink: 0;
  }
  #input {
    flex: 1; border: 1.5px solid #e5e7eb; border-radius: 12px;
    padding: 10px 14px; font-size: 14px; font-family: inherit;
    resize: none; max-height: 120px; min-height: 42px;
    outline: none; line-height: 1.4; color: #111827;
    transition: border-color 0.15s; background: #fafafa;
  }
  #input:focus { border-color: ${color}; background: white; }
  #input::placeholder { color: #9ca3af; }
  #send-btn {
    width: 42px; height: 42px; border-radius: 12px;
    background: ${color}; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: opacity 0.15s, transform 0.15s;
  }
  #send-btn:hover:not(:disabled) { transform: scale(1.06); }
  #send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  #send-btn svg { width: 18px; height: 18px; fill: white; }

  .empty-state {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    color: #9ca3af; font-size: 14px; text-align: center;
    gap: 8px; padding: 24px;
  }
  .empty-icon {
    width: 52px; height: 52px; background: #f4f4f5; border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; margin-bottom: 4px;
  }
  .empty-title { font-weight: 600; color: #374151; font-size: 15px; }
  .suggestions { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; width: 100%; }
  .suggestion {
    background: white; border: 1px solid #e5e7eb; border-radius: 10px;
    padding: 9px 14px; font-size: 13px; color: #374151; cursor: pointer;
    text-align: left; font-family: inherit; transition: border-color 0.15s;
  }
  .suggestion:hover { border-color: ${color}; }
`

export function createWidget(config: WidgetConfig): Widget {
  const host = document.createElement('div')
  host.id = 'ai-agent-host'
  const shadow = host.attachShadow({ mode: 'closed' })
  document.body.appendChild(host)

  shadow.innerHTML = `
    <style>${CSS(config.agentColor)}</style>

    <button id="launcher" aria-label="Open chat">
      <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
    </button>

    <div id="window" class="hidden">
      <div id="header">
        <div class="avatar">✨</div>
        <div class="info">
          <div class="name">${config.agentName}</div>
          <div class="status" id="status-row">
            <div class="status-dot offline" id="status-dot"></div>
            <span id="status-text">Connecting...</span>
          </div>
        </div>
        <button id="close-btn" aria-label="Close">×</button>
      </div>

      <div id="messages">
        <div class="empty-state">
          <div class="empty-icon">✨</div>
          <div class="empty-title">Hi! I'm ${config.agentName}</div>
          <div>Ask me anything or tell me what to do on this page.</div>
          <div class="suggestions">
            <button class="suggestion">What can you help me with?</button>
            <button class="suggestion">Take me to account settings</button>
          </div>
        </div>
      </div>

      <div id="input-area">
        <textarea id="input" placeholder="Ask anything or give me a task..." rows="1"></textarea>
        <button id="send-btn" disabled aria-label="Send">
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>
  `

  const launcher = shadow.getElementById('launcher')!
  const win = shadow.getElementById('window')!
  const closeBtn = shadow.getElementById('close-btn')!
  const messagesEl = shadow.getElementById('messages')!
  const input = shadow.getElementById('input') as HTMLTextAreaElement
  const sendBtn = shadow.getElementById('send-btn') as HTMLButtonElement
  const statusText = shadow.getElementById('status-text')!
  const statusDot = shadow.getElementById('status-dot')!

  let open = false
  let currentAssistantEl: HTMLDivElement | null = null
  let emptyState = messagesEl.querySelector('.empty-state') as HTMLElement | null

  function toggleWindow() {
    open = !open
    win.classList.toggle('hidden', !open)
    launcher.classList.toggle('open', open)
    if (open) setTimeout(() => input.focus(), 50)
  }

  launcher.addEventListener('click', toggleWindow)
  closeBtn.addEventListener('click', toggleWindow)

  // Suggestion chips
  messagesEl.querySelectorAll('.suggestion').forEach((btn) => {
    btn.addEventListener('click', () => {
      const text = (btn as HTMLElement).textContent?.trim()
      if (text) config.onMessage(text)
    })
  })

  input.addEventListener('input', () => {
    input.style.height = 'auto'
    input.style.height = Math.min(input.scrollHeight, 120) + 'px'
  })

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  })

  sendBtn.addEventListener('click', sendMessage)

  function sendMessage() {
    const text = input.value.trim()
    if (!text || sendBtn.disabled) return
    input.value = ''
    input.style.height = 'auto'
    config.onMessage(text)
  }

  function clearEmptyState() {
    if (emptyState) { emptyState.remove(); emptyState = null }
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight
  }

  return {
    appendUserMessage(text) {
      clearEmptyState()
      const el = document.createElement('div')
      el.className = 'msg user'
      el.textContent = text
      messagesEl.appendChild(el)
      scrollToBottom()
    },

    appendAssistantChunk(chunk) {
      clearEmptyState()
      if (!currentAssistantEl) {
        currentAssistantEl = document.createElement('div')
        currentAssistantEl.className = 'msg assistant streaming'
        messagesEl.appendChild(currentAssistantEl)
      }
      currentAssistantEl.textContent = (currentAssistantEl.textContent || '') + chunk
      scrollToBottom()
    },

    finalizeAssistantMessage() {
      if (currentAssistantEl) {
        currentAssistantEl.classList.remove('streaming')
        currentAssistantEl = null
      }
    },

    showActionIndicator(label) {
      shadow.getElementById('action-indicator')?.remove()
      const el = document.createElement('div')
      el.id = 'action-indicator'
      el.className = 'action-pill'
      el.innerHTML = `<div class="spinner"></div><span>${label}</span>`
      messagesEl.appendChild(el)
      scrollToBottom()
    },

    hideActionIndicator() {
      shadow.getElementById('action-indicator')?.remove()
    },

    showConfirmation(message, onConfirm, onCancel) {
      clearEmptyState()
      const el = document.createElement('div')
      el.className = 'confirmation'
      el.innerHTML = `
        <div class="conf-label">⚠️ Confirm action</div>
        <div class="conf-msg">${message}</div>
        <div class="actions">
          <button class="confirm-no">Cancel</button>
          <button class="confirm-yes">Yes, continue</button>
        </div>
      `
      el.querySelector('.confirm-yes')!.addEventListener('click', () => { el.remove(); onConfirm() })
      el.querySelector('.confirm-no')!.addEventListener('click', () => { el.remove(); onCancel() })
      messagesEl.appendChild(el)
      scrollToBottom()
    },

    setStatus(status) {
      sendBtn.disabled = status !== 'connected'
      const isError = status === 'error'
      const isConnected = status === 'connected'
      statusDot.className = 'status-dot' + (isConnected ? '' : ' offline')
      statusText.textContent = isConnected ? 'Online · ready' : isError ? 'Connection error' : 'Connecting...'
    },
  }
}
