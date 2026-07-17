"use client";

import { useEffect, useState } from "react";

import {
  getAssistantStudioSnapshot,
  subscribeAssistantStudioSnapshot,
  type AssistantStudioSnapshot
} from "@/lib/assistant-studio-bridge";

export function useAssistantStudioSnapshot(): AssistantStudioSnapshot {
  const [snapshot, setSnapshot] = useState<AssistantStudioSnapshot>(() =>
    getAssistantStudioSnapshot()
  );

  useEffect(() => subscribeAssistantStudioSnapshot(setSnapshot), []);

  return snapshot;
}
