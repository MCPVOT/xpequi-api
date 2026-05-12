# @MCPVOT/api-client

TypeScript client for Pequi — Colombia's first real estate data API.

## Install

```bash
npm install @MCPVOT/api-client
```

## Quick Start

```typescript
import { PequiClient } from '@MCPVOT/api-client'

const client = new PequiClient({ apiKey: 'pk_live_your_key' })

// Search properties
const properties = await client.searchProperties({ city: 'ibague', tipo: 'apartamento', limit: 5 })

// List neighborhoods
const barrios = await client.getBarrios('ibague')

// Price benchmarks
const benchmarks = await client.getBenchmarks({ barrio: 'centro' })

// Geocode address
const coords = await client.geocode('Calle 10 #3-15, Ibagué')
```

## Methods

### Properties
- `searchProperties(params)` — Search with filters (city, tipo, precio, cuartos, etc.)

### Neighborhoods
- `getBarrios(city?)` — List neighborhoods with estratos

### Benchmarks
- `getBenchmarks(params?)` — Price per m² by barrio and type

### Geocoding
- `geocode(address)` — Address to lat/lng coordinates

### Contracts
- `generateContract(params)` — Generate Ley 820 rental contract (requires: landlordName, landlordCedula, tenantName, tenantCedula, propertyAddress, rentAmount, startDate, endDate)

### Payments
- `createPayment(params)` — Create Wompi payment intent, returns `{ id, redirectUrl }`
- `getPaymentStatus(paymentId)` — Check payment status

### Complexes (Conjuntos)
- `listComplexes()` — List all residential complexes
- `getComplex(slug)` — Get complex details by slug
- `getComplexUnits(slug)` — List units in a complex

## Auth

Pass your API key in the constructor. Get one at [xpequi.xyz/developers](https://xpequi.xyz/developers).

```typescript
const client = new PequiClient({ apiKey: 'pk_live_abc123' })
```

FREE tier: 30 req/min. Upgrade at [xpequi.xyz/precios](https://xpequi.xyz/precios).

## Error Handling

All methods throw on error with the HTTP status and API error message:

```typescript
try {
  await client.searchProperties({ city: 'ibague' })
} catch (err) {
  console.error(err.message) // "Pequi API 429: Rate limit exceeded"
}
```
