"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextUrl = useMemo(() => searchParams.get("next") || "/cars", [searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        setError(payload.message ?? "Login failed");
        return;
      }

      router.push(nextUrl);
      router.refresh();
    } catch {
      setError("Request failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="page-shell min-h-screen py-10 lg:py-16">
      <main className="container-wide max-w-xl">
        <section className="card-surface p-7 sm:p-8">
          <h1 className="font-heading text-3xl font-bold text-slate-900">Sign in</h1>
          <p className="mt-2 text-slate-600">Sign in to access vehicle search, filters and import tools.</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-slate-700" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              className="input-base"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />

            <label className="block text-sm font-medium text-slate-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="input-base"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            {error ? <p className="text-sm text-red-700">{error}</p> : null}

            <button className="btn-primary" type="submit" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-5 text-sm text-slate-600">
            <Link className="font-medium text-teal-700 hover:text-teal-800" href="/">
              Back to home
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
