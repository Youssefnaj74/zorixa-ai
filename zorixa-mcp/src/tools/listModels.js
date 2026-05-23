import { zorixaFetch } from "../client.js";

/**
 * @param {import("../config.js").ZorixaMcpConfig} config
 */
export async function listModels(config) {
  return zorixaFetch(config, "/api/mcp/models");
}
