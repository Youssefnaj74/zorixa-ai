import { redirect } from "next/navigation";

/** Legacy URL — support@ and navbar used to point here. */
export default function SupportRedirectPage() {
  redirect("/helpsupport");
}
