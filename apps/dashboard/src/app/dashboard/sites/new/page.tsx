'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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
      setError(err instanceof Error ? err.message : 'Failed to create site')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 620, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700 }}>Create Agent</h1>
      <p style={{ margin: '0 0 32px', color: '#6b7280', fontSize: 14 }}>
        Set up your AI agent. You'll get a script tag to paste into your website.
      </p>

      <form onSubmit={handleSubmit} style={{ background: 'white', borderRadius: 16, padding: 32, border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Field label="Site Name" hint="Internal name, e.g. 'My SaaS App'">
          <input value={form.name} onChange={(e) => update('name', e.target.value)} required style={inputStyle} placeholder="My App" />
        </Field>

        <Field label="Domain" hint="The domain where the agent will appear">
          <input value={form.domain} onChange={(e) => update('domain', e.target.value)} required style={inputStyle} placeholder="myapp.com" />
        </Field>

        <Field label="Agent Name" hint="Displayed in the chat widget header">
          <input value={form.agent_name} onChange={(e) => update('agent_name', e.target.value)} required style={inputStyle} placeholder="Assistant" />
        </Field>

        <Field label="Agent Color" hint="Brand color for the chat widget">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input type="color" value={form.agent_color} onChange={(e) => update('agent_color', e.target.value)} style={{ width: 48, height: 40, border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', padding: 2 }} />
            <span style={{ fontSize: 13, color: '#6b7280' }}>{form.agent_color}</span>
          </div>
        </Field>

        <Field label="System Prompt" hint="Instructions for the agent — its persona, what it knows, what it can and can't do">
          <textarea
            value={form.system_prompt}
            onChange={(e) => update('system_prompt', e.target.value)}
            rows={5}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
          />
        </Field>

        {error && <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => router.back()} style={{ ...btnStyle, background: '#f3f4f6', color: '#374151' }}>
            Cancel
          </button>
          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? 'Creating...' : 'Create Agent →'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{label}</label>
      <p style={{ margin: '0 0 8px', fontSize: 12, color: '#9ca3af' }}>{hint}</p>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb',
  borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const btnStyle: React.CSSProperties = {
  padding: '10px 20px', background: '#6366f1', color: 'white',
  border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
}
