import { redirect } from "next/navigation";

/** Removed from dashboard — use `/video` for full video studio if needed. */
export default function DashboardVideoPage() {
  redirect("/dashboard");
}
