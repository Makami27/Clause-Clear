"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token } = await login(email, password);
      localStorage.setItem("cc_token", token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Couldn't log in. Check your email and password.");
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
        <h1 className="mt-8 font-display text-2xl text-paper-100">Welcome back</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label="Email" type="email" value={email} onChange={setEmail} required />
          <Field label="Password" type="password" value={password} onChange={setPassword} required />

          {error && <p className="text-sm text-redline">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-highlight py-3 font-medium text-ink-950 hover:bg-highlight/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-paper-400">
          No account?{" "}
          <Link href="/register" className="text-highlight hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  required,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-paper-400">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-lg border border-ink-700 bg-ink-800 px-4 py-2.5 text-paper-100 focus:border-highlight focus:outline-none"
      />
    </label>
  );
}
