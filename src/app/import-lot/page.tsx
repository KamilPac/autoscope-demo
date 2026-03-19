"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type ImportedLotPreview = {
  source: "marketcheck";
  lotNumber: string;
  year: number;
  make: string;
  model: string;
};

type ImportResult = {
  message: string;
  error?: string;
  warning?: string;
  lot?: ImportedLotPreview;
};

export default function ImportLotPage() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/lots/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const payload = (await response.json()) as ImportResult;

      if (!response.ok) {
        setResult({ message: payload.message, error: payload.error ?? "Unknown error" });
        return;
      }

      setResult({ message: payload.message, lot: payload.lot, warning: payload.warning });
      setUrl("");
    } catch (error) {
      setResult({
        message: "Request failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="page-shell min-h-screen py-8">
      <main className="container-wide max-w-3xl space-y-6">
        <section className="card-surface p-6 sm:p-8">
          <h1 className="font-heading text-3xl font-bold text-slate-900">Import lot by URL</h1>
          <p className="mt-2 text-slate-600">
            Paste a listing URL. Imported record will appear in search results.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-slate-700" htmlFor="lotUrl">
              Lot URL
            </label>
            <input
              id="lotUrl"
              className="input-base"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com/listing/..."
              required
            />

            <button className="btn-primary" type="submit" disabled={isLoading}>
              {isLoading ? "Importing..." : "Import lot"}
            </button>
          </form>

          {result ? (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="font-medium text-slate-900">{result.message}</p>
              {result.error ? <p className="mt-1 text-red-700">{result.error}</p> : null}
              {result.warning ? <p className="mt-1 text-amber-700">{result.warning}</p> : null}

              {result.lot ? (
                <div className="mt-3 space-y-3">
                  <p className="text-slate-700">
                    Imported: {result.lot.year} {result.lot.make} {result.lot.model} (lot {result.lot.lotNumber})
                  </p>
                  <Link
                    className="btn-primary inline-flex"
                    href={`/cars?q=${encodeURIComponent(result.lot.lotNumber)}&source=${result.lot.source}&sort=price_low`}
                  >
                    Show imported lot in results
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
