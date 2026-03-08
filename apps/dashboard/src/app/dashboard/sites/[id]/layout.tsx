import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SiteTabs } from '@/components/SiteTabs'
import { Sparkles, ArrowLeft } from 'lucide-react'

interface Props {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default async function SiteLayout({ children, params }: Props) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: site } = await supabase
    .from('sites')
    .select('id, name, domain, agent_name, agent_color')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (!site) notFound()

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          {/* Nav row */}
          <div className="flex h-14 items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">All Agents</span>
              </Link>
            </Button>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base"
                style={{ background: site.agent_color }}
              >
                ✨
              </div>
              <div className="min-w-0">
                <span className="font-semibold text-sm truncate">{site.name}</span>
                <span className="hidden sm:inline text-muted-foreground text-xs ml-2">{site.domain}</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <SiteTabs siteId={id} />
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  )
}
