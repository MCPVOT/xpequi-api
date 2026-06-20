# pequi-opencode-plugin

OpenCode plugin for Pequi — Colombian real estate data, right inside your coding agent.

## Installation

```bash
opencode plugin install pequi-opencode-plugin
```

Set your API key (optional — FREE tier works without one):

```bash
export PEQUI_API_KEY=pk_live_your_key_here
```

## Usage

Once installed, you can ask OpenCode:

- "Show me apartments in Ibagué" → uses `searchProperties`
- "List neighborhoods in Ibagué" → uses `getBarrios`
- "What are the price benchmarks?" → uses `getBenchmarks`
- "Geocode this address" → uses `geocode`

## Tools

| Tool | Description |
|------|-------------|
| `searchProperties` | Search properties by city, type, price, bedrooms, bathrooms |
| `getBarrios` | List neighborhoods with estratos and coordinates |
| `getBenchmarks` | Price per m² by barrio, type, estrato |
| `geocode` | Convert address to coordinates |

## Requirements

- Node.js 18+
- OpenCode CLI installed
