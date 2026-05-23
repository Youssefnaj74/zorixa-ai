/**
 * @param {import("./config.js").ZorixaMcpConfig} config
 * @param {string} path
 * @param {RequestInit} [init]
 */
export async function zorixaFetch(config, path, init = {}) {
  const url = `${config.apiBase}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${config.apiKey}`);
  headers.set("X-Zorixa-User-Id", config.userId);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "error" in data && data.error) ||
      `HTTP ${res.status}`;
    throw new Error(String(msg));
  }

  return data;
}
