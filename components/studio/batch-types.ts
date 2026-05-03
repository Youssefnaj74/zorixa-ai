export type BatchItemStatus = "queued" | "uploading" | "processing" | "completed" | "failed";

export type StudioBatchItem = {
  id: string;
  file: File;
  previewUrl: string;
  uploadedUrl?: string;
  status: BatchItemStatus;
  outputUrl?: string | null;
  error?: string;
};

export function makeItemId(file: File, index: number) {
  return `${Date.now()}-${index}-${file.name}-${file.size}-${Math.random().toString(36).slice(2, 9)}`;
}
