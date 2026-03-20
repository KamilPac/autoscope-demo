"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { toDisplayImageUrl } from "@/lib/image-url";

type CacheEntry = {
  id: string;
  source: string;
  year: number;
  make: string;
  model: string;
  vin: string;
  lotNumber: string;
  imageUrl: string;
  inSearchCache: boolean;
  inImportedLots: boolean;
  inRecentCars: boolean;
};

export function AdminSearchCachePanel() {
  const [entries, setEntries] = useState<CacheEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  async function loadEntries() {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/search-cache", { cache: "no-store" });
      const payload = (await response.json()) as { entries?: CacheEntry[]; message?: string };

      if (!response.ok) {
        setMessage(payload.message ?? "Could not load cache");
        setEntries([]);
        return;
      }

      setEntries(Array.isArray(payload.entries) ? payload.entries : []);
      setMessage(null);
    } catch {
      setMessage("Request failed");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEntries();
  }, []);

  async function handleDelete(key: string) {
    try {
      const response = await fetch("/api/admin/search-cache/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: key }),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        setMessage(payload.message ?? "Delete failed");
        return;
      }

      setEntries((current) => current.filter((entry) => entry.id !== key));
      setMessage("Car deleted from local storage");
    } catch {
      setMessage("Request failed");
    }
  }

  return (
    <section className="mt-8 rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-heading text-xl font-semibold text-slate-900">Admin saved cars panel</h2>
        <button
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          type="button"
          onClick={() => void loadEntries()}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <p className="text-sm text-slate-600">Each row is one saved car from local storage (cache/import/recent).</p>
      {message ? <p className="mt-2 text-sm text-slate-600">{message}</p> : null}

      <div className="mt-4 space-y-2">
        {entries.length === 0 ? (
          <p className="text-sm text-slate-500">No saved cars.</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[140px_minmax(0,1fr)]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-200">
                <Image
                  className="object-cover"
                  src={toDisplayImageUrl(entry.imageUrl)}
                  alt={`${entry.make} ${entry.model}`}
                  fill
                  unoptimized
                  sizes="140px"
                />
              </div>

              <div>
                <p className="text-sm text-slate-700">
                  <strong>{entry.year} {entry.make} {entry.model}</strong> | lot: <strong>{entry.lotNumber}</strong> |
                  source: <strong>{entry.source}</strong>
                </p>
                <p className="mt-1 text-xs text-slate-600">VIN: {entry.vin}</p>
                <p className="mt-1 text-xs text-slate-600">
                  Stored in:
                  {entry.inSearchCache ? " cache" : ""}
                  {entry.inImportedLots ? " imported" : ""}
                  {entry.inRecentCars ? " recent" : ""}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                    type="button"
                    onClick={() => void handleDelete(entry.id)}
                  >
                    Delete this car
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
