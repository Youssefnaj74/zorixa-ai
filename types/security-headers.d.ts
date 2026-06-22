declare module "@/lib/security-headers.mjs" {
  import type { NextResponse } from "next/server";

  export type SecurityHeader = { key: string; value: string };

  export function getSecurityHeaders(): SecurityHeader[];

  export function applySecurityHeaders<T extends NextResponse>(response: T): T;
}
