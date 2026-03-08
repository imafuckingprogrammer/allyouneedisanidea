'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trash2, ChevronDown, ChevronUp, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KnowledgeEntry {
  id: string
  title: string
  content: string
  created_at: string
}

interface Props {
  siteId: string
  initialEntries: KnowledgeEntry[]
}

export function KnowledgeManager({ siteId, initialEntries }: Props) {
  const [entries, setEntries] = useState<KnowledgeEntry[]>(initialEntries)
  const [showForm, setShowForm] = useState(initialEntries.length === 0)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  async function addEntry() {
    if (!title.trim() || !content.trim()) {
      setError('Both title and content are required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/sites/${siteId}/knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      })
      if (!res.ok) throw new Error(await res.text())
      const { entry } = await res.json()
      setEntries([entry, ...entries])
      setTitle('')
      setContent('')
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteEntry(entryId: string) {
    setDeletingId(entryId)
    try {
      await fetch(`/api/sites/${siteId}/knowledge/${entryId}`, { method: 'DELETE' })
      setEntries(entries.filter((e) => e.id !== entryId))
      if (expandedId === entryId) setExpandedId(null)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Knowledge Base</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste in anything your agent should know — FAQs, pricing, policies, how-tos.
            The agent searches this context before every response.
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="shrink-0">
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <Card className="border-primary/50 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">New Knowledge Entry</h3>
              <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setError(''); setTitle(''); setContent('') }}>
                Cancel
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry-title">Title</Label>
              <Input id="entry-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Cancellation Policy" autoFocus />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry-content">Content</Label>
              <Textarea
                id="entry-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste the text the agent should know. Be as detailed as you like — exact steps, links, edge cases, etc."
                rows={8}
                className="resize-y"
              />
              <p className="text-xs text-muted-foreground">{content.length} chars · ~{Math.ceil(content.length / 4)} tokens</p>
            </div>
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <div className="flex justify-end">
              <Button onClick={addEntry} disabled={saving}>
                {saving ? 'Saving...' : 'Save Entry'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {entries.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-background py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted mb-4">
            <BookOpen className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1">No knowledge yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Add your first entry so the agent can answer questions about your site.
          </p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Add your first entry
          </Button>
        </div>
      )}

      {/* Entries list */}
      {entries.length > 0 && (
        <div className="space-y-2">
          {entries.map((entry) => {
            const isExpanded = expandedId === entry.id
            return (
              <Card key={entry.id} className="overflow-hidden">
                <button
                  className="w-full text-left"
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                >
                  <div className="flex items-center gap-3 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{entry.title}</p>
                      {!isExpanded && (
                        <p className="mt-0.5 text-xs text-muted-foreground truncate">
                          {entry.content.slice(0, 120)}{entry.content.length > 120 ? '...' : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        ~{Math.ceil(entry.content.length / 4)} tokens
                      </span>
                      {isExpanded
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      }
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t">
                    <pre className="m-4 rounded-md bg-muted p-4 text-sm leading-relaxed whitespace-pre-wrap break-words font-sans">
                      {entry.content}
                    </pre>
                    <div className="flex justify-end px-5 pb-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deleteEntry(entry.id)}
                        disabled={deletingId === entry.id}
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletingId === entry.id ? 'Deleting...' : 'Delete entry'}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="mt-2">
            <Plus className="h-4 w-4" />
            Add another entry
          </Button>
        </div>
      )}
    </div>
  )
}
