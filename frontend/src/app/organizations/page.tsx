import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken, UserRole } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import OrganizationsManager from "./OrganizationsManager";

export const dynamic = "force-dynamic";

export default async function OrganizationsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const payload = verifyToken(token);
  if (!payload) {
    redirect("/login");
  }

  // Enforce MAIN_ADMIN RBAC
  if (payload.role !== UserRole.MAIN_ADMIN) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar userEmail={payload.email} userRole={payload.role} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header Bar */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 sticky top-0 z-40">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Manage Organizations</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">
              Welcome back, <strong className="text-slate-800 font-semibold">{payload.email}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {payload.role}
            </span>
          </div>
        </header>

        {/* Organizations Dashboard View */}
        <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
          <OrganizationsManager />
        </main>
      </div>
    </div>
  );
}
