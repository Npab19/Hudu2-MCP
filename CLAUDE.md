# CLAUDE.md — MCP Hudu Server

You are Claude Code. Generate and maintain a production-ready **MCP server** that wraps the **Hudu** API from `hudu.json` (Swagger/OpenAPI).

## Objective
Ship an MVP MCP server that:
- Conforms to **MCP spec 2025-06-18**.
- Uses the **official MCP TypeScript SDK**: @modelcontextprotocol/sdk
- Exposes **Streamable HTTP Transport** on port 3050.
- Implements the **resource+action** pattern (predictable verbs across domains).
- Runs reliably in **Docker**, with health/readiness endpoints.
- Handles **partial API access** gracefully (typed errors, warnings, next steps).
- Uses **.env** for all Hudu config (no secrets in code).

---

## Environment & Configuration

Create a `.env` file from `.env.example`:

```bash
HUDU_BASE_URL=https://your-hudu.example.com
HUDU_API_KEY=your-api-key
HUDU_TIMEOUT=30000
MCP_SERVER_PORT=3050
LOG_LEVEL=info
```

Fail fast if required vars are missing. No hard-coded secrets.

---

## Connection from Claude Code (HTTP)

Add MCP server to Claude Code:

```bash
claude mcp add --transport http hudu http://127.0.0.1:3050/mcp
```

Alternative Claude Desktop config:
```json
{
  "mcpServers": {
    "hudu": {
      "transport": "http",
      "url": "http://127.0.0.1:3050/mcp"
    }
  }
}
```

---

## Deliverables (what you should generate)

- `src/server.ts` — MCP HTTP server wiring (Streamable transport), health endpoints:
  - `GET /health` (liveness)
  - `GET /` (server info)
  - `ALL /mcp` (MCP endpoint)
- `src/hudu-client.ts` — Hudu API client with typed methods
- `src/tools/*` — Tools implementing **resource.action**:
  - `companies.query`, `companies.get`
  - `assets.query`, `assets.get`
  - `articles.query`, `articles.get`
  - `passwords.query`, `passwords.get`
  - `networks.query`, `networks.get`
  - `search` (global search across resources)
- `src/types.ts` — TypeScript types from OpenAPI
- `hudu.json` — OpenAPI/Swagger spec (reference only)
- `Dockerfile` — Multi-stage build, non-root runtime
- `.env.example` — Environment template
- `docker-compose.yml` — Quick local testing
- `package.json` — scripts: `dev`, `build`, `start`, `lint`, `type-check`

---

## Project Structure (current)

```
.
├─ hudu.json
├─ src/
│  ├─ server.ts
│  ├─ index.ts
│  ├─ hudu-client.ts
│  ├─ types.ts
│  └─ tools/
│     └─ working-index.ts
├─ .env.example
├─ Dockerfile
├─ docker-compose.yml
├─ tsconfig.json
├─ package.json
└─ CLAUDE.md
```

---

## Coding Standards

- **Language:** TypeScript with `"strict": true`.
- **SDK:** Use only the official MCP TypeScript SDK for protocol integration.
- **Transport:** Streamable HTTP Transport via `StreamableHTTPServerTransport`.
- **Pattern:** `resource.action` naming for tools.
- **Validation:** Zod schemas for inputs/outputs.
- **Errors:** Map Hudu 401/403/404/429/5xx → typed MCP errors with:
  - `message` (user-readable)
  - `code` (stable)
  - `warnings[]` (if partial)
  - `nextSteps[]` (remediation hints)
- **Logging:** Console.error for debugging (stderr), JSON logs for production.
- **Resilience:** Graceful handling of API permission errors, continue with partial results.
- **Security:** Environment-based config, no secrets in code or images.

---

## Build & Run

**Local (Node):**
```bash
npm install
npm run build
npm start
# or dev:
npm run dev
```

**Docker (REQUIRED for MCP testing):**
```bash
docker-compose up --build -d
docker-compose logs -f
# or
docker build -t hudu-mcp-server .
docker run --rm --env-file .env -p 3050:3050 hudu-mcp-server
```

Health check:
- `GET http://localhost:3050/health` → 200 OK
- `GET http://localhost:3050/` → Server info

---

## Tool Contracts (current implementation)

### `search`
Global search across all Hudu resources.
**Input**:
```json
{
  "query": "string",
  "limit": 50
}
```
**Output**: Combined results from all resource types.

### `companies.query`
**Input**:
```json
{
  "name": "string",
  "page": 1,
  "page_size": 25
}
```
**Output**: Paginated company list.

### `companies.get`
**Input**:
```json
{ "id": "number" }
```
**Output**: Single company details.

_Similar patterns for `assets.*`, `articles.*`, `passwords.*`, `networks.*`_

---

## Error Model

```json
{
  "code": "UNAUTHORIZED | FORBIDDEN | NOT_FOUND | RATE_LIMITED | SERVER_ERROR",
  "message": "Human-readable summary",
  "warnings": ["Partial results due to permissions"],
  "nextSteps": ["Check HUDU_API_KEY", "Verify permissions"]
}
```

---

## Implementation Checklist

✅ **Completed:**
1. Project scaffolding with TypeScript
2. Environment configuration (.env)
3. MCP SDK integration with Streamable HTTP
4. Hudu API client implementation
5. 31 tools with resource.action pattern
6. Error handling for partial API access
7. Docker configuration
8. Health endpoints

⚠️ **Known Issues:**
- Password endpoints require elevated API permissions
- Some endpoints may return 401 depending on user permissions

---

## Testing Protocol

1. **Build and start Docker**: `docker-compose up --build -d`
2. **Configure Claude Code**: `claude mcp add --transport http hudu http://127.0.0.1:3050/mcp`
3. **Test tools**: Use `search`, `companies.query`, etc. in Claude Code
4. **NEVER test with curl** - Always use Claude Code's native MCP functionality
5. **Verify logs**: `docker-compose logs -f`

---

## Acceptance Criteria

- ✅ Starts with clear diagnostics if env is incomplete
- ✅ Health endpoint returns 200 OK
- ✅ Claude Code connects over HTTP transport
- ✅ Lists 31 tools via MCP protocol
- ✅ Successfully calls `search` and resource tools
- ✅ Errors are typed and user-readable
- ✅ Handles partial API access gracefully
- ✅ Runs in Docker as non-root user

---

## Troubleshooting

- **401/403**: Verify `HUDU_API_KEY` and user permissions
- **Connection refused**: Check Docker is running on port 3050
- **No tools available**: Rebuild container with `docker-compose up --build -d`
- **Partial results**: Some endpoints require elevated permissions - this is expected

---

## Current Status

**Working:**
- All 31 tools registered and available
- Streamable HTTP transport on port 3050
- Global search across resources
- Graceful error handling for permissions
- Docker deployment

**Latest fix (2025-08-26):**
- Migrated to StreamableHTTPServerTransport
- Single `/mcp` endpoint for all MCP communication
- Built-in session management with UUID
- Proper MCP SDK integration

---

**Build it, run the container, and test via Claude Code over HTTP. Keep SDK usage canonical, naming consistent, and errors helpful.**