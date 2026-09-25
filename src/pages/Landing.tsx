import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MonoLabel, Panel, Status } from "@/components/shared";
import { ArrowRight, Braces, Check, CircleDot, LockKeyhole, Network } from "lucide-react";

const SHELL = "mx-auto w-full max-w-6xl px-4 md:px-8";

const MODULES = [
  { code: "01", title: "Sources", text: "Konten own-session dan Content Rewards Discover dinormalkan sebagai provenance, bukan sebagai angka spekulatif." },
  { code: "02", title: "Context", text: "Campaign, brief, economics, dan reference materials tetap dapat ditelusuri ke sumber masing-masing." },
  { code: "03", title: "Production", text: "Brief menjadi plan, shotlist, dan manifest 9:16. Tidak ada publish atau submit otomatis." },
  { code: "04", title: "Review", text: "Agent, connector, dan social handoff berhenti di boundary yang membutuhkan keputusan manusia." },
];

const COMMANDS = [
  ["$ source status", "Konten / Content Rewards / provider state"],
  ["$ campaign list", "Scanner dengan sorting dan provenance"],
  ["$ swarm configure", "OpenAI-compatible provider + role selection"],
  ["$ swarm run --review", "Transcript, memory, evaluation, skill proposal"],
  ["$ connector list", "Capability dan credential boundary"],
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className={`${SHELL} flex h-16 items-center justify-between gap-4`}>
          <Link to="/" className="flex items-center gap-3" aria-label="Super Clipper home">
            <span className="grid h-8 w-8 place-items-center border border-primary/40 bg-primary/10 font-mono text-xs text-primary">//</span>
            <span>
              <span className="block text-sm font-semibold tracking-tight">Super Clipper</span>
              <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">control plane</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#system" className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground">System</a>
            <a href="#boundary" className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground">Boundary</a>
          </nav>
          <Button asChild size="sm">
            <Link to="/app">Open control room <ArrowRight className="h-3.5 w-3.5" /></Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="border-b border-border">
          <div className={`${SHELL} grid gap-12 py-20 md:py-28 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center`}>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Status tone="good">source-backed</Status>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">marketplace clipping control plane</span>
              </div>
              <h1 className="mt-7 max-w-2xl text-4xl font-semibold leading-[1.04] tracking-[-0.05em] md:text-6xl">
                Keep the signal.
                <span className="block text-primary">Keep control.</span>
              </h1>
              <p className="mt-6 max-w-xl text-[15px] leading-7 text-muted-foreground">
                Super Clipper turns marketplace intelligence into an auditable production workflow: sources, briefs, plans, agents, and review gates in one terminal-style console.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg"><Link to="/app">Enter control room <ArrowRight className="h-4 w-4" /></Link></Button>
                <Button asChild variant="outline" size="lg"><a href="#system">Read the system <Braces className="h-4 w-4" /></a></Button>
              </div>
              <p className="mt-4 font-mono text-[11px] text-muted-foreground">no synthetic records · no automatic consequences</p>
            </div>

            <div className="min-w-0 border border-border bg-card/60">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <MonoLabel>super-clipper / operator console</MonoLabel>
                <Status tone="warn">awaiting source</Status>
              </div>
              <div className="divide-y divide-border/60 font-mono text-[11px]">
                {COMMANDS.map(([command, description]) => <div key={command} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"><span className="text-primary">{command}</span><span className="text-muted-foreground">{description}</span></div>)}
              </div>
              <div className="border-t border-border px-4 py-3 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">state is read from live connectors, never inferred</div>
            </div>
          </div>
        </section>

        <section id="system" className="scroll-mt-24 border-b border-border">
          <div className={`${SHELL} py-16 md:py-24`}>
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div><MonoLabel>system map</MonoLabel><h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">One control plane. Four explicit stages.</h2></div>
              <p className="max-w-md text-[13px] leading-6 text-muted-foreground">Each stage has a visible input, a bounded action, and a state that can be audited.</p>
            </div>
            <div className="mt-9 grid gap-px border border-border bg-border md:grid-cols-4">
              {MODULES.map((module) => <article key={module.code} className="bg-card p-5"><span className="font-mono text-[10px] text-primary">{module.code}</span><h3 className="mt-6 text-sm font-semibold">{module.title}</h3><p className="mt-2 text-[13px] leading-6 text-muted-foreground">{module.text}</p></article>)}
            </div>
          </div>
        </section>

        <section id="boundary" className="scroll-mt-24 border-b border-border">
          <div className={`${SHELL} grid gap-8 py-16 md:py-24 lg:grid-cols-2`}>
            <div><MonoLabel>execution boundary</MonoLabel><h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Automation stops where consequences begin.</h2><p className="mt-3 max-w-xl text-[13px] leading-6 text-muted-foreground">The system can prepare, compare, and recommend. It does not pretend that a model decision is marketplace approval.</p></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Panel title="Allowed" actions={<Status tone="good">read / prepare</Status>}><ul className="space-y-3 text-[13px] text-muted-foreground"><li className="flex gap-2"><Check className="h-4 w-4 text-primary" /> Read public discovery data</li><li className="flex gap-2"><Check className="h-4 w-4 text-primary" /> Normalize source-backed campaigns</li><li className="flex gap-2"><Check className="h-4 w-4 text-primary" /> Produce plans and evaluations</li><li className="flex gap-2"><Check className="h-4 w-4 text-primary" /> Keep provider keys scoped</li></ul></Panel>
              <Panel title="Gated" actions={<Status tone="warn">human review</Status>}><ul className="space-y-3 text-[13px] text-muted-foreground"><li className="flex gap-2"><LockKeyhole className="h-4 w-4 text-amber-300" /> Activate a new skill</li><li className="flex gap-2"><LockKeyhole className="h-4 w-4 text-amber-300" /> Publish or submit media</li><li className="flex gap-2"><LockKeyhole className="h-4 w-4 text-amber-300" /> Connect a write-capable API</li><li className="flex gap-2"><LockKeyhole className="h-4 w-4 text-amber-300" /> Spend or change credentials</li></ul></Panel>
            </div>
          </div>
        </section>

        <section>
          <div className={`${SHELL} py-16 md:py-24`}>
            <div className="border border-border bg-card/60 p-6 md:flex md:items-center md:justify-between md:gap-8 md:p-9">
              <div><div className="flex items-center gap-2"><Network className="h-4 w-4 text-primary" /><MonoLabel>open console</MonoLabel></div><h2 className="mt-3 text-2xl font-semibold tracking-tight">Read the real state first.</h2><p className="mt-2 max-w-xl text-[13px] leading-6 text-muted-foreground">The control room is public. Data appears only after a real source or local bridge writes it.</p></div>
              <div className="mt-6 flex flex-wrap gap-2 md:mt-0"><Button asChild><Link to="/app">Open control room <ArrowRight className="h-4 w-4" /></Link></Button><Button asChild variant="outline"><Link to="/app/swarm"><CircleDot className="h-4 w-4" /> Configure swarm</Link></Button></div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
