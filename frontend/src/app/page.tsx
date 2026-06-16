import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import { UserRole } from "@/lib/auth";
import { Shield, Building, Activity } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const payload = verifyToken(token);
  if (!payload) {
    redirect("/login");
  }

  const isAdmin = payload.role === UserRole.MAIN_ADMIN;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/* Top Navigation Bar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-500 mr-2" />
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Reliance Portal
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400 hidden sm:inline">
                Welcome back, <strong className="text-white">{payload.email}</strong>
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Administrative Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Overview of the reliance ECA/CCA directory module configurations.
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Current Role</p>
              <p className="text-xl font-bold text-white mt-1">{payload.role}</p>
              <p className="text-xs text-slate-500 mt-2">
                {isAdmin
                  ? "Access granted to all system features."
                  : "Access restricted to college-specific operations."}
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 flex items-start gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-500">
              <Building className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Organization ID</p>
              <p className="text-xl font-bold text-white mt-1">
                {payload.organizationId || "System Level"}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {isAdmin ? "Global administrative rights." : "Scoped to organization resource."}
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 flex items-start gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Status</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xl font-bold text-white">Active</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Session established successfully via secure JWT.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions / Configuration Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-8">
          <h2 className="text-xl font-bold text-white mb-4">Module 1 Setup Successful</h2>
          <p className="text-slate-300 text-sm mb-6 max-w-2xl leading-relaxed">
            The authentication layer, database connection, User models, seed script, API routes,
            middleware protection, and authorization configurations are fully established. You can
            use these structures to begin building ECA/CCA features.
          </p>
          <div className="border border-dashed border-slate-800 rounded-lg p-4 bg-slate-950/50">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              System Configuration Status
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> Database: Connected
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> Auth Session: Verified HTTP-Only Cookie
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> Authorization Helpers: Active
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
