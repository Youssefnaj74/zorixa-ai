import { NextResponse } from "next/server";

/**
 * Legacy unauthenticated Dodo Checkout SDK surface.
 * Disabled: payments without user_id metadata never grant credits.
 * Use POST /api/billing/create-checkout (authenticated) instead.
 */
export async function GET() {
  return NextResponse.json(
    {
      error:
        "This checkout endpoint is disabled. Sign in and use /api/billing/create-checkout."
    },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      error:
        "This checkout endpoint is disabled. Sign in and use /api/billing/create-checkout."
    },
    { status: 410 }
  );
}
