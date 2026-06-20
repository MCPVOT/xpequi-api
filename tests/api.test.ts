import { describe, it } from 'node:test'
import assert from 'node:assert'

const API = process.env.PEQUI_API_URL || 'https://xpequi.xyz/api/v1'
const KEY = process.env.PEQUI_API_KEY || ''

const headers: Record<string, string> = { Accept: 'application/json' }
if (KEY) headers.Authorization = 'Bearer ' + KEY

async function get(path: string) {
  return fetch(API + path, { headers })
}

describe('Pequi API', () => {
  it('should return UVR', async () => {
    const res = await get('/uvr')
    assert.strictEqual(res.status, 200)
    const body = await res.json()
    assert.ok(body.data?.value > 0)
  })

  it('should return IPC', async () => {
    const res = await get('/ipc')
    assert.strictEqual(res.status, 200)
    const body = await res.json()
    assert.ok(body.data?.annualVariation >= 0)
  })

  it('should geocode', async () => {
    const res = await get('/geocode?address=Calle+10+%235-20+Ibagu%C3%A9')
    assert.strictEqual(res.status, 200)
    const body = await res.json()
    assert.ok(body.data?.lat)
    assert.ok(body.data?.lng)
  })

  it('should get mortgage rates', async () => {
    const res = await get('/mortgage-rates')
    assert.strictEqual(res.status, 200)
    const body = await res.json()
    assert.ok(body.data?.length > 0)
  })

  it('should get barrios for ibague', async () => {
    const res = await get('/barrios?city=ibague&limit=1')
    assert.strictEqual(res.status, 200)
    const body = await res.json()
    assert.ok(body.data?.length >= 1)
  })
})
