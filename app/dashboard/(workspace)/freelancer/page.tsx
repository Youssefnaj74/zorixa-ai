"use client";

import { motion } from "framer-motion";
import {
  BadgeDollarSign,
  BriefcaseBusiness,
  FileText,
  FolderKanban,
  Lock,
  Share2
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type InvoiceRow = {
  id: number;
  client_name: string;
  project_details: string;
  amount_cents: number;
  currency: string;
  status: "draft" | "sent" | "paid";
  created_at: string;
};

const card =
  "rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur";

function formatMoney(cents: number, currency: string) {
  const v = (cents ?? 0) / 100;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(v);
  } catch {
    return `${currency} ${v.toFixed(2)}`;
  }
}

function clampInt(n: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export default function FreelancerToolsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);

  const [clientName, setClientName] = useState("");
  const [projectDetails, setProjectDetails] = useState("");
  const [amount, setAmount] = useState("500");
  const [currency, setCurrency] = useState("USD");
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [savingInvoice, setSavingInvoice] = useState(false);

  const [rateType, setRateType] = useState<"image" | "video" | "enhancement">("image");
  const [quantity, setQuantity] = useState(10);
  const [turnaround, setTurnaround] = useState<"standard" | "rush" | "express">("standard");

  const estimated = useMemo(() => {
    const base =
      rateType === "video" ? 1800 : rateType === "image" ? 250 : 140;
    const qty = clampInt(quantity, 1, 500, 10);
    const multiplier = turnaround === "express" ? 1.8 : turnaround === "rush" ? 1.35 : 1.0;
    const subtotal = base * qty * multiplier;
    const platform = 0.08;
    const est = Math.round(subtotal * (1 - platform));
    return { base, qty, multiplier, subtotal, est };
  }, [rateType, quantity, turnaround]);

  const totals = useMemo(() => {
    const totalEarnings = invoices.reduce((acc, i) => acc + (i.status === "paid" ? i.amount_cents : 0), 0);
    const projectsCompleted = invoices.filter((i) => i.status === "paid").length;
    const clientCount = new Set(invoices.map((i) => i.client_name.trim().toLowerCase()).filter(Boolean)).size;
    return { totalEarnings, projectsCompleted, clientCount };
  }, [invoices]);

  const refreshInvoices = useCallback(async () => {
    setLoadingInvoices(true);
    setInvoiceError(null);
    const { data, error } = await supabase
      .from("invoices")
      .select("id, client_name, project_details, amount_cents, currency, status, created_at")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) setInvoiceError(error.message);
    setInvoices((data as InvoiceRow[] | null) ?? []);
    setLoadingInvoices(false);
  }, [supabase]);

  useEffect(() => {
    void refreshInvoices();
  }, [refreshInvoices]);

  const downloadPdfInvoice = useCallback(
    (inv: { client_name: string; project_details: string; amount_cents: number; currency: string }) => {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("INVOICE", 48, 64);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text("Zorixa AI Freelancer Tools", 48, 88);
      doc.text(`Client: ${inv.client_name || "-"}`, 48, 120);

      doc.setFont("helvetica", "bold");
      doc.text("Project details", 48, 156);

      doc.setFont("helvetica", "normal");
      const details = doc.splitTextToSize(inv.project_details || "-", 500);
      doc.text(details, 48, 176);

      const y = 176 + details.length * 14 + 24;
      doc.setFont("helvetica", "bold");
      doc.text("Total", 48, y);
      doc.setFont("helvetica", "bold");
      doc.text(formatMoney(inv.amount_cents, inv.currency), 520, y, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Tip: mark as Paid in Supabase to count it in earnings.", 48, y + 32);

      doc.save(`invoice-${inv.client_name || "client"}.pdf`);
    },
    []
  );

  const saveInvoice = useCallback(async () => {
    setSavingInvoice(true);
    setInvoiceError(null);
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in again.");

      const amt = Math.round(Number.parseFloat(amount) * 100);
      if (!Number.isFinite(amt) || amt < 0) throw new Error("Enter a valid amount.");
      if (!clientName.trim()) throw new Error("Client name is required.");
      if (!projectDetails.trim()) throw new Error("Project details are required.");

      const { error } = await supabase.from("invoices").insert({
        user_id: user.id,
        client_name: clientName.trim(),
        project_details: projectDetails.trim(),
        amount_cents: amt,
        currency: currency.trim().toUpperCase(),
        status: "draft"
      });
      if (error) throw error;

      setClientName("");
      setProjectDetails("");
      setAmount("500");
      setCurrency("USD");
      await refreshInvoices();
    } catch (e: unknown) {
      setInvoiceError(e instanceof Error ? e.message : "Failed to save invoice.");
    } finally {
      setSavingInvoice(false);
    }
  }, [amount, clientName, currency, projectDetails, refreshInvoices, supabase]);

  return (
    <div className="min-h-0 flex-1 bg-[#0a0a0f] text-white">
      <div className="mx-auto w-full max-w-6xl space-y-8 p-4 md:p-8">
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className={cn(card, "relative overflow-hidden")}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-violet-600/15 via-fuchsia-600/10 to-transparent" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="grid size-12 place-items-center rounded-2xl border border-violet-500/25 bg-violet-500/10 text-violet-200">
                <BriefcaseBusiness className="size-6" />
              </span>
              <div>
                <h1 className="font-display text-2xl font-semibold tracking-tight">Freelancer Tools</h1>
                <p className="mt-1 text-sm text-white/55">
                  Portfolio, pricing, invoices, and sharing — built for premium client workflows.
                </p>
              </div>
            </div>
            <div className="hidden text-right text-xs text-white/45 md:block">
              <p className="font-medium text-violet-200/70">Zorixa · Freelancer Suite</p>
              <p>Dark • Vibrant • Motion</p>
            </div>
          </div>
        </motion.header>

        <section className="grid gap-4 md:grid-cols-3">
          <motion.div whileHover={{ y: -4 }} className={card}>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/45">Total earnings</p>
            <p className="mt-2 font-display text-3xl font-bold">{formatMoney(totals.totalEarnings, "USD")}</p>
            <p className="mt-1 text-xs text-white/40">Paid invoices only</p>
          </motion.div>
          <motion.div whileHover={{ y: -4 }} className={card}>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/45">Projects completed</p>
            <p className="mt-2 font-display text-3xl font-bold tabular-nums">{totals.projectsCompleted}</p>
            <p className="mt-1 text-xs text-white/40">Marked as paid</p>
          </motion.div>
          <motion.div whileHover={{ y: -4 }} className={card}>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/45">Clients</p>
            <p className="mt-2 font-display text-3xl font-bold tabular-nums">{totals.clientCount}</p>
            <p className="mt-1 text-xs text-white/40">Unique client names</p>
          </motion.div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            className={card}
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <FolderKanban className="size-5 text-violet-200" /> Portfolio Builder
              </h2>
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-white/55">
                Coming next
              </span>
            </div>
            <p className="mt-2 text-sm text-white/55">
              Upload and curate AI-generated images/videos into a public portfolio.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-semibold text-white">Public link</p>
                <p className="mt-1 text-xs text-white/45">
                  <span className="text-violet-200">/portfolio/[username]</span>
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-semibold text-white">Layout</p>
                <p className="mt-1 text-xs text-white/45">Masonry, grid, or case studies</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            className={card}
          >
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <BadgeDollarSign className="size-5 text-violet-200" /> Rate Calculator
            </h2>
            <p className="mt-2 text-sm text-white/55">Price projects consistently and show estimated earnings.</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="text-xs font-medium text-white/45">Type</span>
                <select
                  value={rateType}
                  onChange={(e) => setRateType(e.target.value as any)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-violet-400/40"
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="enhancement">Enhancement</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-white/45">Quantity</span>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-violet-400/40"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-white/45">Turnaround</span>
                <select
                  value={turnaround}
                  onChange={(e) => setTurnaround(e.target.value as any)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-violet-400/40"
                >
                  <option value="standard">Standard</option>
                  <option value="rush">Rush</option>
                  <option value="express">Express</option>
                </select>
              </label>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-white">Estimated earnings</p>
                <p className="font-display text-xl font-bold text-violet-200 tabular-nums">
                  {formatMoney(estimated.est * 100, "USD")}
                </p>
              </div>
              <p className="mt-1 text-xs text-white/45">
                Base: ${estimated.base} × {estimated.qty} · Multiplier: {estimated.multiplier.toFixed(2)} · Platform fee
                simulated
              </p>
            </div>
          </motion.div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            className={card}
          >
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <FileText className="size-5 text-violet-200" /> Invoice Generator
            </h2>
            <p className="mt-2 text-sm text-white/55">Create invoices, download as PDF, and keep history in Supabase.</p>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-medium text-white/45">Client name</span>
                <input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-violet-400/40"
                  placeholder="Acme Studio"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-white/45">Project details</span>
                <textarea
                  value={projectDetails}
                  onChange={(e) => setProjectDetails(e.target.value)}
                  className="mt-2 min-h-28 w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-violet-400/40"
                  placeholder="UGC video package, 3 clips, 1080p, 48h turnaround…"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-medium text-white/45">Amount</span>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-violet-400/40"
                    placeholder="500"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-white/45">Currency</span>
                  <input
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-violet-400/40"
                    placeholder="USD"
                  />
                </label>
              </div>

              {invoiceError ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {invoiceError}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() =>
                    downloadPdfInvoice({
                      client_name: clientName,
                      project_details: projectDetails,
                      amount_cents: Math.max(0, Math.round(Number.parseFloat(amount || "0") * 100)),
                      currency: currency.trim().toUpperCase() || "USD"
                    })
                  }
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.1]"
                >
                  Download PDF
                </button>
                <button
                  type="button"
                  disabled={savingInvoice}
                  onClick={() => void saveInvoice()}
                  className={cn(
                    "inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_22px_rgba(139,92,246,0.35)] hover:brightness-110",
                    savingInvoice && "opacity-60"
                  )}
                >
                  Save to history
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            className={card}
          >
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <Share2 className="size-5 text-violet-200" /> Client Sharing
            </h2>
            <p className="mt-2 text-sm text-white/55">
              Share specific results with clients — password-protected galleries planned.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Lock className="size-4 text-violet-200" /> Password galleries
                </div>
                <p className="mt-1 text-xs text-white/45">Create a gallery, set a password, share a link.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Share2 className="size-4 text-violet-200" /> Result sharing
                </div>
                <p className="mt-1 text-xs text-white/45">Pick generations and share a curated set.</p>
              </div>
            </div>
          </motion.div>
        </section>

        <section className={card}>
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-lg font-semibold">Invoice history</h2>
            <button
              type="button"
              onClick={() => void refreshInvoices()}
              className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/[0.1]"
            >
              Refresh
            </button>
          </div>

          {loadingInvoices ? (
            <p className="mt-4 text-sm text-white/45">Loading…</p>
          ) : invoices.length === 0 ? (
            <p className="mt-4 text-sm text-white/45">No invoices yet. Create one above.</p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
              <div className="grid grid-cols-12 gap-2 border-b border-white/10 bg-black/30 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-white/45">
                <div className="col-span-5">Client</div>
                <div className="col-span-3">Amount</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">PDF</div>
              </div>
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="grid grid-cols-12 items-center gap-2 px-4 py-3 text-sm text-white/80 hover:bg-white/[0.04]"
                >
                  <div className="col-span-5 min-w-0">
                    <p className="truncate font-semibold text-white">{inv.client_name}</p>
                    <p className="truncate text-xs text-white/45">{inv.project_details}</p>
                  </div>
                  <div className="col-span-3 tabular-nums">{formatMoney(inv.amount_cents, inv.currency)}</div>
                  <div className="col-span-2 text-xs font-semibold text-violet-200/80">{inv.status}</div>
                  <div className="col-span-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => downloadPdfInvoice(inv)}
                      className="rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-1.5 text-xs font-semibold hover:bg-white/[0.1]"
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

