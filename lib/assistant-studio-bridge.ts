export type AssistantStudioSnapshot = {
  page: string | null;
  selectedModel: string | null;
  selectedDuration: string | null;
  selectedQuality: string | null;
  selectedAspectRatio: string | null;
  draftPrompt: string | null;
  /** Active studio tab / route (e.g. Text to Video, AI Director). */
  actionTab: string | null;
  /** Speed tier label shown in the studio (e.g. Standard / Fast). */
  speedTier: string | null;
  /** Native soundtrack toggle when the current model supports it. */
  soundtrackOn: boolean | null;
  /** Credits shown next to Generate for the current configuration. */
  uiEstimatedCredits: number | null;
  /** Credits the API last required (402 / insufficient-credits response). */
  backendCreditsRequired: number | null;
  /** Balance reported with the last backend insufficient-credits response. */
  backendCreditsBalance: number | null;
  /** Last generation error string shown on the page. */
  lastGenerateError: string | null;
};

const EMPTY: AssistantStudioSnapshot = {
  page: null,
  selectedModel: null,
  selectedDuration: null,
  selectedQuality: null,
  selectedAspectRatio: null,
  draftPrompt: null,
  actionTab: null,
  speedTier: null,
  soundtrackOn: null,
  uiEstimatedCredits: null,
  backendCreditsRequired: null,
  backendCreditsBalance: null,
  lastGenerateError: null
};

let snapshot: AssistantStudioSnapshot = EMPTY;
const listeners = new Set<(next: AssistantStudioSnapshot) => void>();

export function publishAssistantStudioSnapshot(
  partial: Partial<AssistantStudioSnapshot>
): void {
  snapshot = { ...snapshot, ...partial };
  for (const listener of listeners) listener(snapshot);
}

export function clearAssistantStudioSnapshot(): void {
  snapshot = EMPTY;
  for (const listener of listeners) listener(snapshot);
}

export function getAssistantStudioSnapshot(): AssistantStudioSnapshot {
  return snapshot;
}

export function subscribeAssistantStudioSnapshot(
  listener: (next: AssistantStudioSnapshot) => void
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
