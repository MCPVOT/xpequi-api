# Claude Code Integration — Pequi API

Connect Claude Code to Pequi's real estate data API in one command.

## Quick Start

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "pequi-api": {
      "command": "npx",
      "args": ["-y", "pequi-mcp-server"]
    }
  }
}
```

## Usage

After restarting Claude Code, try these prompts:

- "Find apartments for rent in Ibagué under 1M COP"
- "Show me 2-bedroom properties in Picaleña for sale"
- "What's the average price per m² in Centro, Ibagué?"
- "Geocode Calle 10 #3-15, Ibagué"

Claude Code will use the `searchProperties`, `getBarrios`, `getBenchmarks`, and `geocode` tools automatically.

## Requirements

- Node.js 18+
- An internet connection (the API is hosted at xpequi.xyz)
- No API key required for FREE tier (30 req/min)
