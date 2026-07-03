import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/admin-auth";
import {
  getProviderWalletSnapshot,
  listProviderWalletRecharges,
  rechargeProviderWallet,
  roundUsd2
} from "@/lib/provider-wallets";

const DEFAULT_PROVIDER = "byteplus";

export async function GET(request: Request) {
  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider")?.trim() || DEFAULT_PROVIDER;

  try {
    const [wallet, recharges] = await Promise.all([
      getProviderWalletSnapshot(provider),
      listProviderWalletRecharges(provider)
    ]);

    if (!wallet) {
      return NextResponse.json({ error: `Wallet not found for provider: ${provider}` }, { status: 404 });
    }

    return NextResponse.json({ wallet, recharges });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load provider wallet";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { provider?: string; amountUsd?: number; notes?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const provider = body.provider?.trim() || DEFAULT_PROVIDER;
  const amountUsd = roundUsd2(Number(body.amountUsd));

  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    return NextResponse.json({ error: "amountUsd must be a positive number" }, { status: 400 });
  }

  try {
    const result = await rechargeProviderWallet({
      provider,
      amountUsd,
      notes: body.notes
    });

    const wallet = await getProviderWalletSnapshot(provider);

    return NextResponse.json({
      wallet,
      recharge: result.recharge,
      newBalanceUsd: result.newBalanceUsd
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Recharge failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
