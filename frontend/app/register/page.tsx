"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token } = await register(email, password, name || undefined);
      localStorage.setItem("cc_token", token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.error?.fieldErrors?.password?.[0] || err?.response?.data?.error || "Couldn't create your account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-900 px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display text-xl italic text-paper-100">
          ClauseClear
        </Link>
        <h1 className="mt-8 font-display text-2xl text-paper-100">Create your account</h1>
        <p className="mt-1 text-sm text-paper-400">3 free contract analyses a month, no card required.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm text-paper-400">Name (optional)</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-ink-700 bg-ink-800 px-4 py-2.5 text-paper-100 focus:border-highlight focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-paper-400">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-ink-700 bg-ink-800 px-4 py-2.5 text-paper-100 focus:border-highlight focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-paper-400">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-lg border border-ink-700 bg-ink-800 px-4 py-2.5 text-paper-100 focus:border-highlight focus:outline-none"
            />
          </label>

          {error && <p className="text-sm text-redline">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-highlight py-3 font-medium text-ink-950 hover:bg-highlight/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-paper-400">
          Already have an account?{" "}
          <Link href="/login" className="text-highlight hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
