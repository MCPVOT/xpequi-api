# Contributing to Pequi API

Colombia's first real estate data API — contributions welcome.

## Types of Contributions

| Type | Examples |
|------|----------|
| **Bug fixes** | Fix broken endpoints, type errors, wrong response formats |
| **SDK methods** | New API endpoint wrappers in TS or Python |
| **MCP tools** | New tools for AI agents (Claude, Cursor, Copilot) |
| **Docs** | README improvements, examples, integration guides |
| **Tests** | Contract tests, type validation, integration tests |

## Development Setup

```bash
git clone https://github.com/MCPVOT/xpequi-api.git
cd xpequi-api
npm install
```

## Before Submitting

- [ ] `npx tsc --noEmit` passes (zero errors)
- [ ] `npm run build` succeeds
- [ ] No hardcoded secrets or API keys
- [ ] Types follow existing patterns in `packages/api-client/src/index.ts`
- [ ] MCP tools have Zod schemas + JSON inputSchema (both required)
- [ ] README updated if endpoints/tools changed

## Pull Request Process

1. Open a PR against `main` branch
2. CI must pass (typecheck + build)
3. One of the maintainers (@MCPVOT/pequi-maintainers) reviews
4. Merge on approval

## SDK Method Pattern

```typescript
// TypeScript SDK
async myNewMethod(params: MyParams): Promise<MyResult> {
  const data = await this.get<{ data: MyResult }>('/my-endpoint', params as any)
  return data.data
}
```

```python
# Python SDK
def my_new_method(self, param: str) -> dict:
    data = self._get("/my-endpoint", {"param": param})
    return data["data"]
```

## MCP Tool Pattern

```typescript
// 1. Zod schema for validation
const MyToolSchema = z.object({ param: z.string() })

// 2. JSON inputSchema for MCP protocol
const inputSchema = { type: 'object', properties: { param: { type: 'string' } } }

// 3. Tool handler
case 'my_tool': {
  const parsed = MyToolSchema.parse(args)
  const result = await apiGet('/my-endpoint', { param: parsed.param })
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
}
```
