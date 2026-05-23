# Zorixa MCP (Cursor)

MCP server that calls **zorixaai.com** APIs so image/video generations appear in your **Zorixa dashboard history** (same as the web app).

## Setup

1. On **Vercel** (zorixaai.com), set `ZORIXA_MCP_API_KEY` to a long random secret.
2. Copy the same value locally in `zorixa-mcp/.env` (see `.env.example`).
3. Set `ZORIXA_USER_ID` to your Supabase user UUID (`users_profiles.id`).
4. Install and wire Cursor:

```bash
cd zorixa-mcp
npm install
```

In **Cursor → Settings → MCP**, add a server (or merge into your MCP config):

```json
{
  "mcpServers": {
    "zorixa": {
      "command": "node",
      "args": ["F:/zorixa-ai/zorixa-mcp/src/index.js"],
      "env": {
        "ZORIXA_MCP_API_KEY": "...",
        "ZORIXA_USER_ID": "...",
        "ZORIXA_API_BASE_URL": "https://www.zorixaai.com"
      }
    }
  }
}
```

Adjust the path to `index.js` for your machine.

## Tools

| Tool | Description |
|------|-------------|
| `generate_image` | POST `/api/generate-image`, poll, log to dashboard |
| `generate_video` | POST `/api/generate-video`, poll, log to dashboard |
| `list_models` | GET `/api/mcp/models` |
| `get_credits` | GET `/api/mcp/credits` |

Atlas API key stays on the server (`ATLASCLOUD_API_KEY`); Cursor only needs the Zorixa MCP key + user id.

## Example prompts in Cursor

- “Use Zorixa to generate a 16:9 image with gpt-image-2: sunset over Marrakech medina”
- “Generate a 5s Seedance 2 video, text mode, prompt: …”

## Deploy API routes

After changing `app/api/mcp/*` or `lib/zorixa-mcp-auth.ts`, push to `main` and deploy Vercel so production accepts your MCP key.
