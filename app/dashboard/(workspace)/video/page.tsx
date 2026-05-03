import { redirect } from "next/navigation";

/** Legacy URL — unified video studio lives at `/video`. */
export default function DashboardVideoRedirect() {
  redirect("/video");
}
