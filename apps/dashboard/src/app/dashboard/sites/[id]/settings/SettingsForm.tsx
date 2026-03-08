'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Check } from 'lucide-react'

interface Site {
  id: string; name: string; domain: string; agent_name: string
  agent_color: string; system_prompt: string
  allowed_domains: string[]; allowed_actions: string[]
}
interface Props { siteId: string; site: Site }

const ACTION_OPTIONS = [
  { key: 'navigate', label: 'Navigate between pages', description: 'Agent can go to different URLs on your site' },
  { key: 'click',    label: 'Click buttons & links',  description: 'Agent can click interactive elements' },
  { key: 'fill',     label: 'Fill forms',              description: 'Agent can type into inputs and text areas' },
  { key: 'scroll',   label: 'Scroll the page',         description: 'Agent can scroll to elements or positions' },
  { key: 'extract',  label: 'Read page content',       description: 'Agent can read text from the page (always recommended)' },
]

const COLOR_PRESETS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

export function SettingsForm({ siteId, site }: Props) {
  const [form, setForm] = useState({
    name: site.name,
    domain: site.domain,
    agent_name: site.agent_name,
    agent_color: site.agent_color,
    system_prompt: site.system_prompt,
    allowed_domains: (site.allowed_domains || []).join(', '),
  })
  const [allowedActions, setAllowedActions] = useState<Set<string>>(
    new Set(site.allowed_actions?.length ? site.allowed_actions : ['navigate','click','fill','scroll','extract'])
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  function update(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); setSaved(false) }
  function toggleAction(key: string) {
    setAllowedActions((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })
    setSaved(false)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(''); setSaved(false)
    try {
      const res = await fetch(`/api/sites/${siteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          allowed_domains: form.allowed_domains.split(',').map((d) => d.trim()).filter(Boolean),
          allowed_actions: Array.from(allowedActions),
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      setSaved(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function deleteSite() {
    if (!confirm('Delete this site and all its data? This cannot be undone.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/sites/${siteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      router.push('/dashboard')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete')
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">Configure your agent's identity, behaviour, and permissions.</p>
      </div>

      <form onSubmit={save} className="space-y-5">
        {/* Identity */}
        <Card>
          <CardHeader><CardTitle className="text-base">Identity</CardTitle><CardDescription>Basic info about where this agent lives.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Site Name" hint="Internal label — only visible in your dashboard.">
              <Input value={form.name} onChange={(e) => update('name', e.target.value)} required />
            </FormField>
            <FormField label="Domain" hint="Primary domain where the agent is installed.">
              <Input value={form.domain} onChange={(e) => update('domain', e.target.value)} placeholder="myapp.com" required />
            </FormField>
            <FormField label="Additional Allowed Domains" hint="Comma-separated. Agent can navigate to these too.">
              <Input value={form.allowed_domains} onChange={(e) => update('allowed_domains', e.target.value)} placeholder="app.myapp.com, docs.myapp.com" />
            </FormField>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader><CardTitle className="text-base">Appearance</CardTitle><CardDescription>How the chat widget looks to your users.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Agent Name" hint="Displayed in the chat widget header.">
              <Input value={form.agent_name} onChange={(e) => update('agent_name', e.target.value)} required />
            </FormField>
            <FormField label="Brand Color" hint="Used for the launcher button and message bubbles.">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input type="color" value={form.agent_color} onChange={(e) => update('agent_color', e.target.value)} className="h-10 w-12 cursor-pointer rounded-md border border-input p-1" />
                  <Input value={form.agent_color} onChange={(e) => update('agent_color', e.target.value)} className="w-32 font-mono text-sm" placeholder="#6366f1" />
                </div>
                <div className="flex gap-2">
                  {COLOR_PRESETS.map((c) => (
                    <button key={c} type="button" onClick={() => update('agent_color', c)} className="h-7 w-7 rounded-full ring-offset-2 transition-shadow" style={{ background: c, boxShadow: form.agent_color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : 'none' }} />
                  ))}
                </div>
              </div>
            </FormField>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader><CardTitle className="text-base">Agent Instructions</CardTitle><CardDescription>The agent's persona, tone, and rules.</CardDescription></CardHeader>
          <CardContent>
            <Textarea value={form.system_prompt} onChange={(e) => update('system_prompt', e.target.value)} rows={8} className="resize-y" />
            <p className="mt-1.5 text-xs text-muted-foreground">{form.system_prompt.length} chars · ~{Math.ceil(form.system_prompt.length / 4)} tokens</p>
          </CardContent>
        </Card>

        {/* Allowed actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Allowed Actions</CardTitle>
            <CardDescription>Control what the agent is permitted to do. Disabled actions won't be attempted even if asked.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {ACTION_OPTIONS.map((opt) => {
              const enabled = allowedActions.has(opt.key)
              return (
                <label key={opt.key} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors ${enabled ? 'border-primary/30 bg-primary/5' : 'border-border bg-background hover:bg-muted/50'}`}>
                  <Checkbox checked={enabled} onCheckedChange={() => toggleAction(opt.key)} className="mt-0.5" />
                  <div>
                    <p className="text-sm font-medium leading-none">{opt.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{opt.description}</p>
                  </div>
                </label>
              )
            })}
          </CardContent>
        </Card>

        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className={saved ? 'bg-emerald-600 hover:bg-emerald-600' : ''}>
            {saving ? 'Saving...' : saved ? <><Check className="h-4 w-4" />Saved</> : 'Save Changes'}
          </Button>
        </div>
      </form>

      {/* Danger zone */}
      <div>
        <Separator className="mb-6" />
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
            <CardDescription>Permanently delete this site and all its conversations, memories, and knowledge. This cannot be undone.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={deleteSite} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete this site'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function FormField({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <p className="text-xs text-muted-foreground">{hint}</p>
      {children}
    </div>
  )
}
