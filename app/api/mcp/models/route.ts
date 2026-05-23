import { NextResponse } from "next/server";

import { buildMcpModelsCatalog } from "@/lib/mcp-models-catalog";
import { isZorixaMcpRequest, unauthorizedMcpResponse } from "@/lib/zorixa-mcp-auth";

export async function GET(request: Request) {
  if (!isZorixaMcpRequest(request)) {
    return unauthorizedMcpResponse();
  }

  return NextResponse.json({
    models: buildMcpModelsCatalog(),
    video_actions: [
      "text",
      "image",
      "reference",
      "edit",
      "motion-control",
      "start-end"
    ]
  });
}
