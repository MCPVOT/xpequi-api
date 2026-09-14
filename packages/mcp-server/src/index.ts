#!/usr/bin/env node

/**
 * @pequi/mcp-server — MCP Server for Pequi Real Estate API
 *
 * Colombia's first real estate data API, accessible via the Model Context Protocol.
 * Exposes 10 tools: property search, neighborhood and benchmark data, geocoding,
 * UVR and IPC indices, mortgage rates, Bogotá UPZ boundaries, cadastral valuations,
 * and the Ley 820 legal rent-increase calculator.
 *
 * CANONICAL SOURCE: this file is the single source of truth for pequi-mcp-server.
 * The MCPVOT/xpequi-api copy must mirror it (see docs/mcp-server-canonical.md).
 *
 * Usage:
 *   pequi-mcp              # stdio mode (for Cursor, Claude Desktop)
 *   PEQUI_API_KEY=xxx pequi-mcp
 *   pequi-mcp --port 3100  # SSE mode (for custom servers)
 *   pequi-mcp --port 3100 --streamable-http  # MCP 2026-07-28 stateless Streamable HTTP
 *
 * Environment:
 *   PEQUI_API_KEY    — API key for authenticated requests (free tier works)
 *   PEQUI_API_URL    — Base URL (default: https://xpequi.xyz/api/v1)
 *   PEQUI_MCP_PORT   — Port for SSE mode (default: 3100)
 */

import { readFileSync } from 'node:fs'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'
import http from 'node:http'
import { createReadStream, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// ─── Configuration ────────────────────────────────────────────────

const API_KEY = process.env.PEQUI_API_KEY || ''
const API_BASE = process.env.PEQUI_API_URL || 'https://xpequi.xyz/api/v1'
const PORT = parseInt(process.env.PEQUI_MCP_PORT || '3100', 10)
// Name and version come from package.json so the published artifact and the
// server's self-report can never disagree (the version had already drifted once).
const pkg = (() => {
  try {
    return JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { name: string; version: string }
  } catch {
    return { name: '@mcpvot/mcp-server', version: '0.0.0' }
  }
})()
const SERVER_NAME = pkg.name
const SERVER_VERSION = pkg.version

// ─── API Client ───────────────────────────────────────────────────

async function apiGet<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') url.searchParams.set(k, v)
    })
  }

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'User-Agent': `${SERVER_NAME}/${SERVER_VERSION}`,
  }
  if (API_KEY) headers['Authorization'] = `Bearer ${API_KEY}`

  const res = await fetch(url.toString(), { headers })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json() as Promise<T>
}

// ─── Zod Schemas ──────────────────────────────────────────────────

const SearchPropertiesSchema = z.object({
  city: z.string().optional().describe('City to search in (default: ibague)'),
  tipo: z.enum(['apartamento', 'casa', 'local', 'oficina', 'lote', 'finca', 'habitacion']).optional().describe('Property type'),
  barrio: z.string().optional().describe('Neighborhood name'),
  estrato: z.coerce.number().min(1).max(6).optional().describe('Socioeconomic stratum (1-6)'),
  min_price: z.coerce.number().optional().describe('Minimum price in COP'),
  max_price: z.coerce.number().optional().describe('Maximum price in COP'),
  cuartos: z.coerce.number().optional().describe('Minimum number of bedrooms'),
  banos: z.coerce.number().optional().describe('Minimum number of bathrooms'),
  operacion: z.enum(['venta', 'arriendo']).optional().describe('Transaction type'),
  limit: z.coerce.number().min(1).max(100).optional().default(20).describe('Results per page'),
  page: z.coerce.number().min(1).optional().default(1).describe('Page number'),
})

const GetBarriosSchema = z.object({
  city: z.string().optional().describe('City (default: ibague)'),
})

const GetBenchmarksSchema = z.object({
  city: z.string().optional().describe('City (default: ibague)'),
  barrio: z.string().optional().describe('Neighborhood name'),
  tipo: z.enum(['apartamento', 'casa', 'local']).optional().describe('Property type'),
  estrato: z.coerce.number().min(1).max(6).optional().describe('Stratum'),
})

const GeocodeSchema = z.object({
  address: z.string().describe('Address to geocode (e.g., "Calle 10 #3-15, Ibagué")'),
})

const GetMortgageRatesSchema = z.object({
  bank: z.string().optional().describe('Filter by bank name (e.g. "Bancolombia", "Davivienda")'),
  product: z.enum(['vivienda_nueva', 'vivienda_usada', 'vis', 'remodelacion', 'lote', 'leasing']).optional().describe('Filter by product type'),
})

const GetUPZsSchema = z.object({
  localidad: z.string().optional().describe('Filter by localidad name (e.g. "Usaquén", "Chapinero")'),
  zone: z.enum(['norte', 'centro', 'occidente', 'sur']).optional().describe('Filter by cardinal zone'),
  hasTransmilenio: z.coerce.boolean().optional().describe('Filter by Transmilenio coverage'),
})

const GetCadastralValuationSchema = z.object({
  localidad: z.string().describe('Localidad name (e.g. "Usaquén", "Chapinero")'),
  estrato: z.coerce.number().min(1).max(6).optional().describe('Filter by stratum (1-6)'),
})

const CalculateRentIncreaseSchema = z.object({
  currentRent: z.coerce.number().positive().describe('Current monthly rent amount in COP'),
  ipc: z.coerce.number().optional().describe('IPC variation rate (defaults to current IPC if not provided)'),
})

// ─── Tool Definitions ─────────────────────────────────────────────

const TOOLS = [
  {
    name: 'search_properties',
    description: `Search for properties in Colombian cities (Ibagué, Bogotá, and expanding). Filter by type, neighborhood, price range, bedrooms, bathrooms, stratum, and transaction type. Returns paginated results with full property details including location, price, features, and GIS coordinates.`,
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'City slug: ibague, bogota, cali, medellin, barranquilla (default: ibague)' },
        tipo: { type: 'string', enum: ['apartamento', 'casa', 'local', 'oficina', 'lote', 'finca', 'habitacion'], description: 'Property type' },
        barrio: { type: 'string', description: 'Neighborhood name' },
        estrato: { type: 'number', description: 'Estrato (1-6)', minimum: 1, maximum: 6 },
        min_price: { type: 'number', description: 'Minimum monthly price in COP' },
        max_price: { type: 'number', description: 'Maximum monthly price in COP' },
        cuartos: { type: 'number', description: 'Minimum bedrooms' },
        banos: { type: 'number', description: 'Minimum bathrooms' },
        operacion: { type: 'string', enum: ['venta', 'arriendo'], description: 'Sale or rent' },
        limit: { type: 'number', description: 'Results per page (1-100)', default: 20 },
        page: { type: 'number', description: 'Page number', default: 1 },
      },
    },
  },
  {
    name: 'get_barrios',
    description: `Get all neighborhoods in a Colombian city with their socioeconomic stratum (estrato), GIS coordinates, and general data. Supports Ibagué (64 barrios), Bogotá (212 barrios), and expanding.`,
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'City slug: ibague, bogota (default: ibague)' },
      },
    },
  },
  {
    name: 'get_benchmarks',
    description: `Get real estate price benchmarks for Colombian cities. Returns average, min, and max prices per square meter broken down by neighborhood, property type, and stratum. Essential for market analysis, investment decisions, and rental comparisons. Supports Ibagué and Bogotá.`,
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'City slug: ibague, bogota (default: ibague)' },
        barrio: { type: 'string', description: 'Filter by neighborhood' },
        tipo: { type: 'string', enum: ['apartamento', 'casa', 'local'], description: 'Filter by property type' },
        estrato: { type: 'number', description: 'Filter by estrato (1-6)', minimum: 1, maximum: 6 },
      },
    },
  },
  {
    name: 'geocode',
    description: `Convert a human-readable address in Colombia to GIS coordinates (latitude, longitude). Useful for mapping properties and understanding locations.`,
    inputSchema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'Address to geocode (e.g., "Calle 10 #3-15, Ibagué" or "Carrera 7 #72-40, Bogotá")' },
      },
      required: ['address'],
    },
  },
  {
    name: 'get_uvr',
    description: `Get the current UVR (Unidad de Valor Real) value from the Banco de la República (Colombia's central bank). UVR is a daily inflation-adjusted unit used for legal rent adjustments under Ley 820/2003, mortgage calculations, and financial indexation. Returns the current value, date, and data source.`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_ipc',
    description: `Get the current trailing 12-month IPC (Índice de Precios al Consumidor) inflation rate from the Banco de la República. IPC is the official Colombian inflation measure used to calculate maximum legal rent increases under Ley 820/2003. Returns the annual variation percentage, reference month, and data source.`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_mortgage_rates',
    description: `Get current mortgage rates from Colombian banks (34 products across 10 banks, per Superfinanciera). Each product includes effective annual rate (TEA), UVR spread, max term, LTV range, monthly payment per COP 1M, and year-over-year change.`,
    inputSchema: {
      type: 'object',
      properties: {
        bank: { type: 'string', description: 'Filter by bank name (e.g. "Bancolombia", "Davivienda", "Banco de Bogotá", "BBVA")' },
        product: { type: 'string', enum: ['vivienda_nueva', 'vivienda_usada', 'vis', 'remodelacion', 'lote', 'leasing'], description: 'Filter by product type' },
      },
    },
  },
  {
    name: 'get_upzs',
    description: `Query Bogotá UPZ (Unidad de Planeamiento Zonal) boundary data — 117 planning units across all 20 localidades. Each UPZ includes bounding box, area, predominant land use, estrato range, building height limits, and Transmilenio coverage.`,
    inputSchema: {
      type: 'object',
      properties: {
        localidad: { type: 'string', description: 'Filter by localidad name (e.g. "Usaquén", "Chapinero", "Suba")' },
        zone: { type: 'string', enum: ['norte', 'centro', 'occidente', 'sur'], description: 'Filter by cardinal zone' },
        hasTransmilenio: { type: 'boolean', description: 'Filter by Transmilenio trunk line coverage' },
      },
    },
  },
  {
    name: 'get_cadastral_valuation',
    description: `Get IGAC cadastral reference values (avalúo catastral) for Bogotá by localidad and socioeconomic stratum: cadastral value per m², land value per m², estimated market price per m², and year-over-year change. These values determine impuesto predial.`,
    inputSchema: {
      type: 'object',
      properties: {
        localidad: { type: 'string', description: 'Localidad name (e.g. "Usaquén", "Chapinero", "Suba"). Required.' },
        estrato: { type: 'number', description: 'Filter by socioeconomic stratum (1-6)', minimum: 1, maximum: 6 },
      },
      required: ['localidad'],
    },
  },
  {
    name: 'calculate_rent_increase',
    description: `Calculate the maximum legal rent increase in Colombia under Ley 820/2003 using the current IPC inflation rate (or a provided rate). Input: current monthly rent in COP. Output: adjusted rent, increase amount, increase percentage, and the legal formula reference.`,
    inputSchema: {
      type: 'object',
      properties: {
        currentRent: { type: 'number', description: 'Current monthly rent amount in COP (e.g., 1500000)' },
        ipc: { type: 'number', description: 'Optional IPC variation rate to use (e.g., 5.82). Defaults to current IPC from BanRep if not provided.' },
      },
      required: ['currentRent'],
    },
  },
]

// ─── MCP Server ───────────────────────────────────────────────────

// MCP protocol revision: 2026-07-28 (stateless servers, Streamable HTTP).
// The SDK negotiates the highest mutually-supported version during initialize;
// declaring it here advertises c402's MCP surface as latest-spec.
const PROTOCOL_VERSION = '2026-07-28'

const server = new Server(
  { name: SERVER_NAME, version: SERVER_VERSION },
  {
    capabilities: { tools: {}, resources: {} },
    instructions:
      'Pequi — Colombia real estate data via c402. Paid calls use HTTP 402 ' +
      '(X-402-Challenge / X-402-Payment-Id, COP via Wompi). Free tier available.',
  },
)

// List Tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}))

// Call Tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      case 'search_properties': {
        const params = SearchPropertiesSchema.parse(args || {})
        const data = await apiGet('/properties', {
          city: params.city || 'ibague',
          tipo: params.tipo,
          barrio: params.barrio,
          estrato: params.estrato?.toString(),
          precio_min: params.min_price?.toString(),
          precio_max: params.max_price?.toString(),
          cuartos: params.cuartos?.toString(),
          banos: params.banos?.toString(),
          operacion: params.operacion,
          limit: params.limit?.toString() || '20',
          page: params.page?.toString() || '1',
        })
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(data, null, 2),
          }],
        }
      }

      case 'get_barrios': {
        const params = GetBarriosSchema.parse(args || {})
        const data = await apiGet('/barrios', { city: params.city || 'ibague' })
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(data, null, 2),
          }],
        }
      }

      case 'get_benchmarks': {
        const params = GetBenchmarksSchema.parse(args || {})
        const data = await apiGet('/benchmarks', {
          city: params.city,
          barrio: params.barrio,
          tipo: params.tipo,
          estrato: params.estrato?.toString(),
        })
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(data, null, 2),
          }],
        }
      }

      case 'geocode': {
        const params = GeocodeSchema.parse(args || {})
        const data = await apiGet('/geocode', { address: params.address })
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(data, null, 2),
          }],
        }
      }

            case 'get_uvr': {
        const data = await apiGet('/uvr')
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(data, null, 2),
          }],
        }
      }

      case 'get_ipc': {
        const data = await apiGet('/ipc')
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(data, null, 2),
          }],
        }
      }

      case 'get_mortgage_rates': {
        const params = GetMortgageRatesSchema.parse(args || {})
        const data = await apiGet('/mortgage-rates', {
          bank: params.bank,
          product: params.product,
        })
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        }
      }

      case 'get_upzs': {
        const params = GetUPZsSchema.parse(args || {})
        const data = await apiGet('/bogota/upz', {
          localidad: params.localidad,
          zone: params.zone,
          hasTransmilenio: params.hasTransmilenio?.toString(),
        })
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        }
      }

      case 'get_cadastral_valuation': {
        const params = GetCadastralValuationSchema.parse(args || {})
        const data = await apiGet('/bogota/cadastral', {
          localidad: params.localidad,
          estrato: params.estrato?.toString(),
        })
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        }
      }

      case 'calculate_rent_increase': {
        // POST: the endpoint takes a body (currentRent, optional ipc)
        const params = CalculateRentIncreaseSchema.parse(args || {})
        const url = new URL(`${API_BASE}/rent-increase`)
        const headers: Record<string, string> = {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': `${SERVER_NAME}/${SERVER_VERSION}`,
        }
        if (API_KEY) headers['Authorization'] = `Bearer ${API_KEY}`
        const res = await fetch(url.toString(), {
          method: 'POST',
          headers,
          body: JSON.stringify({ currentRent: params.currentRent, ipc: params.ipc }),
        })
        if (!res.ok) {
          const text = await res.text().catch(() => '')
          throw new Error(`API ${res.status}: ${text.slice(0, 200)}`)
        }
        const result = await res.json()
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2),
          }],
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  } catch (err) {
    const message = err instanceof z.ZodError
      ? `Invalid arguments: ${err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')}`
      : err instanceof Error ? err.message : 'Unknown error'
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    }
  }
})

// Resources
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: 'pequi://ibague',
      name: 'Ibagué Metadata',
      description: 'Complete metadata about Ibagué: 64 neighborhoods, estratos, coordinates, and general city data.',
      mimeType: 'application/json',
    },
    {
      uri: 'pequi://bogota',
      name: 'Bogotá Metadata',
      description: 'Complete metadata about Bogotá: 212 neighborhoods, estratos, coordinates, and general city data.',
      mimeType: 'application/json',
    },
    {
      uri: 'pequi://open-finance',
      name: 'Open Finance Decreto 0368',
      description: 'Summary of Colombia\'s Open Finance decree and how Pequi is building the first real estate data API.',
      mimeType: 'text/markdown',
    },
  ],
}))

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri

  try {
    switch (uri) {
      case 'pequi://ibague': {
        const data = await apiGet('/barrios', { city: 'ibague' })
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(data, null, 2),
          }],
        }
      }

      case 'pequi://bogota': {
        const data = await apiGet('/barrios', { city: 'bogota' })
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(data, null, 2),
          }],
        }
      }

      case 'pequi://open-finance': {
        const md = [
          '# Open Finance en Colombia — Decreto 0368',
          '',
          'El 7 de abril de 2026, Colombia expidió el Decreto 0368, obligando a todas las instituciones financieras a abrir datos mediante APIs para Terceros Proveedores Autorizados (TPPs).',
          '',
          '## Implicaciones para Pequi',
          '',
          'Pequi está construyendo la **primera API de datos inmobiliarios de Colombia**, empezando por Ibagué. Esto significa:',
          '',
          '- Propiedades con filtros por tipo, precio, barrio, estrato, coordenadas',
          '- 85 barrios de Ibagué mapeados con estrato y GIS',
          '- Precios de referencia por m² (benchmarks de mercado)',
          '- Contratos Ley 820 con firma digital',
          '- Pagos seguros via Wompi',
          '',
          '## Modelo de Negocio',
          '',
          '| Tier | Precio COP/mes | Req/día |',
          '|------|---------------|---------|',
          '| FREE | $0 | 150 |',
          '| AGENTE | $30,000 | 1,000 |',
          '| CONJUNTO | $150,000 | 5,000 |',
          '| ENTERPRISE | Personalizado | 50,000+ |',
          '',
          '## Más Información',
          '',
          '- Web: https://xpequi.xyz',
          '- Blog: https://xpequi.xyz/blog/open-finance-decreto-0368',
          '- API Docs: pronto en /developers',
        ].join('\n')
        return {
          contents: [{
            uri,
            mimeType: 'text/markdown',
            text: md,
          }],
        }
      }

      default:
        throw new Error(`Unknown resource: ${uri}`)
    }
  } catch (err) {
    throw new Error(`Resource error: ${err instanceof Error ? err.message : 'Unknown'}`)
  }
})

// ─── Startup ──────────────────────────────────────────────────────

async function main() {
  const useStdio = !process.argv.includes('--port')
  const useStreamable = process.argv.includes('--streamable-http') || process.env.PEQUI_MCP_STREAMABLE === '1'
  const transportName = useStdio ? 'stdio' : useStreamable ? 'streamable-http' : 'SSE'

  console.error(`[${SERVER_NAME}] MCP protocol revision: ${PROTOCOL_VERSION} (${useStreamable ? 'stateless Streamable HTTP' : 'legacy transport'})`)

  console.error(`[${SERVER_NAME}] Starting v${SERVER_VERSION} (${transportName} transport)`)
  console.error(`[${SERVER_NAME}] API: ${API_BASE}${API_KEY ? ' (authenticated)' : ' (unauthenticated, limited)'}`)

  if (useStdio) {
    const transport = new StdioServerTransport()
    await server.connect(transport)
  } else if (useStreamable) {
    // MCP 2026-07-28: stateless Streamable HTTP — each POST /mcp is self-contained.
    // Auth is per-request via c402 API key (Authorization: Bearer), no session affinity.
    const { StreamableHTTPServerTransport } = await import(
      '@modelcontextprotocol/sdk/server/streamableHttp.js'
    )
    const httpServer = http.createServer(async (req, res) => {
      const url = new URL(req.url || '/', `http://localhost:${PORT}`)
      if (url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ status: 'ok', server: SERVER_NAME, version: SERVER_VERSION, protocol: PROTOCOL_VERSION }))
        return
      }
      if (url.pathname !== '/mcp') {
        res.writeHead(404)
        res.end('Not found')
        return
      }
      // Stateless per-request transport instance — safe for horizontal scale.
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
      res.on('close', () => void transport.close())
      await server.connect(transport)
      await transport.handleRequest(req, res)
    })
    httpServer.listen(PORT, '127.0.0.1', () => {
      console.error(`[${SERVER_NAME}] Streamable HTTP (2026-07-28) listening on http://localhost:${PORT}/mcp`)
      console.error(`[${SERVER_NAME}] Health: http://localhost:${PORT}/health`)
    })
  } else {
    const transport = new SSEServerTransport('/mcp', new http.ServerResponse({} as any))
    // SSE transport handled via HTTP server
    const httpServer = http.createServer(async (req, res) => {
      if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ status: 'ok', server: SERVER_NAME, version: SERVER_VERSION }))
        return
      }
      res.writeHead(404)
      res.end('Not found')
    })
    httpServer.listen(PORT, '127.0.0.1', () => {
      console.error(`[${SERVER_NAME}] SSE server listening on http://localhost:${PORT}/mcp`)
      console.error(`[${SERVER_NAME}] Health: http://localhost:${PORT}/health`)
    })
  }
}

main().catch((err) => {
  console.error(`[${SERVER_NAME}] Fatal:`, err)
  process.exit(1)
})
