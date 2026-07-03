import { roundUsd2 } from "@/lib/provider-wallets-format";
import { supabaseAdmin } from "@/lib/supabase/admin";

export { fmtUsd2, roundUsd2 } from "@/lib/provider-wallets-format";

export type ProviderWalletRow = {
  provider: string;
  initial_balance_usd: number;
  notes: string | null;
  updated_at: string;
};

export type ProviderWalletRechargeRow = {
  id: number;
  provider: string;
  amount_usd: number;
  notes: string | null;
  created_at: string;
};

export type ProviderWalletSnapshot = {
  provider: string;
  initialDepositUsd: number;
  totalCostUsd: number;
  estimatedRemainingUsd: number;
  lastUpdated: string | null;
  notes: string | null;
};

export type ProviderWalletRechargeRecord = {
  id: number;
  date: string;
  amountUsd: number;
  provider: string;
  notes: string | null;
};

export async function sumProviderCostUsd(provider: string): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from("generation_economics")
    .select("provider_cost_usd")
    .eq("provider_used", provider);

  if (error) throw new Error(error.message);

  const total = (data ?? []).reduce((s, r) => s + Number(r.provider_cost_usd ?? 0), 0);
  return roundUsd2(total);
}

export async function getProviderWallet(provider: string): Promise<ProviderWalletRow | null> {
  const { data, error } = await supabaseAdmin
    .from("provider_wallets")
    .select("provider, initial_balance_usd, notes, updated_at")
    .eq("provider", provider)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    provider: data.provider,
    initial_balance_usd: Number(data.initial_balance_usd),
    notes: data.notes,
    updated_at: data.updated_at
  };
}

export async function getProviderWalletSnapshot(provider: string): Promise<ProviderWalletSnapshot | null> {
  const wallet = await getProviderWallet(provider);
  if (!wallet) return null;

  const totalCostUsd = await sumProviderCostUsd(provider);
  const initialDepositUsd = roundUsd2(wallet.initial_balance_usd);
  const estimatedRemainingUsd = roundUsd2(initialDepositUsd - totalCostUsd);

  return {
    provider,
    initialDepositUsd,
    totalCostUsd,
    estimatedRemainingUsd,
    lastUpdated: wallet.updated_at,
    notes: wallet.notes
  };
}

export async function listProviderWalletRecharges(
  provider: string,
  limit = 50
): Promise<ProviderWalletRechargeRecord[]> {
  const { data, error } = await supabaseAdmin
    .from("provider_wallet_recharges")
    .select("id, provider, amount_usd, notes, created_at")
    .eq("provider", provider)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    date: row.created_at,
    amountUsd: roundUsd2(Number(row.amount_usd)),
    provider: row.provider,
    notes: row.notes
  }));
}

export async function rechargeProviderWallet(input: {
  provider: string;
  amountUsd: number;
  notes?: string | null;
}): Promise<{ newBalanceUsd: number; recharge: ProviderWalletRechargeRecord }> {
  const amountUsd = roundUsd2(input.amountUsd);
  if (amountUsd <= 0) {
    throw new Error("Recharge amount must be greater than zero.");
  }

  const wallet = await getProviderWallet(input.provider);
  if (!wallet) {
    throw new Error(`Provider wallet not found: ${input.provider}`);
  }

  const newBalanceUsd = roundUsd2(wallet.initial_balance_usd + amountUsd);
  const now = new Date().toISOString();

  const { error: updateError } = await supabaseAdmin
    .from("provider_wallets")
    .update({
      initial_balance_usd: newBalanceUsd,
      updated_at: now
    })
    .eq("provider", input.provider);

  if (updateError) throw new Error(updateError.message);

  const { data: rechargeRow, error: insertError } = await supabaseAdmin
    .from("provider_wallet_recharges")
    .insert({
      provider: input.provider,
      amount_usd: amountUsd,
      notes: input.notes?.trim() || null
    })
    .select("id, provider, amount_usd, notes, created_at")
    .single();

  if (insertError) throw new Error(insertError.message);

  return {
    newBalanceUsd,
    recharge: {
      id: rechargeRow.id,
      date: rechargeRow.created_at,
      amountUsd,
      provider: rechargeRow.provider,
      notes: rechargeRow.notes
    }
  };
}
