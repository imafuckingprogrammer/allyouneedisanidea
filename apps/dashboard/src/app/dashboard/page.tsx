import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Sparkles, ArrowRight, Globe } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sites } = await supabase
    .from('sites')
    .select('id, name, domain, agent_name, agent_color, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Top nav */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-semibold text-sm">AllYouNeedIsAnIdea</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:block">{user.email}</span>
            <form action="/api/auth/signout" method="POST">
              <Button variant="ghost" size="sm" type="submit">Sign out</Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Page heading */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Your Agents</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {sites?.length ?? 0} agent{sites?.length !== 1 ? 's' : ''} configured
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/sites/new">
              <Plus className="h-4 w-4" />
              New Agent
            </Link>
          </Button>
        </div>

        {!sites || sites.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-background py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted mb-4">
              <Sparkles className="h-7 w-7 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-1">No agents yet</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Create your first agent and get a script tag to paste into any website.
            </p>
            <Button asChild>
              <Link href="/dashboard/sites/new">
                <Plus className="h-4 w-4" />
                Create your first agent
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {sites.map((site) => (
              <Link
                key={site.id}
                href={`/dashboard/sites/${site.id}`}
                className="group flex items-center gap-4 rounded-xl border bg-background p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/30"
              >
                {/* Avatar */}
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl shadow-sm"
                  style={{ background: site.agent_color }}
                >
                  ✨
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{site.name}</p>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Globe className="h-3 w-3" />
                    <span className="truncate">{site.domain}</span>
                    <span className="text-border">·</span>
                    <span>{site.agent_name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="secondary" className="hidden sm:flex">Active</Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
