# @MCPVOT/mcp-server

> MCP server for Pequi — Colombia's first real estate data API.

Search properties, lookup neighborhoods, get price benchmarks, geocode addresses, fetch live UVR/IPC financial indicators, and calculate legal rent increases — all in **Ibagué** (64 barrios) and **Bogotá** (212 barrios, 20 localidades) — through the [Model Context Protocol](https://modelcontextprotocol.io).

## Tools

| Tool | Description | Cost |
|------|-------------|------|
| `search_properties` | Search properties by type, price, location, bedrooms | ✅ FREE |
| `get_barrios` | List all neighborhoods with estrato, GIS data | ✅ FREE |
| `get_benchmarks` | Price per m² benchmarks by neighborhood | ✅ FREE |
| `geocode` | Convert address to GPS coordinates | ✅ FREE |
| `get_uvr` | Current UVR value (daily, from Banco de la República) | ✅ FREE |
| `get_ipc` | Current IPC inflation rate (trailing 12-month) | ✅ FREE |
| `calculate_rent_increase` | Max legal rent increase under Ley 820/2003 | ✅ FREE |

## Resources

| URI | Description |
|-----|-------------|
| `pequi://ibague` | Complete Ibagué metadata (64 barrios) |
| `pequi://bogota` | Complete Bogotá metadata (212 barrios) |
| `pequi://open-finance` | Open Finance Decreto 0368 summary |
| `pequi://colombia-finance` | Live UVR + IPC financial indicators |

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
| `search_properties` | Search properties in Colombian cities (Ibagué, Bogotá, expanding) | city, tipo, barrio, estrato, min_price, max_price, cuartos, banos, operacion, limit, page |
| `get_barrios` | Get all neighborhoods with estrato and GIS data | city (ibague, bogota) |
| `get_benchmarks` | Price benchmarks per m² by city and neighborhood | city, barrio, tipo, estrato |
| `geocode` | Convert address to coordinates | address (required) |

## Resources

| URI | Description |
|-----|------------|
| `pequi://ibague` | Full Ibagué metadata — 64 neighborhoods with estratos, GIS coordinates |
| `pequi://bogota` | Full Bogotá metadata — 212 neighborhoods across 20 localidades |
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
- **API Docs:** https://xpequi.xyz/developers
- **Blog:** https://xpequi.xyz/blog/open-finance-decreto-0368
- **GitHub:** https://github.com/MCPVOT/pequi/tree/master/packages/mcp-server
- **npm:** `@MCPVOT/mcp-server`

## License

MIT © Pequi
