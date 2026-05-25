import { redirect } from "next/navigation";

/** Legacy URL — image studio lives at `/image`. */
export default function EnhancePage() {
  redirect("/image");
}
