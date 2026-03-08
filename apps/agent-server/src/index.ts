import 'dotenv/config'
import { WebSocketServer, WebSocket } from 'ws'
import http from 'http'
import { handleUserMessage, type Session } from './agent'
import { getSite } from './db'

const PORT = parseInt(process.env.PORT || '8080')

const server = http.createServer((req, res) => {
  // Health check for Railway
  if (req.url === '/health') {
    res.writeHead(200)
    res.end('ok')
    return
  }
  res.writeHead(404)
  res.end()
})

const wss = new WebSocketServer({ server })

// Active sessions: socket → session data
const sessions = new Map<WebSocket, Session>()

wss.on('connection', async (ws, req) => {
  const params = new URLSearchParams(req.url?.split('?')[1] || '')
  const siteId = params.get('siteId')
  const userFingerprint = params.get('fp')

  if (!siteId || !userFingerprint) {
    ws.close(1008, 'Missing siteId or fp')
    return
  }

  // Load site config — reject unknown sites immediately
  const site = await getSite(siteId)
  if (!site) {
    ws.close(1008, 'Unknown site')
    return
  }

  // TODO: In prod, verify the request Origin header matches site.domain

  const session: Session = {
    siteId,
    userFingerprint,
    conversationId: null,
    pageContext: {},
    send: (msg) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg))
      }
    },
    pendingActionResolve: null,
    pendingConfirmResolve: null,
  }

  sessions.set(ws, session)

  // Send site config to embed — it creates the widget from this
  session.send({
    type: 'config',
    data: {
      agentName: site.agent_name,
      agentColor: site.agent_color,
    },
  })

  ws.on('message', async (raw) => {
    let msg: Record<string, unknown>
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      return
    }

    switch (msg.type) {
      case 'user_message': {
        const text = (msg.text as string)?.trim()
        if (!text) return
        // Run agent in background — don't await, let WebSocket stay responsive
        handleUserMessage(session, text).catch((err) => {
          console.error('[agent error]', err)
          session.send({ type: 'error', message: 'Something went wrong. Please try again.' })
        })
        break
      }

      case 'page_context': {
        session.pageContext = (msg.data as Record<string, unknown>) || {}
        break
      }

      case 'action_result': {
        // Embed script reports the result of a DOM action
        if (session.pendingActionResolve) {
          session.pendingActionResolve(msg.result)
        }
        break
      }

      case 'confirm_result': {
        // User confirmed or cancelled a destructive action
        if (session.pendingConfirmResolve) {
          session.pendingConfirmResolve(msg.confirmed as boolean)
        }
        break
      }
    }
  })

  ws.on('close', () => {
    sessions.delete(ws)
  })

  ws.on('error', (err) => {
    console.error('[ws error]', err.message)
  })
})

server.listen(PORT, () => {
  console.log(`Agent server running on port ${PORT}`)
})
