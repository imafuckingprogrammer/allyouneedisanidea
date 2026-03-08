'use client'
import { useState } from 'react'

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
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Knowledge Base</h2>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' }}>
            Paste in anything your agent should know — FAQs, pricing, policies, how-tos.
            The agent searches this before every response.
          </p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} style={primaryBtn}>
            + Add Entry
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{
          background: 'white', border: '2px solid #6366f1', borderRadius: 12,
          padding: 24, marginBottom: 24,
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>New Knowledge Entry</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={labelStyle}>Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cancellation Policy"
                style={inputStyle}
                autoFocus
              />
            </div>
            <div>
              <label style={labelStyle}>Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste the text the agent should know. Be as detailed as you like — exact steps, links, edge cases, etc."
                rows={8}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              />
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9ca3af' }}>
                {content.length} chars · ~{Math.ceil(content.length / 4)} tokens
              </p>
            </div>
            {error && <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowForm(false); setError(''); setTitle(''); setContent('') }}
                style={ghostBtn}
              >
                Cancel
              </button>
              <button onClick={addEntry} disabled={saving} style={primaryBtn}>
                {saving ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {entries.length === 0 && !showForm && (
        <div style={{
          background: 'white', border: '2px dashed #e5e7eb', borderRadius: 12,
          padding: '48px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📚</div>
          <p style={{ fontWeight: 600, fontSize: 16, margin: '0 0 6px' }}>No knowledge yet</p>
          <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 20px' }}>
            Add your first entry so the agent can answer questions about your site.
          </p>
          <button onClick={() => setShowForm(true)} style={primaryBtn}>
            Add your first entry
          </button>
        </div>
      )}

      {/* Entries list */}
      {entries.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {entries.map((entry) => {
            const isExpanded = expandedId === entry.id
            const preview = entry.content.slice(0, 160) + (entry.content.length > 160 ? '...' : '')
            return (
              <div
                key={entry.id}
                style={{
                  background: 'white', border: '1px solid #e5e7eb', borderRadius: 12,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '16px 20px', cursor: 'pointer',
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', marginBottom: 4 }}>
                      {entry.title}
                    </div>
                    {!isExpanded && (
                      <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
                        {preview}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>
                      {Math.ceil(entry.content.length / 4)} tokens
                    </span>
                    <span style={{ fontSize: 18, color: '#9ca3af', lineHeight: 1 }}>
                      {isExpanded ? '↑' : '↓'}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ borderTop: '1px solid #f3f4f6', padding: '0 20px 16px' }}>
                    <pre style={{
                      margin: '16px 0 16px', fontFamily: 'inherit', fontSize: 13,
                      lineHeight: 1.7, color: '#374151', whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word', background: '#f9fafb',
                      padding: '12px 16px', borderRadius: 8,
                    }}>
                      {entry.content}
                    </pre>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id) }}
                        disabled={deletingId === entry.id}
                        style={dangerBtn}
                      >
                        {deletingId === entry.id ? 'Deleting...' : 'Delete entry'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          <button
            onClick={() => setShowForm(true)}
            style={{ ...ghostBtn, alignSelf: 'flex-start', marginTop: 4 }}
          >
            + Add another entry
          </button>
        </div>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 500,
  color: '#374151', marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb',
  borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit',
  boxSizing: 'border-box', color: '#111827',
}

const primaryBtn: React.CSSProperties = {
  padding: '9px 18px', background: '#6366f1', color: 'white',
  border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
  cursor: 'pointer', whiteSpace: 'nowrap',
}

const ghostBtn: React.CSSProperties = {
  padding: '9px 18px', background: '#f3f4f6', color: '#374151',
  border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500,
  cursor: 'pointer',
}

const dangerBtn: React.CSSProperties = {
  padding: '7px 14px', background: 'none', color: '#dc2626',
  border: '1px solid #fca5a5', borderRadius: 7, fontSize: 13,
  fontWeight: 500, cursor: 'pointer',
}
