import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

interface Params {
  params: Promise<{ id: string; entryId: string }>
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id, entryId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership through site
  const { data: site } = await supabase
    .from('sites').select('id').eq('id', id).eq('owner_id', user.id).single()
  if (!site) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error } = await supabase
    .from('site_knowledge')
    .delete()
    .eq('id', entryId)
    .eq('site_id', id) // extra safety — can't delete other sites' entries

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
