import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { SettingsForm } from './SettingsForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SettingsPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: site } = await supabase
    .from('sites')
    .select('id, name, domain, agent_name, agent_color, system_prompt, allowed_domains, allowed_actions')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (!site) notFound()

  return <SettingsForm siteId={id} site={site} />
}
