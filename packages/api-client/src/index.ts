import { z } from 'zod'

// ─── Types ────────────────────────────────────────────────────────

export interface Property {
  id: string
  name: string
  address: string
  city: string
  department: string
  propertyType: 'APARTMENT' | 'HOUSE' | 'COMMERCIAL' | 'LAND' | 'FARM' | 'ROOM'
  listingType: 'SALE' | 'RENT'
  bedrooms: number
  bathrooms: number
  area: number
  salePrice?: number
  monthlyRent?: number
  latitude?: number
  longitude?: number
  estrato?: number
  description?: string
  images?: string[]
  createdAt: string
}

export interface Barrio {
  name: string
  estrato: number
  latitude: number
  longitude: number
  description?: string
}

export interface Benchmark {
  barrio: string
  tipo: string
  estrato: number
  precioPromedioM2: number
  precioMinM2: number
  precioMaxM2: number
  muestras: number
}

export interface GeocodeResult {
  lat: number
  lng: number
  displayName: string
}

export interface PropertySearchParams {
  city?: string
  tipo?: string
  barrio?: string
  estrato?: number
  minPrice?: number
  maxPrice?: number
  cuartos?: number
  banos?: number
  operacion?: 'venta' | 'arriendo'
  limit?: number
  page?: number
}

export interface BenchmarkParams {
  barrio?: string
  tipo?: string
  estrato?: number
}

// ─── Client ───────────────────────────────────────────────────────

export class PequiClient {
  private baseUrl: string
  private apiKey: string

  constructor(options?: { baseUrl?: string; apiKey?: string }) {
    this.baseUrl = options?.baseUrl || 'https://xpequi.xyz/api/v1'
    this.apiKey = options?.apiKey || ''
  }

  private async get<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`)
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') url.searchParams.set(k, v)
      })
    }
    const headers: Record<string, string> = { 'Accept': 'application/json' }
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`

    const res = await fetch(url.toString(), { headers })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Pequi API ${res.status}: ${text.slice(0, 200)}`)
    }
    return res.json() as Promise<T>
  }

  async searchProperties(params?: PropertySearchParams): Promise<Property[]> {
    const data = await this.get<any>('/properties', {
      city: params?.city || 'ibague',
      tipo: params?.tipo,
      barrio: params?.barrio,
      estrato: params?.estrato?.toString(),
      precio_min: params?.minPrice?.toString(),
      precio_max: params?.maxPrice?.toString(),
      cuartos: params?.cuartos?.toString(),
      banos: params?.banos?.toString(),
      operacion: params?.operacion,
      limit: params?.limit?.toString() || '20',
      page: params?.page?.toString() || '1',
    })
    return data.properties || data.data || data
  }

  async getBarrios(city = 'ibague'): Promise<Barrio[]> {
    return this.get<Barrio[]>('/barrios', { city })
  }

  async getBenchmarks(params?: BenchmarkParams): Promise<Benchmark[]> {
    return this.get<Benchmark[]>('/benchmarks', {
      barrio: params?.barrio,
      tipo: params?.tipo,
      estrato: params?.estrato?.toString(),
    })
  }

  async geocode(address: string): Promise<GeocodeResult> {
    return this.get<GeocodeResult>('/geocode', { address })
  }
}

// ─── Default instance ────────────────────────────────────────────

let defaultClient: PequiClient | null = null

export function getClient(options?: { apiKey?: string }): PequiClient {
  if (!defaultClient || options?.apiKey) {
    defaultClient = new PequiClient({ apiKey: options?.apiKey })
  }
  return defaultClient
}
