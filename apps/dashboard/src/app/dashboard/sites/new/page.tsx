'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Sparkles } from 'lucide-react'

const COLOR_PRESETS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

export default function NewSitePage() {
  const [form, setForm] = useState({
    name: '',
    domain: '',
    agent_name: 'Assistant',
    agent_color: '#6366f1',
    system_prompt: 'You are a helpful assistant embedded in this website. You can control the page on behalf of the user. Always confirm before taking destructive actions.',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('sites')
        .insert({ ...form, owner_id: user.id })
        .select('id')
        .single()
      if (error) throw error
      router.push(`/dashboard/sites/${data.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4 sm:px-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard"><ArrowLeft className="h-4 w-4" />Back</Link>
          </Button>
          <div className="h-4 w-px bg-border" />
          <span className="text-sm font-medium">New Agent</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Create Agent</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set up your AI agent. You'll get a script tag to paste into any website.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Identity</CardTitle>
              <CardDescription>Basic info about where this agent lives.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Site Name</Label>
                <Input id="name" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="My SaaS App" required />
                <p className="text-xs text-muted-foreground">Internal label — only visible in your dashboard.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input id="domain" value={form.domain} onChange={(e) => update('domain', e.target.value)} placeholder="myapp.com" required />
                <p className="text-xs text-muted-foreground">The domain where the agent will appear.</p>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Appearance</CardTitle>
              <CardDescription>How the chat widget looks to your users.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agent_name">Agent Name</Label>
                <Input id="agent_name" value={form.agent_name} onChange={(e) => update('agent_name', e.target.value)} placeholder="Assistant" required />
              </div>
              <div className="space-y-2">
                <Label>Brand Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.agent_color}
                    onChange={(e) => update('agent_color', e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded-md border border-input p-1"
                  />
                  <div className="flex gap-1.5">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => update('agent_color', c)}
                        className="h-7 w-7 rounded-full ring-offset-2 transition-shadow"
                        style={{
                          background: c,
                          boxShadow: form.agent_color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : 'none',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Live preview */}
                <div className="mt-3 flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg" style={{ background: form.agent_color }}>✨</div>
                  <div>
                    <p className="text-sm font-medium">{form.agent_name || 'Assistant'}</p>
                    <p className="text-xs text-muted-foreground">Widget preview</p>
                  </div>
                  <div className="ml-auto h-10 w-10 rounded-full flex items-center justify-center text-white text-xl" style={{ background: form.agent_color }}>
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Behaviour */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Agent Instructions</CardTitle>
              <CardDescription>Define the agent's persona, tone, and capabilities.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={form.system_prompt}
                onChange={(e) => update('system_prompt', e.target.value)}
                rows={6}
                className="resize-y"
                placeholder="You are a helpful assistant..."
              />
              <p className="mt-1.5 text-xs text-muted-foreground">{form.system_prompt.length} chars · ~{Math.ceil(form.system_prompt.length / 4)} tokens</p>
            </CardContent>
          </Card>

          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Agent →'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
