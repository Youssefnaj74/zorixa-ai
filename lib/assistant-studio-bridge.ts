export type AssistantStudioSnapshot = {
  page: string | null;
  selectedModel: string | null;
  selectedDuration: string | null;
  selectedQuality: string | null;
  selectedAspectRatio: string | null;
  draftPrompt: string | null;
};

const EMPTY: AssistantStudioSnapshot = {
  page: null,
  selectedModel: null,
  selectedDuration: null,
  selectedQuality: null,
  selectedAspectRatio: null,
  draftPrompt: null
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
