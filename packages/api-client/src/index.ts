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
  estrato: number | number[]
  coordinates?: { lat: number; lng: number } | null
  location: string
  description: string
}

export interface Benchmark {
  barrio: string
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

export interface AVMRequest {
  area: number
  bedrooms: number
  bathrooms: number
  propertyType: 'APARTMENT' | 'HOUSE' | 'COMMERCIAL' | 'LAND' | 'FARM' | 'ROOM'
  barrio: string
  city: string
  lat?: number
  lng?: number
}

export interface AVMResult {
  estimatedValue: number
  confidenceRange: { low: number; high: number }
  uncertainty: { p10: number; p90: number }
  pricePerM2: number
  comparableProperties: Array<{
    id: string
    title: string
    price: number
    area: number
    distance_km: number | null
  }>
  modelVersion: string
  generatedAt: string
}

export interface UVRData {
  value: number
  date: string
  source: string
}

export interface IPCData {
  value: number
  year: number
  source: string
}

export interface RentIncreaseParams {
  currentRent: number
  startDate: string
  months?: number
}

export interface RentIncreaseResult {
  currentRent: number
  newRent: number
  increaseAmount: number
  increasePercentage: number
  ipcUsed: number
  monthsApplied: number
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

export interface CreditBalance {
  balance: number
  packs: Array<{ calls: number; priceCOP: number }>
}

export interface CreditPurchaseResult {
  id: string
  redirectUrl: string
}

export interface SubscriptionCheckoutResult {
  id: string
  redirectUrl: string
}

export interface UsageData {
  hourly: number
  credits: number
  tier: string
  rateLimit: { perMinute: number; perDay: number }
}

export interface LatencyPoint {
  hour: string
  value: number
  samples: number
}

export interface ErrorBreakdown {
  route: string
  '4xx': number
  '5xx': number
  total: number
}

export interface UptimeData {
  successRate: number
  total: number
  errors: number
  window: string
}

export interface WebhookEndpoint {
  id: string
  url: string
  events: string[]
  isActive: boolean
  lastDelivery: string | null
  lastStatus: number | null
  createdAt: string
}

export interface UPZData {
  code: string
  name: string
  localidad: string
  zone: string
  center: { lat: number; lng: number }
  bbox: [number, number, number, number]
  areaHas: number
  usoPredominante: string
  estratoRange: [number, number]
  alturasPisos: number
  hasTransmilenio: boolean
}

export interface CadastralValuationData {
  localidad: string
  zone: string
  estrato: number
  valorReferenciaM2: number
  valorTerrenoM2: number
  vigencia: string
  mercadoEstimadoM2: number
  cambioPorcentual: number
}

export interface MortgageRateData {
  banco: string
  tipoProducto: string
  tipoTasa: 'fija' | 'uvr_mas_spread'
  tea: number
  spreadUvrBps?: number
  plazoMaxMeses: number
  ltvMin: number
  ltvMax: number
  cuotaPorMillon: number
  montoMinimo: number
  esVis: boolean
  fechaCorte: string
  cambioAnualBps: number
}

export interface BankVerificationResult {
  verified: boolean
  bankName: string
  accountType: string
  accountNumber: string
  ownerName: string
  documentType: string
  documentNumber: string
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

export interface BankVerificationParams {
  bankCode: string
  accountNumber: string
  accountType: string
  documentNumber: string
  documentType: string
}

// ─── API Error ──────────────────────────────────────────────────

export class PequiApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public recoverable: boolean = false,
    public retryAfter?: number,
    public requestId?: string,
    public details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'PequiApiError'
  }

  static async fromResponse(res: Response): Promise<PequiApiError> {
    let body: Record<string, unknown> = {}
    try {
      body = await res.json()
    } catch {
      // Non-JSON response
    }
    return new PequiApiError(
      res.status,
      (body.code as string) || 'API_ERROR',
      (body.message as string) || res.statusText,
      (body.recoverable as boolean) || false,
      body.retryAfter as number | undefined,
      body.requestId as string | undefined,
      body as Record<string, unknown>,
    )
  }
}

// ─── Client ───────────────────────────────────────────────────────

export class PequiClient {
  private baseUrl: string
  private apiKey: string

  constructor(options?: { baseUrl?: string; apiKey?: string }) {
    this.baseUrl = options?.baseUrl || 'https://xpequi.xyz/api/v1'
    this.apiKey = options?.apiKey || ''
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    opts?: { isFormData?: boolean; params?: Record<string, string | undefined>; headers?: Record<string, string> },
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`)
    if (opts?.params) {
      Object.entries(opts.params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') url.searchParams.set(k, v)
      })
    }

    const headers: Record<string, string> = { 'Accept': 'application/json', ...opts?.headers }
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`
    if (body && !opts?.isFormData) {
      headers['Content-Type'] = 'application/json'
    }

    const res = await fetch(url.toString(), {
      method,
      headers,
      body: body
        ? opts?.isFormData
          ? (body as BodyInit)
          : JSON.stringify(body)
        : undefined,
    })

    if (!res.ok) {
      throw await PequiApiError.fromResponse(res)
    }

    return res.json() as Promise<T>
  }

  private async get<T>(
    path: string,
    params?: Record<string, string | undefined>,
  ): Promise<T> {
    return this.request<T>('GET', path, undefined, { params })
  }

  private async post<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('POST', path, body, { headers })
  }

  private async del<T = void>(path: string): Promise<T> {
    return this.request<T>('DELETE', path)
  }

  private async upload<T>(path: string, formData: FormData): Promise<T> {
    return this.request<T>('POST', path, formData, { isFormData: true })
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

  // ── AVM ─────────────────────────────────────────────────────────

  async getAVM(params: AVMRequest): Promise<AVMResult> {
    const data = await this.post<any>('/avm', params)
    return data.data || data
  }

  async getAVMBulk(
    properties: AVMRequest[],
    idempotencyKey?: string,
  ): Promise<{ results: AVMResult[]; creditsUsed: number }> {
    const headers: Record<string, string> = {}
    if (idempotencyKey) headers['x-idempotency-key'] = idempotencyKey
    const data = await this.post<any>('/avm/bulk', { properties }, headers)
    return data.data || data
  }

  // ── Financial Indicators ────────────────────────────────────────

  async getUVR(): Promise<UVRData> {
    const data = await this.get<any>('/uvr')
    return data.data || data
  }

  async getIPC(): Promise<IPCData> {
    const data = await this.get<any>('/ipc')
    return data.data || data
  }

  async calculateRentIncrease(params: RentIncreaseParams): Promise<RentIncreaseResult> {
    const data = await this.post<any>('/rent-increase', params)
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

  // ── Credits & Subscriptions (c402) ──────────────────────────────

  async getCredits(): Promise<CreditBalance> {
    const data = await this.get<any>('/credits')
    return data.data || data
  }

  async purchaseCredits(
    calls: number,
  ): Promise<CreditPurchaseResult> {
    const data = await this.post<any>('/credits/purchase', { calls })
    return data.data || data
  }

  async getSubscriptionCheckout(
    tier: 'AGENTE' | 'CONJUNTO',
  ): Promise<SubscriptionCheckoutResult> {
    const data = await this.post<any>('/subscriptions/api-checkout', { tier })
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

  // ── Bogotá Data ─────────────────────────────────────────────────

  /**
   * Get UPZ boundary data for Bogotá.
   * Filter by localidad, zone (norte/centro/occidente/sur), or TransMilenio coverage.
   */
  async getUPZs(params?: {
    localidad?: string
    zone?: 'norte' | 'centro' | 'occidente' | 'sur'
    hasTransmilenio?: boolean
  }): Promise<UPZData[]> {
    const data = await this.get<any>('/bogota/upz', {
      localidad: params?.localidad,
      zone: params?.zone,
      hasTransmilenio: params?.hasTransmilenio?.toString(),
    })
    return data.data || data
  }

  /**
   * Get IGAC cadastral reference values for Bogotá by localidad and stratum.
   * These values determine property tax (impuesto predial).
   */
  async getCadastralValuation(localidad: string, estrato?: number): Promise<CadastralValuationData[]> {
    const data = await this.get<any>('/bogota/cadastral', {
      localidad,
      estrato: estrato?.toString(),
    })
    return data.data || data
  }

  /**
   * Get current mortgage rates from Colombian banks (Superfinanciera data, April 2026).
   */
  async getMortgageRates(params?: {
    bank?: string
    product?: 'vivienda_nueva' | 'vivienda_usada' | 'vis' | 'remodelacion' | 'lote' | 'leasing'
  }): Promise<MortgageRateData[]> {
    const data = await this.get<any>('/mortgage-rates', {
      bank: params?.bank,
      product: params?.product,
    })
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
    return this.upload<any>('/upload', formData)
  }

  // ── Bank Verification ───────────────────────────────────────────

  async verifyBankAccount(params: BankVerificationParams): Promise<BankVerificationResult> {
    const data = await this.post<any>('/bank-verification', params)
    return data.data || data
  }

  // ── Monitoring ──────────────────────────────────────────────────

  async getUsage(): Promise<UsageData> {
    const data = await this.get<any>('/monitoring/usage')
    return data.data || data
  }

  async getLatency(quantile: string = 'p95'): Promise<LatencyPoint[]> {
    const data = await this.get<any>('/monitoring/latency', { quantile })
    return data.data || data
  }

  async getErrors(): Promise<ErrorBreakdown[]> {
    const data = await this.get<any>('/monitoring/errors')
    return data.data || data
  }

  async getUptime(window: string = '24h'): Promise<UptimeData> {
    const data = await this.get<any>('/monitoring/uptime', { window })
    return data.data || data
  }

  // ── Webhooks ────────────────────────────────────────────────────

  async listWebhooks(): Promise<WebhookEndpoint[]> {
    const data = await this.get<any>('/webhooks/endpoints')
    return data.data || data
  }

  async createWebhook(url: string, events: string[]): Promise<WebhookEndpoint & { secret: string }> {
    return this.post<any>('/webhooks/endpoints', { url, events })
  }

  async deleteWebhook(id: string): Promise<void> {
    await this.del(`/webhooks/endpoints/${id}`)
  }

  async testWebhook(id: string): Promise<{ success: boolean; statusCode?: number; error?: string }> {
    const data = await this.post<any>(`/webhooks/endpoints/${id}/test`, {})
    return data.data || data
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
