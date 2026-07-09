import { cn } from "@/lib/utils";

/** Desktop 88×150 upload slots; full-width stacked layout below `lg`. */
export const VIDEO_UPLOAD_SLOT_SIZE =
  "h-[88px] w-[150px] max-lg:h-[72px] max-lg:w-full max-lg:max-w-none";

export const VIDEO_UPLOAD_SLOT_FRAME = cn(
  "relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl",
  VIDEO_UPLOAD_SLOT_SIZE
);

/** Two upload slots side-by-side on desktop; stacked on mobile (general). */
export const VIDEO_UPLOAD_PAIR_GRID = "grid grid-cols-2 gap-3 max-lg:grid-cols-1 max-lg:gap-2";

/** Image-to-video start/end frames — stay side-by-side on phone too. */
export const VIDEO_I2V_FRAME_GRID = "grid grid-cols-2 gap-3 max-lg:gap-2";

export const VIDEO_UPLOAD_SLOT_IDLE = cn(
  VIDEO_UPLOAD_SLOT_FRAME,
  "border border-dashed border-white/20 bg-black/40 text-zorixa-muted transition-colors",
  "hover:border-white/30 hover:bg-black/55"
);

export function videoImageUploadSlotClass(...extra: (string | false | null | undefined)[]) {
  return cn(VIDEO_UPLOAD_SLOT_IDLE, ...extra);
}
