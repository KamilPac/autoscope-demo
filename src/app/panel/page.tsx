import Link from "next/link";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/auth-constants";
import { getCurrentProfile, getCurrentRole, getCurrentUser } from "@/lib/server/auth";
import { AccountSettingsForm } from "@/components/account-settings-form";

async function handleLogout() {
  "use server";
  const store = await cookies();
  store.delete(AUTH_COOKIE_NAME);
}

export default async function UserPanelPage() {
  const user = await getCurrentUser();
  const role = await getCurrentRole();
  const profile = await getCurrentProfile();
  const shownName = profile?.displayName?.trim() || user || "User";
  const roleLabel = role === "admin" ? "Administrator" : "User";

  return (
    <div className="page-shell min-h-screen py-10 lg:py-16">
      <main className="container-wide max-w-3xl space-y-6">
        <section className="card-surface p-7 sm:p-8">
          <p className="mb-2 text-xs uppercase tracking-[0.14em] text-slate-600">User panel</p>
          <h1 className="font-heading text-3xl font-bold text-slate-900">Welcome {shownName}</h1>
          <p className="mt-2 text-slate-600">You can now access search and filters available for your account.</p>
          <p className="mt-1 text-sm text-slate-500">Logged in as: {user ?? "unknown"}</p>
          <p className="mt-1 text-sm text-slate-500">Role: {roleLabel}</p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link className="btn-primary" href="/cars">
              Open vehicle search
            </Link>
            <Link className="btn-primary !bg-slate-700 hover:!bg-slate-900" href="/import-lot">
              Import lot
            </Link>
            <Link className="btn-primary !bg-amber-600 hover:!bg-amber-700" href="/">
              Home
            </Link>
          </div>

          <form className="mt-6" action={handleLogout}>
            <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" type="submit">
              Sign out
            </button>
          </form>

          <section className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="font-heading text-xl font-semibold text-slate-900">Account settings</h2>
            <p className="mt-1 text-sm text-slate-600">Simple profile settings used in the app header and panel.</p>
            <AccountSettingsForm initialDisplayName={profile?.displayName ?? ""} roleLabel={roleLabel} />
          </section>
        </section>
      </main>
    </div>
  );
}
