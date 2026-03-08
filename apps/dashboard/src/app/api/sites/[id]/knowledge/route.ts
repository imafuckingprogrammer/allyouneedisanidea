import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

interface Params {
  params: Promise<{ id: string }>
}

// GET — list all knowledge entries for a site
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership
  const { data: site } = await supabase
    .from('sites').select('id').eq('id', id).eq('owner_id', user.id).single()
  if (!site) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data } = await supabase
    .from('site_knowledge')
    .select('id, title, content, created_at')
    .eq('site_id', id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ entries: data || [] })
}

// POST — add a new knowledge entry
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: site } = await supabase
    .from('sites').select('id').eq('id', id).eq('owner_id', user.id).single()
  if (!site) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { title, content } = body
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: 'title and content are required' }, { status: 400 })
  }

  const { data: entry, error } = await supabase
    .from('site_knowledge')
    .insert({ site_id: id, title: title.trim(), content: content.trim() })
    .select('id, title, content, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entry })
}
