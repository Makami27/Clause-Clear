"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Upload, FileText, ChevronRight } from "lucide-react";
import { listContracts, uploadContract, ContractSummary } from "@/lib/api";

const RISK_STYLES: Record<string, string> = {
  LOW: "text-clear bg-clear-dim/20",
  MEDIUM: "text-highlight bg-highlight-dim/20",
  HIGH: "text-redline bg-redline-dim/20",
  CRITICAL: "text-redline bg-redline-dim/30",
};

export default function DashboardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!localStorage.getItem("cc_token")) {
      router.push("/login");
      return;
    }
    refresh();
  }, []);

  async function refresh() {
    try {
      setContracts(await listContracts());
    } catch {
      setError("Couldn't load your contracts.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const contract = await uploadContract(file);
      router.push(`/contract/${contract.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Upload failed. Try a different file.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <main className="min-h-screen bg-ink-900 px-6 py-10 md:px-12">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl text-paper-100">Your contracts</h1>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-full bg-highlight px-5 py-2.5 text-sm font-medium text-ink-950 hover:bg-highlight/90 transition-colors disabled:opacity-50"
          >
            <Upload size={16} />
            {uploading ? "Uploading…" : "Upload contract"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={handleUpload}
          />
        </div>

        {error && <p className="mt-4 text-sm text-redline">{error}</p>}

        <div className="mt-8">
          {loading ? (
            <p className="text-paper-400">Loading…</p>
          ) : contracts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-ink-700 p-12 text-center">
              <FileText size={28} className="mx-auto text-paper-400" />
              <p className="mt-3 text-paper-200">No contracts yet</p>
              <p className="mt-1 text-sm text-paper-400">Upload one to see what's actually in it.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {contracts.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/contract/${c.id}`}
                    className="flex items-center justify-between rounded-lg border border-ink-700 bg-ink-800 px-5 py-4 hover:border-ink-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-paper-400" />
                      <span className="text-paper-100">{c.fileName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {c.overallRisk && (
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${RISK_STYLES[c.overallRisk]}`}>
                          {c.overallRisk}
                        </span>
                      )}
                      <span className="text-xs text-paper-400">{c.status}</span>
                      <ChevronRight size={16} className="text-paper-400" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
