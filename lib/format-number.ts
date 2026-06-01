/** Fixed locale so SSR (Node) and browser hydration match. */
const NUMBER_LOCALE = "en-US";

export function formatInteger(n: number): string {
  return Math.round(n).toLocaleString(NUMBER_LOCALE);
}
