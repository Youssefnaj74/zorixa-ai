export async function openDodoCustomerPortal(): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch("/api/billing/customer-portal", {
    credentials: "include",
    headers: { Accept: "application/json" }
  });

  const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };

  if (res.ok && body.url) {
    window.location.href = body.url;
    return { ok: true };
  }

  return { ok: false, error: body.error ?? "Could not open billing portal." };
}
