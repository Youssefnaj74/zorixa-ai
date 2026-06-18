/** User-facing copy when generation returns 402 INSUFFICIENT_CREDITS. */
export function insufficientCreditsMessage(data: {
  credits_balance?: number;
  credits_required?: number;
  error?: string;
}): string {
  if (data.error === "INSUFFICIENT_CREDITS") {
    const need = data.credits_required ?? "?";
    const have = data.credits_balance ?? 0;
    return `Not enough credits (need ${need}, you have ${have}). View plans.`;
  }
  return data.error ?? "Not enough credits. View plans.";
}

export function isInsufficientCreditsMessage(message: string | null | undefined): boolean {
  if (!message) return false;
  return message.toLowerCase().includes("not enough credits");
}
