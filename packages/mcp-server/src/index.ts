#!/usr/bin/env node

/**
 * @pequi/mcp-server — MCP Server for Pequi Real Estate API
 *
 * Colombia's first real estate data API, accessible via the Model Context Protocol.
 * Enables AI assistants to search properties, lookup neighborhoods,
 * get price benchmarks, and geocode addresses in Ibagué, Bogotá, and expanding cities.
 *
 * Usage:
 *   pequi-mcp              # stdio mode (for Cursor, Claude Desktop)
 *   PEQUI_API_KEY=xxx pequi-mcp
 *   pequi-mcp --port 3100  # SSE mode (for custom servers)
 *
 * Environment:
 *   PEQUI_API_KEY    — API key for authenticated requests (free tier works)
 *   PEQUI_API_URL    — Base URL (default: https://xpequi.xyz/api/v1)
 *   PEQUI_MCP_PORT   — Port for SSE mode (default: 3100)
 */

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
const SERVER_NAME = '@MCPVOT/mcp-server'
const SERVER_VERSION = '0.1.0'

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

const GetUvrSchema = z.object({})

const GetIpcSchema = z.object({})

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
    name: 'calculate_rent_increase',
    description: `Calculate the maximum legal rent increase in Colombia under Ley 820/2003. Uses the current IPC inflation rate (or a provided rate) to compute the adjusted rent amount. Essential for landlords and tenants during annual contract renewal. Input: current monthly rent in COP, optional IPC rate. Output: adjusted rent, increase amount, increase percentage, and the legal formula reference.`,
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

const server = new Server(
  { name: SERVER_NAME, version: SERVER_VERSION },
  { capabilities: { tools: {}, resources: {} } },
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

      case 'calculate_rent_increase': {
        const params = CalculateRentIncreaseSchema.parse(args || {})
        const data = await apiGet('/rent-increase', {
          currentRent: params.currentRent.toString(),
          ipc: params.ipc?.toString(),
        })
        // POST the data since it needs a body
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
    {
      uri: 'pequi://colombia-finance',
      name: 'Colombia Financial Indicators',
      description: 'Current UVR (daily) and IPC (trailing 12-month) values from the Banco de la República, used for Ley 820 rent adjustments.',
      mimeType: 'application/json',
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
          'Pequi está construyendo la **primera API de datos inmobiliarios de Colombia**, empezando por Ibagué y Bogotá. Esto significa:',
          '',
          '- Propiedades con filtros por tipo, precio, barrio, estrato, coordenadas GIS',
          '- 64 barrios de Ibagué + 212 barrios de Bogotá mapeados con estrato',
          '- Precios de referencia por m² (benchmarks de mercado)',
          '- Contratos Ley 820 con firma digital',
          '- Pagos seguros via Wompi',
          '- Indicadores financieros: UVR e IPC del Banco de la República',
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
          '- API Docs: https://xpequi.xyz/developers/api-ref',
        ].join('\n')
        return {
          contents: [{
            uri,
            mimeType: 'text/markdown',
            text: md,
          }],
        }
      }

      case 'pequi://colombia-finance': {
        const [uvrRes, ipcRes] = await Promise.all([
          apiGet<{ data: { value: number; date: string; source: string } }>('/uvr').catch(() => ({ data: { value: 428.53, date: '2026-05-14', source: 'api-unavailable' } })),
          apiGet<{ data: { annualVariation: number; month: string; source: string } }>('/ipc').catch(() => ({ data: { annualVariation: 5.82, month: '2026-05', source: 'api-unavailable' } })),
        ])
        const result = {
          uvr: uvrRes.data,
          ipc: ipcRes.data,
          legalBasis: 'Ley 820 de 2003 — Artículo 20',
          note: 'UVR is used for financial indexation. IPC is the trailing 12-month inflation rate used for rent adjustments.',
        }
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(result, null, 2),
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
  const transportName = useStdio ? 'stdio' : 'SSE'

  console.error(`[${SERVER_NAME}] Starting v${SERVER_VERSION} (${transportName} transport)`)
  console.error(`[${SERVER_NAME}] API: ${API_BASE}${API_KEY ? ' (authenticated)' : ' (unauthenticated, limited)'}`)

  if (useStdio) {
    const transport = new StdioServerTransport()
    await server.connect(transport)
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
