"use client";

/**
 * Dark theme is set on `<html className="dark">` in `app/layout.tsx`.
 * Avoids `next-themes` inline script (breaks on React 19 / Next 16 dev overlay).
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return children;
}
