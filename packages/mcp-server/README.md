# @MCPVOT/mcp-server

> MCP server for Pequi — Colombia's first real estate data API.

Search properties, lookup neighborhoods, get price benchmarks, and geocode addresses in Ibagué, Tolima — all through the [Model Context Protocol](https://modelcontextprotocol.io).

## Quick Start

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "pequi": {
      "command": "npx",
      "args": ["-y", "@MCPVOT/mcp-server"]
    }
  }
}
```

### Cursor

In Cursor Settings → MCP Servers → Add:

| Field | Value |
|-------|-------|
| Name | `pequi` |
| Type | `command` |
| Command | `npx -y @MCPVOT/mcp-server` |

### VS Code + GitHub Copilot

```json
{
  "github.copilot.chat.mcpServers": {
    "pequi": {
      "command": "npx",
      "args": ["-y", "@MCPVOT/mcp-server"]
    }
  }
}
```

## Tools

| Tool | Description | Inputs |
|------|-------------|--------|
| `search_properties` | Search properties in Ibagué | city, tipo, barrio, estrato, min_price, max_price, cuartos, banos, operacion, limit, page |
| `get_barrios` | Get all neighborhoods with estrato and GIS data | city |
| `get_benchmarks` | Price benchmarks per m² | barrio, tipo, estrato |
| `geocode` | Convert address to coordinates | address (required) |

## Resources

| URI | Description |
|-----|------------|
| `pequi://ibague` | Full Ibagué metadata (neighborhoods, estratos, coordinates) |
| `pequi://open-finance` | Decreto 0368 summary + Pequi API platform info |

## Advanced Usage

### With API Key (higher rate limits)

```bash
PEQUI_API_KEY=pk_live_xxx npx -y @MCPVOT/mcp-server
```

### SSE mode (for custom integrations)

```bash
npx -y @MCPVOT/mcp-server --port 3100
```

Then connect to `http://localhost:3100/mcp`.

### Inspect with MCP Inspector

```bash
npx -y @MCPVOT/mcp-server
# In another terminal:
npx @modelcontextprotocol/inspector node node_modules/@MCPVOT/mcp-server/dist/index.js
```

## Data Privacy

This MCP server only accesses **aggregate, anonymized data** through the Pequi API. No personal data (names, IDs, phone numbers, emails) is ever exposed. See [Ley 1581/2012](https://xpequi.xyz/legal) for details.

## Links

- **Website:** https://xpequi.xyz
- **API Docs:** https://xpequi.xyz/developers (coming soon)
- **Blog:** https://xpequi.xyz/blog/open-finance-decreto-0368
- **GitHub:** https://github.com/MCPVOT/pequi/tree/master/packages/mcp-server
- **npm:** `@MCPVOT/mcp-server`

## License

MIT © Pequi
