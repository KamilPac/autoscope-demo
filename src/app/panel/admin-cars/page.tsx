import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminSearchCachePanel } from "@/components/admin-search-cache-panel";
import { getCurrentRole } from "@/lib/server/auth";

export default async function AdminCarsPage() {
  const role = await getCurrentRole();

  if (role !== "admin") {
    redirect("/panel");
  }

  return (
    <div className="page-shell min-h-screen py-10 lg:py-16">
      <main className="container-wide max-w-5xl space-y-6">
        <section className="card-surface p-7 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.14em] text-slate-600">Admin panel</p>
              <h1 className="font-heading text-3xl font-bold text-slate-900">Saved cars management</h1>
              <p className="mt-2 text-slate-600">Browse saved local car records and remove single vehicles.</p>
            </div>

            <Link className="btn-primary !bg-slate-700 hover:!bg-slate-900" href="/panel">
              Back to user panel
            </Link>
          </div>

          <AdminSearchCachePanel />
        </section>
      </main>
    </div>
  );
}
