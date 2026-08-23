import Link from "next/link";
import { ArrowRight, FileText, MessageSquare, ShieldAlert } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-ink-900">
      <nav className="flex items-center justify-between px-6 py-6 md:px-12">
        <span className="font-display text-xl italic text-paper-100">ClauseClear</span>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm text-paper-400 hover:text-paper-100 transition-colors">
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-highlight px-4 py-2 text-sm font-medium text-ink-950 hover:bg-highlight/90 transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero — the thesis is the annotated clause itself, not a claim about it */}
      <section className="mx-auto max-w-4xl px-6 pb-24 pt-12 md:pt-20 text-center">
        <h1 className="font-display text-4xl md:text-6xl leading-[1.1] text-paper-100">
          Know what you're
          <br />
          <span className="italic">actually</span> signing.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-paper-400">
          Upload any contract. ClauseClear reads it like a lawyer would — and explains it like a friend would.
        </p>
        <Link
          href="/register"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-highlight px-6 py-3 font-medium text-ink-950 hover:bg-highlight/90 transition-colors"
        >
          Analyze your first contract free
          <ArrowRight size={18} />
        </Link>

        {/* Live demonstration of the product's core act: marking a risky clause */}
        <div className="mt-16 rounded-2xl border border-ink-700 bg-ink-800 p-8 text-left">
          <p className="mb-4 text-xs uppercase tracking-wider text-paper-400">From a real termination clause</p>
          <p className="font-display text-lg leading-relaxed text-paper-200">
            "Either party may terminate this Agreement{" "}
            <span className="clause-mark-critical">without cause upon thirty (30) days' written notice, provided that Client shall remain liable for all Services rendered through the termination date plus a early-termination fee equal to fifty percent (50%) of the remaining Contract Value</span>
            ."
          </p>
          <div className="mt-6 flex items-start gap-3 rounded-lg bg-redline-dim/20 p-4">
            <ShieldAlert size={20} className="mt-0.5 shrink-0 text-redline" />
            <div>
              <p className="text-sm font-medium text-paper-100">High risk — hidden exit cost</p>
              <p className="mt-1 text-sm text-paper-400">
                This clause sounds like an easy 30-day out — but you'd still owe half the remaining contract value even if you're the one who leaves. ClauseClear catches this before you sign, not after.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What it does — three concrete capabilities, not generic feature icons */}
      <section className="mx-auto max-w-5xl px-6 pb-24 grid gap-8 md:grid-cols-3">
        <Feature
          icon={<ShieldAlert size={22} className="text-highlight" />}
          title="Red flags, ranked"
          body="Every risky clause explained in plain English, with a concrete risk level and what to ask for instead."
        />
        <Feature
          icon={<FileText size={22} className="text-highlight" />}
          title="Plain-English summary"
          body="The whole contract, distilled — what you're agreeing to, what you owe, what you're owed."
        />
        <Feature
          icon={<MessageSquare size={22} className="text-highlight" />}
          title="Ask it anything"
          body="Chat with your contract directly. 'What happens if I miss a payment?' Get a straight answer, sourced from the actual text."
        />
      </section>

      <footer className="border-t border-ink-700 px-6 py-8 text-center text-sm text-paper-400">
        ClauseClear explains contracts. It does not provide legal advice.
      </footer>
    </main>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-ink-700 bg-ink-800 p-6">
      <div className="mb-3">{icon}</div>
      <h3 className="font-display text-lg text-paper-100">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-paper-400">{body}</p>
    </div>
  );
}
