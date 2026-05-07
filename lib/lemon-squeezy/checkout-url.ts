/**
 * Build hosted/overlay checkout URL for a single product variant.
 * @see https://docs.lemonsqueezy.com/help/checkout/passing-custom-data
 */
export function getLemonSqueezyCheckoutUrl(userId: string): string | null {
  const store = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_STORE_SLUG?.trim();
  const variant = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_VARIANT_ID?.trim();
  if (!store || !variant) return null;

  const base = `https://${store}.lemonsqueezy.com/checkout/buy/${variant}`;
  const params = new URLSearchParams();
  params.set("checkout[custom][user_id]", userId);
  return `${base}?${params.toString()}`;
}

export function getCreditsPerPurchase(): number {
  const raw = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CREDITS?.trim() ?? "100";
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 100;
}
