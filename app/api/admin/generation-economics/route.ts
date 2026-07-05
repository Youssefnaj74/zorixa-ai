import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/admin-auth";
import {
  buildBytePlusProductionAuditReport,
  BYTEPLUS_SEEDANCE_FEATURE_AUDIT
} from "@/lib/byteplus-feature-audit";
import { supabaseAdmin } from "@/lib/supabase/admin";

function startOfUtcDay(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function endOfUtcDay(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  d.setUTCHours(23, 59, 59, 999);
  return d.toISOString();
}

export async function GET(request: Request) {
  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const day = searchParams.get("day")?.trim() || undefined;
  const from = startOfUtcDay(day);
  const to = endOfUtcDay(day);

  const { data: rows, error } = await supabaseAdmin
    .from("generation_economics")
    .select("*")
    .gte("created_at", from)
    .lte("created_at", to)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = rows ?? [];
  const totalGenerations = list.length;
  const successCount = list.filter((r) => r.generation_status === "success").length;
  const failedCount = list.filter((r) => r.generation_status === "failed").length;
  const fallbackCount = list.filter((r) => r.fallback_used).length;

  const revenueUsd = list.reduce((s, r) => s + Number(r.revenue_usd ?? 0), 0);
  const providerCostUsd = list.reduce((s, r) => s + Number(r.provider_cost_usd ?? 0), 0);
  const grossProfitUsd = list.reduce((s, r) => s + Number(r.gross_profit_usd ?? 0), 0);
  const profitMarginPct = revenueUsd > 0 ? (grossProfitUsd / revenueUsd) * 100 : 0;

  const byteplusCount = list.filter((r) => r.provider_used === "byteplus").length;
  const atlasCount = list.filter((r) => r.provider_used === "atlas").length;
  const minimaxCount = list.filter((r) => r.provider_used === "minimax").length;
  const byteplusUsagePct = totalGenerations > 0 ? (byteplusCount / totalGenerations) * 100 : 0;
  const atlasUsagePct = totalGenerations > 0 ? (atlasCount / totalGenerations) * 100 : 0;
  const minimaxUsagePct = totalGenerations > 0 ? (minimaxCount / totalGenerations) * 100 : 0;

  const costByProvider = {
    byteplus: list
      .filter((r) => r.provider_used === "byteplus")
      .reduce((s, r) => s + Number(r.provider_cost_usd ?? 0), 0),
    atlas: list
      .filter((r) => r.provider_used === "atlas")
      .reduce((s, r) => s + Number(r.provider_cost_usd ?? 0), 0),
    minimax: list
      .filter((r) => r.provider_used === "minimax")
      .reduce((s, r) => s + Number(r.provider_cost_usd ?? 0), 0)
  };

  const workflowCounts = new Map<string, number>();
  const modelCounts = new Map<string, number>();
  for (const r of list) {
    workflowCounts.set(r.workflow, (workflowCounts.get(r.workflow) ?? 0) + 1);
    modelCounts.set(r.model_label, (modelCounts.get(r.model_label) ?? 0) + 1);
  }

  const topWorkflows = [...workflowCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([workflow, count]) => ({ workflow, count }));

  const topModels = [...modelCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([model, count]) => ({ model, count }));

  return NextResponse.json({
    day: day ?? new Date().toISOString().slice(0, 10),
    summary: {
      totalGenerations,
      successCount,
      failedCount,
      fallbackCount,
      revenueUsd: round2(revenueUsd),
      providerCostUsd: round2(providerCostUsd),
      grossProfitUsd: round2(grossProfitUsd),
      profitMarginPct: round2(profitMarginPct),
      byteplusUsagePct: round2(byteplusUsagePct),
      atlasUsagePct: round2(atlasUsagePct),
      minimaxUsagePct: round2(minimaxUsagePct),
      costByProvider: {
        byteplus: round2(costByProvider.byteplus),
        atlas: round2(costByProvider.atlas),
        minimax: round2(costByProvider.minimax)
      }
    },
    topWorkflows,
    topModels,
    latestLogs: list.slice(0, 50),
    featureAudit: BYTEPLUS_SEEDANCE_FEATURE_AUDIT,
    productionAudit: buildBytePlusProductionAuditReport()
  });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
