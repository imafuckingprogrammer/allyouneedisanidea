import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { KnowledgeManager } from './KnowledgeManager'

interface Props {
  params: Promise<{ id: string }>
}

export default async function KnowledgePage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify ownership
  const { data: site } = await supabase
    .from('sites')
    .select('id')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (!site) notFound()

  const { data: entries } = await supabase
    .from('site_knowledge')
    .select('id, title, content, created_at')
    .eq('site_id', id)
    .order('created_at', { ascending: false })

  return <KnowledgeManager siteId={id} initialEntries={entries || []} />
}
