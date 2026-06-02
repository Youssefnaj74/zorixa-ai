"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Key, Trash2 } from "lucide-react";

type ApiKeyRow = {
  id: string;
  key_prefix: string;
  label: string | null;
  created_at: string;
  last_used_at: string | null;
};

type CreatedKey = {
  key: string;
  id: string;
  key_prefix: string;
  label: string | null;
};

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

const CURSOR_SNIPPET = (apiKey: string) => `{
  "mcpServers": {
    "zorixa": {
      "command": "node",
      "args": ["PATH/TO/zorixa-mcp/src/index.js"],
      "env": {
        "ZORIXA_API_KEY": "${apiKey}",
        "ZORIXA_API_BASE_URL": "https://www.zorixaai.com"
      }
    }
  }
}`;

export function ApiAccessPanel() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [maxKeys, setMaxKeys] = useState(5);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState("");
  const [createdKey, setCreatedKey] = useState<CreatedKey | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showCursorConfig, setShowCursorConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/api-keys");
      const data = (await res.json()) as { keys?: ApiKeyRow[]; max_keys?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to load keys");
      setKeys(data.keys ?? []);
      setMaxKeys(data.max_keys ?? 5);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load keys");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadKeys();
  }, [loadKeys]);

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() || undefined })
      });
      const data = (await res.json()) as CreatedKey & { error?: string; message?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to create key");
      setCreatedKey(data);
      setLabel("");
      await loadKeys();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create key");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm("Revoke this API key? Apps using it will stop working immediately.")) return;
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/api-keys/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to revoke");
      if (createdKey?.id === id) setCreatedKey(null);
      await loadKeys();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to revoke");
    }
  }

  async function copyText(text: string, id: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(id);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("Copy failed — select the key text and press Ctrl+C.");
    }
  }

  const atLimit = keys.length >= maxKeys;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="text-xs font-medium uppercase tracking-wider text-brand-light">Developer</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
        API Access
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
        Generate a personal API key to call Zorixa from Cursor, scripts, or your apps. Credits are
        deducted from your account — same balance as the website.
      </p>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      ) : null}

      {createdKey ? (
        <section className="mt-8 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5">
          <p className="text-sm font-semibold text-amber-100">Copy your new API key now</p>
          <p className="mt-1 text-xs text-amber-200/80">
            This is the only time the full key is shown. Store it securely.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <input
              type="text"
              readOnly
              value={createdKey.key}
              onFocus={(e) => e.currentTarget.select()}
              aria-label="API key"
              className="min-w-0 flex-1 rounded-lg border border-amber-500/30 bg-black/40 px-3 py-2 font-mono text-xs text-white focus:border-amber-400/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void copyText(createdKey.key, "new-key")}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-white/10 px-4 py-2 text-xs font-medium text-white hover:bg-white/15"
            >
              <Copy className="size-3.5 shrink-0" aria-hidden />
              {copied === "new-key" ? "Copied!" : "Copy key"}
            </button>
          </div>
          <p className="mt-2 text-xs text-amber-200/70">
            Tip: click the field above, then Ctrl+C if the button fails.
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowCursorConfig((v) => !v)}
              className="text-xs font-medium text-zinc-300 hover:text-white"
            >
              {showCursorConfig ? "Hide" : "Show"} Cursor MCP config
            </button>
            {showCursorConfig ? (
              <div className="mt-2">
                <pre className="overflow-x-auto rounded-lg bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-zinc-300">
                  {CURSOR_SNIPPET(createdKey.key)}
                </pre>
                <button
                  type="button"
                  onClick={() => void copyText(CURSOR_SNIPPET(createdKey.key), "cursor-snippet")}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs text-brand-light hover:underline"
                >
                  <Copy className="size-3" aria-hidden />
                  {copied === "cursor-snippet" ? "Copied!" : "Copy Cursor JSON"}
                </button>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Key className="size-4 text-brand-light" aria-hidden />
          Create API key
        </h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (optional, e.g. Cursor)"
            maxLength={64}
            className="min-h-[44px] flex-1 rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white placeholder:text-zinc-500 focus:border-brand/50 focus:outline-none"
          />
          <button
            type="button"
            disabled={creating || atLimit}
            onClick={() => void handleCreate()}
            className="min-h-[44px] rounded-xl bg-gradient-to-r from-violet-600 to-brand px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? "Creating…" : atLimit ? "Key limit reached" : "Generate key"}
          </button>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          {keys.length} / {maxKeys} active keys
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-white">Your keys</h2>
        {loading ? (
          <p className="mt-4 text-sm text-zinc-500">Loading…</p>
        ) : keys.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No active keys yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {keys.map((k) => (
              <li
                key={k.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
              >
                <div>
                  <p className="font-mono text-sm text-zinc-200">{k.key_prefix}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {k.label ? `${k.label} · ` : ""}
                    Created {formatDate(k.created_at)}
                    {k.last_used_at ? ` · Last used ${formatDate(k.last_used_at)}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleRevoke(k.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-200 hover:bg-red-500/10"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h2 className="text-sm font-semibold text-white">REST example</h2>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-zinc-400">
{`curl -X POST https://www.zorixaai.com/api/generate-image \\
  -H "Authorization: Bearer zrx_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt":"sunset","imageModel":"nano-banana-2"}'`}
        </pre>
      </section>
    </main>
  );
}
