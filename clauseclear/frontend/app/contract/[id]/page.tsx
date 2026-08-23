"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, Send, ArrowLeft, Loader2 } from "lucide-react";
import { getContract, analyzeContract, sendChatMessage } from "@/lib/api";

interface RedFlag {
  id: string;
  clauseText: string;
  issue: string;
  explanation: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  recommendation: string;
}

interface Contract {
  id: string;
  fileName: string;
  status: string;
  summary: string | null;
  overallRisk: string | null;
  redFlags: RedFlag[];
}

const RISK_STYLES: Record<string, string> = {
  LOW: "border-clear-dim text-clear",
  MEDIUM: "border-highlight-dim text-highlight",
  HIGH: "border-redline-dim text-redline",
  CRITICAL: "border-redline text-redline",
};

export default function ContractPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();

  useEffect(() => {
    if (!localStorage.getItem("cc_token")) {
      router.push("/login");
      return;
    }
    load();
  }, [id]);

  async function load() {
    const data = await getContract(id);
    setContract(data);
    if (data.status === "UPLOADED") {
      runAnalysis();
    }
  }

  async function runAnalysis() {
    setAnalyzing(true);
    try {
      await analyzeContract(id);
      const data = await getContract(id);
      setContract(data);
    } catch {
      // status will reflect FAILED from the backend; re-fetch to show it
      const data = await getContract(id);
      setContract(data);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleChatSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const question = chatInput;
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: question }]);
    setChatLoading(true);
    try {
      const { answer, sessionId: sid } = await sendChatMessage(id, question, sessionId);
      setSessionId(sid);
      setChatMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong answering that — try again." }]);
    } finally {
      setChatLoading(false);
    }
  }

  if (!contract) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink-900">
        <Loader2 className="animate-spin text-paper-400" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-ink-900 px-6 py-8 md:px-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-paper-400 hover:text-paper-100">
          <ArrowLeft size={14} /> Back to contracts
        </Link>

        <h1 className="mt-4 font-display text-2xl text-paper-100">{contract.fileName}</h1>

        {(analyzing || contract.status === "PROCESSING") && (
          <div className="mt-6 flex items-center gap-3 rounded-lg border border-ink-700 bg-ink-800 px-5 py-4">
            <Loader2 size={18} className="animate-spin text-highlight" />
            <span className="text-paper-200">Reading your contract…</span>
          </div>
        )}

        {contract.status === "FAILED" && (
          <div className="mt-6 rounded-lg border border-redline-dim bg-redline-dim/10 px-5 py-4">
            <p className="text-paper-100">Analysis failed.</p>
            <button onClick={runAnalysis} className="mt-2 text-sm text-highlight hover:underline">
              Try again
            </button>
          </div>
        )}

        {contract.summary && (
          <section className="mt-6 rounded-xl border border-ink-700 bg-ink-800 p-6">
            <p className="text-xs uppercase tracking-wider text-paper-400">Summary</p>
            <p className="mt-3 leading-relaxed text-paper-200">{contract.summary}</p>
          </section>
        )}

        {contract.redFlags?.length > 0 && (
          <section className="mt-6">
            <p className="mb-3 text-xs uppercase tracking-wider text-paper-400">
              Red flags ({contract.redFlags.length})
            </p>
            <div className="space-y-3">
              {contract.redFlags.map((flag) => (
                <div key={flag.id} className={`rounded-xl border bg-ink-800 p-5 ${RISK_STYLES[flag.riskLevel]}`}>
                  <div className="flex items-start gap-3">
                    <ShieldAlert size={18} className="mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-paper-100">{flag.issue}</p>
                        <span className="text-xs">{flag.riskLevel}</span>
                      </div>
                      <p className="mt-2 text-sm italic text-paper-400">"{flag.clauseText}"</p>
                      <p className="mt-2 text-sm text-paper-200">{flag.explanation}</p>
                      <p className="mt-2 text-sm text-paper-100">
                        <span className="text-paper-400">Recommendation: </span>
                        {flag.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {contract.status === "ANALYZED" && (
          <section className="mt-8">
            <p className="mb-3 text-xs uppercase tracking-wider text-paper-400">Ask about this contract</p>
            <div className="rounded-xl border border-ink-700 bg-ink-800 p-4">
              <div className="max-h-80 space-y-3 overflow-y-auto">
                {chatMessages.length === 0 && (
                  <p className="text-sm text-paper-400">
                    Try: "What happens if I miss a payment?" or "Can I cancel early?"
                  </p>
                )}
                {chatMessages.map((m, i) => (
                  <div
                    key={i}
                    className={`rounded-lg px-4 py-2.5 text-sm ${
                      m.role === "user" ? "ml-auto max-w-[80%] bg-ink-700 text-paper-100" : "max-w-[80%] text-paper-200"
                    }`}
                  >
                    {m.content}
                  </div>
                ))}
                {chatLoading && <Loader2 size={16} className="animate-spin text-paper-400" />}
              </div>
              <form onSubmit={handleChatSubmit} className="mt-3 flex gap-2 border-t border-ink-700 pt-3">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a question…"
                  className="flex-1 bg-transparent text-paper-100 placeholder:text-paper-400 focus:outline-none"
                />
                <button type="submit" disabled={chatLoading} className="text-highlight disabled:opacity-50">
                  <Send size={18} />
                </button>
              </form>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
