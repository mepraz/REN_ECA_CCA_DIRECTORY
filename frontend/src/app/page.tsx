import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import { Shield, Building2, Award, Calendar, Image as ImageIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    console.warn("[dashboard] missing auth_token cookie");
    redirect("/login");
  }

  const payload = verifyToken(token);
  if (!payload) {
    console.warn("[dashboard] invalid auth_token cookie");
    redirect("/login");
  }

  console.log("[dashboard] authenticated render", {
    email: payload.email,
    role: payload.role,
  });

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar userEmail={payload.email} userRole={payload.role} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header Bar */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 sticky top-0 z-40">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Reliance Portal</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">
              Welcome back, <strong className="text-slate-800 font-semibold">{payload.email}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Shield className="h-3.5 w-3.5" />
              {payload.role}
            </span>
          </div>
        </header>

        {/* Dashboard Dashboard View */}
        <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Academic Management Dashboard
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Overview of the Reliance ECA/CCA directory module configurations and activity.
            </p>
          </div>

          {/* Analytics Cards (BankDash/UI Design Guide Style: Rounded 24px) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            {/* Total Events */}
            <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-400">Total Events</p>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">124</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
                <Calendar className="h-6 w-6" />
              </div>
            </div>

            {/* Organizations */}
            <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-400">Organizations</p>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">12</p>
              </div>
              <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
                <Building2 className="h-6 w-6" />
              </div>
            </div>

            {/* Images */}
            <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-400">Images</p>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">2,540</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
                <ImageIcon className="h-6 w-6" />
              </div>
            </div>

            {/* Winners */}
            <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-400">Winners</p>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">430</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-2xl text-amber-600">
                <Award className="h-6 w-6" />
              </div>
            </div>
          </div>
          {/* Content removed as requested */}
        </main>
      </div>
    </div>
  );
}
