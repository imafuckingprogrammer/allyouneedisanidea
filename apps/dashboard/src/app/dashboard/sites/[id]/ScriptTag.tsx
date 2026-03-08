'use client'
import { useState } from 'react'

interface Props {
  siteId: string
  embedUrl: string
  agentServerUrl: string
}

export function ScriptTag({ siteId, embedUrl, agentServerUrl }: Props) {
  const [copied, setCopied] = useState(false)

  const scriptTag = `<script
  src="${embedUrl}"
  data-site-id="${siteId}"
  data-server="${agentServerUrl}"
  defer>
</script>`

  async function copy() {
    await navigator.clipboard.writeText(scriptTag)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ background: '#111827', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #1f2937' }}>
        <span style={{ color: '#9ca3af', fontSize: 12, fontFamily: 'monospace' }}>HTML</span>
        <button
          onClick={copy}
          style={{ background: copied ? '#065f46' : '#374151', color: copied ? '#6ee7b7' : '#d1d5db', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}
        >
          {copied ? '✓ Copied!' : 'Copy'}
        </button>
      </div>
      <pre style={{ margin: 0, padding: '16px', color: '#e2e8f0', fontSize: 13, lineHeight: 1.7, overflowX: 'auto', fontFamily: "'Fira Code', 'Cascadia Code', monospace" }}>
        {scriptTag}
      </pre>
    </div>
  )
}
