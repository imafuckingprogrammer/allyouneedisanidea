'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, Copy } from 'lucide-react'

interface Props {
  siteId: string
  embedUrl: string
  agentServerUrl: string
}

export function ScriptTag({ siteId, embedUrl, agentServerUrl }: Props) {
  const [copied, setCopied] = useState(false)

  const scriptTag = `<script\n  src="${embedUrl}"\n  data-site-id="${siteId}"\n  data-server="${agentServerUrl}"\n  defer>\n</script>`

  async function copy() {
    await navigator.clipboard.writeText(scriptTag)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
        <span className="font-mono text-xs text-zinc-400">HTML</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={copy}
          className={copied ? 'text-emerald-400 hover:text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-zinc-200" style={{ fontFamily: "'Fira Code', 'Cascadia Code', monospace" }}>
        {scriptTag}
      </pre>
    </div>
  )
}
