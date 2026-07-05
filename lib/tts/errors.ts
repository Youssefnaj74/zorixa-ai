export function formatTtsHttpError(
  providerLabel: string,
  status: number,
  detail: string
): string {
  const trimmed = detail.trim();
  if (trimmed.length > 0) {
    try {
      const parsed = JSON.parse(trimmed) as {
        base_resp?: { status_code?: number; status_msg?: string };
        error?: { message?: string };
        message?: string;
      };
      const baseMsg = parsed.base_resp?.status_msg?.trim();
      if (baseMsg) return baseMsg;
      const errMsg = parsed.error?.message?.trim() || parsed.message?.trim();
      if (errMsg) return errMsg;
    } catch {
      return trimmed.slice(0, 280);
    }
  }
  return `${providerLabel} request failed (${status})`;
}
