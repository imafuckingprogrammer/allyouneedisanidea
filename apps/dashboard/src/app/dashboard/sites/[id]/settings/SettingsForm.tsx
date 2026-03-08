'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Site {
  id: string
  name: string
  domain: string
  agent_name: string
  agent_color: string
  system_prompt: string
  allowed_domains: string[]
  allowed_actions: string[]
}

interface Props {
  siteId: string
  site: Site
}

const ACTION_OPTIONS = [
  { key: 'navigate', label: 'Navigate between pages', description: 'Agent can go to different URLs on your site' },
  { key: 'click', label: 'Click buttons & links', description: 'Agent can click interactive elements' },
  { key: 'fill', label: 'Fill forms', description: 'Agent can type into inputs and text areas' },
  { key: 'scroll', label: 'Scroll the page', description: 'Agent can scroll to elements or positions' },
  { key: 'extract', label: 'Read page content', description: 'Agent can read text from the page (always recommended)' },
]

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
    new Set(site.allowed_actions || ['navigate', 'click', 'fill', 'scroll', 'extract'])
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setSaved(false)
  }

  function toggleAction(key: string) {
    setAllowedActions((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
    setSaved(false)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch(`/api/sites/${siteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          allowed_domains: form.allowed_domains
            .split(',')
            .map((d) => d.trim())
            .filter(Boolean),
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
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Settings</h2>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' }}>
          Configure your agent's identity, behaviour, and permissions.
        </p>
      </div>

      <form onSubmit={save}>
        {/* Identity */}
        <Card title="Identity">
          <Field label="Site Name" hint="Internal label for your reference.">
            <input value={form.name} onChange={(e) => update('name', e.target.value)} style={inputStyle} required />
          </Field>
          <Field label="Domain" hint="Primary domain where the agent is installed.">
            <input value={form.domain} onChange={(e) => update('domain', e.target.value)} style={inputStyle} placeholder="myapp.com" required />
          </Field>
          <Field label="Additional Allowed Domains" hint="Comma-separated. Agent can navigate to these too.">
            <input value={form.allowed_domains} onChange={(e) => update('allowed_domains', e.target.value)} style={inputStyle} placeholder="app.myapp.com, docs.myapp.com" />
          </Field>
        </Card>

        {/* Appearance */}
        <Card title="Appearance">
          <Field label="Agent Name" hint="Displayed in the chat widget header.">
            <input value={form.agent_name} onChange={(e) => update('agent_name', e.target.value)} style={inputStyle} required />
          </Field>
          <Field label="Brand Color" hint="Used for the launcher button and message bubbles.">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="color"
                value={form.agent_color}
                onChange={(e) => update('agent_color', e.target.value)}
                style={{ width: 48, height: 40, border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', padding: 2 }}
              />
              <input
                value={form.agent_color}
                onChange={(e) => update('agent_color', e.target.value)}
                style={{ ...inputStyle, width: 120 }}
                placeholder="#6366f1"
              />
              {/* Color presets */}
              <div style={{ display: 'flex', gap: 6 }}>
                {['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => update('agent_color', c)}
                    style={{
                      width: 24, height: 24, borderRadius: '50%', background: c,
                      border: form.agent_color === c ? '2px solid #111827' : '2px solid transparent',
                      cursor: 'pointer', padding: 0,
                    }}
                  />
                ))}
              </div>
            </div>
          </Field>
        </Card>

        {/* Behaviour */}
        <Card title="Agent Instructions">
          <Field label="System Prompt" hint="The agent's persona and rules. Tell it what it can do, what tone to use, any restrictions.">
            <textarea
              value={form.system_prompt}
              onChange={(e) => update('system_prompt', e.target.value)}
              rows={8}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            />
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9ca3af' }}>
              {form.system_prompt.length} chars · ~{Math.ceil(form.system_prompt.length / 4)} tokens
            </p>
          </Field>
        </Card>

        {/* Allowed actions */}
        <Card title="Allowed Actions">
          <p style={{ margin: '0 0 16px', fontSize: 14, color: '#6b7280' }}>
            Control what the agent is permitted to do on your site. Disabling an action means the agent won't attempt it even if asked.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {ACTION_OPTIONS.map((opt) => {
              const enabled = allowedActions.has(opt.key)
              return (
                <label
                  key={opt.key}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 16px', borderRadius: 8, cursor: 'pointer',
                    background: enabled ? '#f5f3ff' : '#f9fafb',
                    border: `1px solid ${enabled ? '#ede9fe' : '#e5e7eb'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => toggleAction(opt.key)}
                    style={{ width: 16, height: 16, accentColor: '#6366f1', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>{opt.description}</div>
                  </div>
                </label>
              )
            })}
          </div>
        </Card>

        {/* Save */}
        {error && <p style={{ color: '#dc2626', fontSize: 13, margin: '-8px 0 16px' }}>{error}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 40 }}>
          <button type="submit" disabled={saving} style={{
            padding: '10px 24px', background: saved ? '#10b981' : '#6366f1',
            color: 'white', border: 'none', borderRadius: 8,
            fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s',
          }}>
            {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Danger zone */}
      <div style={{
        border: '1px solid #fca5a5', borderRadius: 12,
        padding: '20px 24px', background: '#fff5f5',
      }}>
        <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600, color: '#991b1b' }}>
          Danger Zone
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 14, color: '#b91c1c' }}>
          Deleting this site removes all conversations, memories, knowledge, and logs. This cannot be undone.
        </p>
        <button
          onClick={deleteSite}
          disabled={deleting}
          style={{
            padding: '9px 18px', background: '#dc2626', color: 'white',
            border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          {deleting ? 'Deleting...' : 'Delete this site'}
        </button>
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'white', border: '1px solid #e5e7eb', borderRadius: 12,
      padding: '24px', marginBottom: 20,
    }}>
      <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 600 }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
        {label}
      </label>
      <p style={{ margin: '0 0 6px', fontSize: 12, color: '#9ca3af' }}>{hint}</p>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb',
  borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit',
  boxSizing: 'border-box', color: '#111827',
}
