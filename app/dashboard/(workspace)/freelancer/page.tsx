import { redirect } from "next/navigation";

/** Freelancer workspace removed from dashboard nav. */
export default function DashboardFreelancerPage() {
  redirect("/dashboard");
}
