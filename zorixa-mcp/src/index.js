#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { generateImage, generateImageSchema } from "./tools/generateImage.js";
import { generateVideo, generateVideoSchema } from "./tools/generateVideo.js";
import { getCredits } from "./tools/getCredits.js";
import { listModels } from "./tools/listModels.js";

const config = loadConfig();

const server = new McpServer({
  name: "zorixa",
  version: "0.1.0"
});

server.tool(
  "generate_image",
  "Generate an image via Zorixa (Atlas Cloud). Result is saved to your Zorixa dashboard history.",
  generateImageSchema,
  async (args) => {
    const result = await generateImage(config, args);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  }
);

server.tool(
  "generate_video",
  "Generate a video via Zorixa (Atlas Cloud). Result is saved to your Zorixa dashboard history.",
  generateVideoSchema,
  async (args) => {
    const result = await generateVideo(config, args);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  }
);

server.tool(
  "list_models",
  "List Zorixa image and video composer model ids.",
  {},
  async () => {
    const result = await listModels(config);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  }
);

server.tool(
  "get_credits",
  "Zorixa credits balance for the configured user.",
  {},
  async () => {
    const result = await getCredits(config);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
