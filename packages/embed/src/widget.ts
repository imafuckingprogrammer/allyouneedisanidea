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
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.2s ease;
  }
  #launcher:hover { transform: scale(1.08); }
  #launcher svg { width: 26px; height: 26px; fill: white; }

  #window {
    position: fixed; bottom: 92px; right: 24px; z-index: 2147483647;
    width: 370px; height: 560px; border-radius: 16px;
    background: #ffffff; box-shadow: 0 8px 40px rgba(0,0,0,0.18);
    display: flex; flex-direction: column; overflow: hidden;
    transform-origin: bottom right;
    transition: transform 0.2s ease, opacity 0.2s ease;
  }
  #window.hidden { transform: scale(0.9); opacity: 0; pointer-events: none; }

  #header {
    padding: 16px 20px; background: ${color};
    display: flex; align-items: center; gap: 10px;
  }
  #header .avatar {
    width: 34px; height: 34px; border-radius: 50%;
    background: rgba(255,255,255,0.25);
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
  }
  #header .info { flex: 1; }
  #header .name { color: white; font-weight: 600; font-size: 15px; }
  #header .status { color: rgba(255,255,255,0.75); font-size: 12px; margin-top: 1px; }
  #header .status.error { color: #fca5a5; }
  #close-btn {
    background: none; border: none; cursor: pointer;
    color: rgba(255,255,255,0.8); font-size: 22px; line-height: 1;
    padding: 2px 6px;
  }
  #close-btn:hover { color: white; }

  #messages {
    flex: 1; overflow-y: auto; padding: 16px;
    display: flex; flex-direction: column; gap: 10px;
    scroll-behavior: smooth;
  }
  #messages::-webkit-scrollbar { width: 4px; }
  #messages::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }

  .msg { max-width: 85%; padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.5; word-break: break-word; }
  .msg.user { align-self: flex-end; background: ${color}; color: white; border-bottom-right-radius: 4px; }
  .msg.assistant { align-self: flex-start; background: #f3f4f6; color: #111827; border-bottom-left-radius: 4px; }
  .msg.assistant.streaming::after { content: '▋'; animation: blink 0.7s step-end infinite; }
  @keyframes blink { 50% { opacity: 0; } }

  .action-indicator {
    align-self: flex-start; display: flex; align-items: center; gap: 6px;
    font-size: 13px; color: #6b7280; background: #f9fafb;
    padding: 8px 12px; border-radius: 10px; border: 1px solid #e5e7eb;
  }
  .action-indicator .spinner {
    width: 14px; height: 14px; border: 2px solid #d1d5db;
    border-top-color: ${color}; border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .confirmation {
    background: #fefce8; border: 1px solid #fde68a;
    border-radius: 10px; padding: 12px 14px;
    font-size: 13px; color: #92400e;
  }
  .confirmation .msg-text { margin-bottom: 10px; line-height: 1.4; }
  .confirmation .actions { display: flex; gap: 8px; }
  .confirmation button {
    flex: 1; padding: 7px 12px; border-radius: 7px;
    font-size: 13px; font-weight: 500; cursor: pointer; border: none;
  }
  .confirm-yes { background: #dc2626; color: white; }
  .confirm-yes:hover { background: #b91c1c; }
  .confirm-no { background: #e5e7eb; color: #374151; }
  .confirm-no:hover { background: #d1d5db; }

  #input-area {
    padding: 12px 16px; border-top: 1px solid #f3f4f6;
    display: flex; gap: 8px; align-items: flex-end;
  }
  #input {
    flex: 1; border: 1px solid #e5e7eb; border-radius: 10px;
    padding: 10px 14px; font-size: 14px; font-family: inherit;
    resize: none; max-height: 120px; min-height: 42px;
    outline: none; line-height: 1.4; color: #111827;
  }
  #input:focus { border-color: ${color}; }
  #send-btn {
    width: 40px; height: 40px; border-radius: 10px;
    background: ${color}; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: opacity 0.15s;
  }
  #send-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  #send-btn svg { width: 18px; height: 18px; fill: white; }

  .empty-state {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    color: #9ca3af; font-size: 14px; text-align: center; gap: 8px; padding: 20px;
  }
  .empty-state svg { width: 40px; height: 40px; fill: #e5e7eb; }
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
          <div class="status" id="status-text">Connecting...</div>
        </div>
        <button id="close-btn" aria-label="Close">×</button>
      </div>

      <div id="messages">
        <div class="empty-state">
          <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
          <span>Ask me anything or tell me what to do on this page.</span>
        </div>
      </div>

      <div id="input-area">
        <textarea id="input" placeholder="Ask me anything..." rows="1"></textarea>
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

  let open = false
  let currentAssistantEl: HTMLDivElement | null = null
  let emptyState = messagesEl.querySelector('.empty-state') as HTMLElement | null

  function toggleWindow() {
    open = !open
    win.classList.toggle('hidden', !open)
    if (open) input.focus()
  }

  launcher.addEventListener('click', toggleWindow)
  closeBtn.addEventListener('click', toggleWindow)

  input.addEventListener('input', () => {
    // Auto-resize textarea
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
    if (!text) return
    input.value = ''
    input.style.height = 'auto'
    config.onMessage(text)
  }

  function clearEmptyState() {
    if (emptyState) {
      emptyState.remove()
      emptyState = null
    }
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
      // Remove any existing indicator
      shadow.getElementById('action-indicator')?.remove()
      const el = document.createElement('div')
      el.id = 'action-indicator'
      el.className = 'action-indicator'
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
        <div class="msg-text">⚠️ ${message}</div>
        <div class="actions">
          <button class="confirm-yes">Yes, do it</button>
          <button class="confirm-no">Cancel</button>
        </div>
      `
      el.querySelector('.confirm-yes')!.addEventListener('click', () => {
        el.remove()
        onConfirm()
      })
      el.querySelector('.confirm-no')!.addEventListener('click', () => {
        el.remove()
        onCancel()
      })
      messagesEl.appendChild(el)
      scrollToBottom()
    },

    setStatus(status) {
      sendBtn.disabled = status !== 'connected'
      statusText.className = 'status' + (status === 'error' ? ' error' : '')
      statusText.textContent =
        status === 'connected' ? 'Online' :
        status === 'connecting' ? 'Connecting...' :
        'Connection error'
    },
  }
}
