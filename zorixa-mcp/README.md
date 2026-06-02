# Zorixa MCP (Cursor)

MCP server that calls **zorixaai.com** APIs so image/video generations appear in your **Zorixa dashboard history** (same as the web app).

## Setup (recommended — per-user API key)

1. Sign in at [zorixaai.com](https://www.zorixaai.com) → **Dashboard → API Access** → **Generate key**.
2. Copy the key (`zrx_live_…`) — shown once.
3. Install and wire Cursor:

```bash
cd zorixa-mcp
npm install
```

In **Cursor → Settings → MCP**:

```json
{
  "mcpServers": {
    "zorixa": {
      "command": "node",
      "args": ["F:/zorixa-ai/zorixa-mcp/src/index.js"],
      "env": {
        "ZORIXA_API_KEY": "zrx_live_…",
        "ZORIXA_API_BASE_URL": "https://www.zorixaai.com"
      }
    }
  }
}
```

Adjust the path to `index.js` for your machine.

Credits are deducted from **your** Zorixa account (same balance as the website).

## Legacy (site owner / internal)

Set `ZORIXA_MCP_API_KEY` on Vercel and use `ZORIXA_MCP_API_KEY` + `ZORIXA_USER_ID` in MCP env instead of `ZORIXA_API_KEY`. Do not share the global secret with customers.

## Tools

| Tool | Description |
|------|-------------|
| `generate_image` | POST `/api/generate-image`, poll, log to dashboard |
| `generate_video` | POST `/api/generate-video`, poll, log to dashboard |
| `list_models` | GET `/api/mcp/models` |
| `get_credits` | GET `/api/mcp/credits` |

Atlas API key stays on the server (`ATLASCLOUD_API_KEY`); clients only need a Zorixa API key.

## Database

Run `supabase/migrations/20260531_user_api_keys.sql` in Supabase SQL Editor before using per-user keys in production.

## Example prompts in Cursor

- “Use Zorixa to generate a 16:9 image with gpt-image-2: sunset over Marrakech medina”
- “Generate a 5s Seedance 2 video, text mode, prompt: …”
