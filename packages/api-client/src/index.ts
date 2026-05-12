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
  id: string
  name: string
  estrato: number
  coordinates?: { lat: number; lng: number } | null
  location: string
  description: string
}

export interface Benchmark {
  tipo: string
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

export interface Contract {
  contractText: string
  templateUsed: string
}

export interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  redirectUrl?: string
  createdAt: string
}

export interface Complex {
  id: string
  name: string
  slug: string
  description?: string
  address: string
  city: string
  amenities?: string[]
  totalUnits?: number
  availableUnits?: number
  images?: string[]
}

export interface BuildingUnit {
  id: string
  unitNumber: string
  floor?: number
  status: string
  monthlyRent?: number
  salePrice?: number
}

// ─── Params ─────────────────────────────────────────────────────

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

export interface GenerateContractParams {
  landlordName: string
  landlordCedula: string
  tenantName: string
  tenantCedula: string
  propertyAddress: string
  propertyMatricula?: string
  rentAmount: number
  currency?: string
  startDate: string
  endDate: string
  paymentDueDate?: number
  utilityDeposit?: number
  additionalClauses?: string
}

export interface CreatePaymentParams {
  userId: string
  propertyId?: string
  tenancyId?: string
  amount: number
  paymentType?: string
  email?: string
  name?: string
  method?: 'card' | 'transfer' | 'nequi' | 'daviplata' | 'cash'
}

export interface Visit {
  id: string
  propertyId: string
  date: string
  time: string
  status: string
  notes?: string
  createdAt: string
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatResponse {
  response: string
  sessionId?: string
}

export interface UploadResult {
  url: string
  fileName: string
  size: number
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

  private async post<T>(path: string, body: unknown): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`
    const res = await fetch(`${this.baseUrl}${path}`, { method: 'POST', headers, body: JSON.stringify(body) })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Pequi API ${res.status}: ${text.slice(0, 200)}`)
    }
    return res.json() as Promise<T>
  }

  private async postForm<T>(path: string, formData: FormData): Promise<T> {
    const headers: Record<string, string> = { 'Accept': 'application/json' }
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`
    const res = await fetch(`${this.baseUrl}${path}`, { method: 'POST', headers, body: formData })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Pequi API ${res.status}: ${text.slice(0, 200)}`)
    }
    return res.json() as Promise<T>
  }

  // ── Properties ──────────────────────────────────────────────────

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
    return data.data || data.properties || data
  }

  async getBarrios(city = 'ibague'): Promise<Barrio[]> {
    const data = await this.get<any>('/barrios', { city })
    return data.data || data
  }

  async getBenchmarks(params?: BenchmarkParams): Promise<Benchmark[]> {
    const data = await this.get<any>('/benchmarks', {
      barrio: params?.barrio,
      tipo: params?.tipo,
      estrato: params?.estrato?.toString(),
    })
    return data.data || data
  }

  async geocode(address: string): Promise<GeocodeResult> {
    const data = await this.get<any>('/geocode', { address })
    return data.data || data
  }

  // ── Contracts ───────────────────────────────────────────────────

  async generateContract(params: GenerateContractParams): Promise<Contract> {
    const data = await this.post<any>('/contracts', params)
    return data.data || data
  }

  // ── Payments ────────────────────────────────────────────────────

  async createPayment(params: CreatePaymentParams): Promise<{ id: string; redirectUrl: string }> {
    const data = await this.post<any>('/payments', params)
    return data.data || data
  }

  async getPaymentStatus(paymentId: string): Promise<Payment> {
    const data = await this.get<any>(`/payments/${paymentId}`)
    return data.data || data
  }

  // ── Complexes ───────────────────────────────────────────────────

  async getComplex(slug: string): Promise<Complex> {
    const data = await this.get<any>(`/complexes/${slug}`)
    return data.data || data
  }

  async listComplexes(): Promise<Complex[]> {
    const data = await this.get<any>('/complexes')
    return data.data || data
  }

  async getComplexUnits(slug: string): Promise<BuildingUnit[]> {
    const data = await this.get<any>(`/complexes/${slug}/units`)
    return data.data || data
  }

  // ── Visits ──────────────────────────────────────────────────────

  async scheduleVisit(propertyId: string, date: string, time: string, notes?: string): Promise<Visit> {
    return this.post<any>('/visits', { propertyId, date, time, notes })
  }

  async listMyVisits(): Promise<Visit[]> {
    const data = await this.get<any>('/visits/mine')
    return data.data || data
  }

  // ── Chat ────────────────────────────────────────────────────────

  async sendMessage(message: string, sessionId?: string): Promise<ChatResponse> {
    return this.post<any>('/chat', { message, sessionId })
  }

  // ── Uploads ─────────────────────────────────────────────────────

  async uploadFile(file: File | Blob, fileName?: string): Promise<UploadResult> {
    const formData = new FormData()
    formData.append('file', file, fileName)
    return this.postForm<any>('/upload', formData)
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
