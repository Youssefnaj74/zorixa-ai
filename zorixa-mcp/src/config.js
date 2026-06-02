/** @typedef {{ apiBase: string; apiKey: string; userId?: string; usesLegacyMcp: boolean }} ZorixaMcpConfig */

/**
 * @returns {ZorixaMcpConfig}
 */
export function loadConfig() {
  const userApiKey = (process.env.ZORIXA_API_KEY ?? "").trim();
  const legacyMcpKey = (process.env.ZORIXA_MCP_API_KEY ?? "").trim();
  const userId = (process.env.ZORIXA_USER_ID ?? process.env.ZORIXA_MCP_USER_ID ?? "").trim();
  const apiBase = (process.env.ZORIXA_API_BASE_URL ?? "https://www.zorixaai.com")
    .trim()
    .replace(/\/$/, "");

  if (userApiKey) {
    return { apiBase, apiKey: userApiKey, usesLegacyMcp: false };
  }

  if (legacyMcpKey && userId) {
    return { apiBase, apiKey: legacyMcpKey, userId, usesLegacyMcp: true };
  }

  throw new Error(
    "Missing ZORIXA_API_KEY (from Dashboard → API Access), or legacy ZORIXA_MCP_API_KEY + ZORIXA_USER_ID."
  );
}
