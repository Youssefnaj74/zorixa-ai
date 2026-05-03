import { redirect } from "next/navigation";

/** Legacy URL — unified image studio lives at `/image`. */
export default function DashboardImageRedirect() {
  redirect("/image");
}
