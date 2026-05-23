import { zorixaFetch } from "../client.js";

/**
 * @param {import("../config.js").ZorixaMcpConfig} config
 */
export async function getCredits(config) {
  return zorixaFetch(config, "/api/mcp/credits");
}
