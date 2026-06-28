import { redirect } from "next/navigation";

import { AdminProfitabilityDashboard } from "@/components/admin/AdminProfitabilityDashboard";
import { isAdminEmailConfigured, requireAdminUser } from "@/lib/admin-auth";

export default async function AdminDashboardPage() {
  if (!isAdminEmailConfigured()) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-white/70">
        <h1 className="text-xl font-semibold text-white">Admin dashboard unavailable</h1>
        <p className="mt-3 text-sm">
          Set <code className="text-violet-300">ZORIXA_ADMIN_EMAILS</code> in the server environment
          (comma-separated admin emails).
        </p>
      </div>
    );
  }

  const admin = await requireAdminUser();
  if (!admin) {
    redirect("/login?redirect=/dashboard/admin");
  }

  return <AdminProfitabilityDashboard />;
}
