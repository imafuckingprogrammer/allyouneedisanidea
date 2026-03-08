import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Zap, Brain, Shield, Globe, MessageSquare, Code2, ArrowRight, MousePointer2, Database } from 'lucide-react'

export default async function LandingPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-white text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-bold tracking-tight">AllYouNeedIsAnIdea</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/login">Get started free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pb-24 pt-20">
        {/* Subtle grid background */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#f3f4f6_1px,transparent_1px),linear-gradient(to_bottom,#f3f4f6_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_60%,transparent_100%)]" />
        {/* Indigo glow */}
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-64 w-[600px] rounded-full bg-primary/8 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <Badge variant="secondary" className="mb-5 gap-1.5 border border-primary/20 bg-primary/5 text-primary">
            <Sparkles className="h-3 w-3" />
            AI that actually does things
          </Badge>

          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-[64px] sm:leading-[1.1]">
            Add AI to any website<br />
            <span className="text-primary">in one script tag</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            A conversational agent that reads, navigates, and controls your website.
            It remembers your users, learns your content, and takes real actions —
            not just answers questions.
          </p>

          {/* Code block */}
          <div className="mx-auto mt-10 max-w-xl overflow-hidden rounded-xl border shadow-lg text-left">
            <div className="flex items-center gap-1.5 border-b bg-zinc-950 px-4 py-2.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
              <span className="ml-2 font-mono text-xs text-zinc-500">index.html</span>
            </div>
            <pre className="bg-zinc-950 p-5 text-[13px] leading-relaxed" style={{ fontFamily: "'Fira Code', 'Cascadia Code', monospace" }}>
              <span className="text-zinc-500">{'<!-- paste before </body> -->'}</span>{'\n'}
              <span className="text-blue-400">{'<script'}</span>{'\n'}
              {'  '}<span className="text-green-400">{'src'}</span><span className="text-zinc-400">{'="https://cdn.yourdomain.com/embed.js"'}</span>{'\n'}
              {'  '}<span className="text-green-400">{'data-site-id'}</span><span className="text-zinc-400">{'="your-site-id"'}</span>{'\n'}
              {'  '}<span className="text-green-400">{'defer'}</span><span className="text-blue-400">{'>'}</span>{'\n'}
              <span className="text-blue-400">{'</script>'}</span>
            </pre>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" asChild className="gap-2 px-7">
              <Link href="/login">
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Open dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* What it does */}
      <section className="border-t bg-gray-50/60 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Not a chatbot. An agent.</h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              It doesn't just reply with text. It clicks buttons, fills forms,
              navigates pages, and executes tasks — live, on your site.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <MousePointer2 className="h-5 w-5" />,
                title: 'Navigate & Control',
                desc: 'Clicks buttons, fills forms, scrolls, and navigates between pages. Works with React, Vue, and any SPA.',
              },
              {
                icon: <Brain className="h-5 w-5" />,
                title: 'Remembers Users',
                desc: 'Per-user memory persists across sessions. Preferences, past actions, names — it remembers.',
              },
              {
                icon: <Database className="h-5 w-5" />,
                title: 'Knows Your Content',
                desc: 'Upload docs, FAQs, and policies. The agent answers accurately from your knowledge base.',
              },
              {
                icon: <Shield className="h-5 w-5" />,
                title: 'Asks Before Acting',
                desc: 'Configurable confirmation for risky actions. Users approve before anything destructive happens.',
              },
              {
                icon: <Zap className="h-5 w-5" />,
                title: 'One Script Tag',
                desc: 'Zero backend work. Drop in one line of HTML and your whole site gets an AI copilot.',
              },
              {
                icon: <Code2 className="h-5 w-5" />,
                title: 'Fully Customizable',
                desc: 'Brand color, agent name, system prompt, allowed actions — all configurable per site from the dashboard.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {icon}
                </div>
                <h3 className="mb-1.5 font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo visual / How it works */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Up and running in minutes</h2>
            <p className="mt-3 text-muted-foreground">Three steps from nothing to AI-powered.</p>
          </div>

          <div className="relative grid gap-10 sm:grid-cols-3">
            {/* Connecting line */}
            <div className="pointer-events-none absolute left-[16.66%] right-[16.66%] top-5 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent sm:block" />

            {[
              {
                step: '01',
                title: 'Create your agent',
                desc: 'Set a name, brand color, and system prompt. Tell it who it is and what it can do on your site.',
              },
              {
                step: '02',
                title: 'Paste the script tag',
                desc: 'Copy the generated snippet from your dashboard. Paste it before </body>. Done.',
              },
              {
                step: '03',
                title: 'Watch it work',
                desc: 'Visitors chat with your agent. It answers, navigates, clicks, and remembers — in real time.',
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="relative flex flex-col items-center text-center sm:items-start sm:text-left">
                <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary/30 bg-white text-sm font-bold text-primary">
                  {step}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-gray-50/60 py-20">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <Sparkles className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Give your site a brain</h2>
          <p className="mt-3 mb-8 text-muted-foreground">
            No credit card required. Your first agent is free. Takes five minutes.
          </p>
          <Button size="lg" asChild className="gap-2 px-8 shadow-md shadow-primary/20">
            <Link href="/login">
              Get started free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">AllYouNeedIsAnIdea</span>
          </div>
          <span>AI Agent Platform</span>
        </div>
      </footer>
    </div>
  )
}
