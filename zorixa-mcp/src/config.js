/** @typedef {{ apiBase: string; apiKey: string; userId: string }} ZorixaMcpConfig */

/**
 * @returns {ZorixaMcpConfig}
 */
export function loadConfig() {
  const apiKey = (process.env.ZORIXA_MCP_API_KEY ?? "").trim();
  const userId = (process.env.ZORIXA_USER_ID ?? process.env.ZORIXA_MCP_USER_ID ?? "").trim();
  const apiBase = (process.env.ZORIXA_API_BASE_URL ?? "https://www.zorixaai.com")
    .trim()
    .replace(/\/$/, "");

  if (!apiKey) {
    throw new Error("Missing ZORIXA_MCP_API_KEY in environment.");
  }
  if (!userId) {
    throw new Error("Missing ZORIXA_USER_ID (Supabase auth user uuid) in environment.");
  }

  return { apiBase, apiKey, userId };
}
