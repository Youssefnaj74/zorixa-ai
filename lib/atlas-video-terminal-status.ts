/** Provider poll status indicates the final asset is ready (not an intermediate URL). */
export function isAtlasVideoTerminalSuccessStatus(status: string | undefined | null): boolean {
  const s = (status ?? "").toLowerCase();
  return s === "succeeded" || s === "completed";
}
