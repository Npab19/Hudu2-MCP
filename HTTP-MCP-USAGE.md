# HTTP MCP Usage Guide

This guide shows how to use the Hudu MCP Server with HTTP JSON-RPC transport.

## Server Information

- **Base URL**: `http://localhost:3000`
- **MCP Endpoint**: `http://localhost:3000/mcp`
- **Batch Endpoint**: `http://localhost:3000/mcp/batch`
- **Protocol**: JSON-RPC 2.0 over HTTP POST

## Basic Usage

### 1. Initialize Connection

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize", 
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {"name": "test-client", "version": "1.0.0"}
    },
    "id": 1
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {"resources": {}, "tools": {}},
    "serverInfo": {"name": "hudu-mcp-server", "version": "1.0.0"}
  }
}
```

### 2. List Available Resources

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "resources/list",
    "id": 2
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "resources": [
      {
        "uri": "hudu://article/list",
        "name": "Hudu Articles",
        "description": "List of all knowledge base articles",
        "mimeType": "application/json"
      },
      {
        "uri": "hudu://asset/list", 
        "name": "Hudu Assets",
        "description": "List of all IT assets",
        "mimeType": "application/json"
      }
      // ... more resources
    ]
  }
}
```

### 3. Read a Resource

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "resources/read",
    "params": {"uri": "hudu://article/list"},
    "id": 3
  }'
```

### 4. List Available Tools

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 4
  }'
```

### 5. Call a Tool

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "hudu_get_articles",
      "arguments": {"search": "server"}
    },
    "id": 5
  }'
```

## Available Methods

| Method | Description | Params |
|--------|-------------|--------|
| `initialize` | Initialize MCP connection | `protocolVersion`, `capabilities`, `clientInfo` |
| `resources/list` | List all available resources | None |
| `resources/read` | Read a specific resource | `uri` |
| `tools/list` | List all available tools | None |
| `tools/call` | Execute a tool | `name`, `arguments` |
| `ping` | Test connectivity | None |

## Resources

| URI | Description |
|-----|-------------|
| `hudu://article/list` | All knowledge base articles |
| `hudu://article/{id}` | Specific article by ID |
| `hudu://asset/list` | All IT assets |
| `hudu://asset/{id}` | Specific asset by ID |
| `hudu://password/list` | All password entries |
| `hudu://password/{id}` | Specific password by ID |
| `hudu://company/list` | All companies |
| `hudu://company/{id}` | Specific company by ID |
| `hudu://asset-layout/list` | All asset layout templates |
| `hudu://activity-log/list` | All activity logs |

## Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `hudu_get_articles` | Get articles with filtering | `name`, `company_id`, `page`, `search`, etc. |
| `hudu_get_article` | Get specific article | `id` (required) |
| `hudu_create_article` | Create new article | `name`, `content` (required), others optional |
| `hudu_get_companies` | Get companies | `name`, `search`, `page`, etc. |
| `hudu_get_assets` | Get assets | `name`, `company_id`, `search`, etc. |
| `hudu_search_all` | Search all content types | `query` (required), `type`, `company_id` |

## Batch Requests

Send multiple requests in a single HTTP call:

```bash
curl -X POST http://localhost:3000/mcp/batch \
  -H "Content-Type: application/json" \
  -d '[
    {
      "jsonrpc": "2.0",
      "method": "resources/list",
      "id": 1
    },
    {
      "jsonrpc": "2.0", 
      "method": "tools/list",
      "id": 2
    }
  ]'
```

## Error Handling

Standard JSON-RPC 2.0 error codes:

| Code | Message | Description |
|------|---------|-------------|
| -32600 | Invalid Request | Malformed JSON-RPC request |
| -32601 | Method Not Found | Unknown method |
| -32602 | Invalid Params | Invalid method parameters |
| -32603 | Internal Error | Server-side error |

**Error Response Example:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32601,
    "message": "Method not found: unknown_method"
  }
}
```

## Using with mcpjam

To connect mcpjam to the HTTP transport:

```bash
# In mcpjam configuration, use:
# Transport: HTTP
# URL: http://localhost:3000/mcp
```

## Health Check

Non-MCP endpoint for monitoring:
```bash
curl http://localhost:3000/health
# Returns: {"status":"healthy","timestamp":"2025-01-01T00:00:00.000Z"}
```