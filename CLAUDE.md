# Hudu MCP Server

## Project Overview
A Model Context Protocol (MCP) server for Hudu - a comprehensive IT documentation and password management platform. This server converts the Hudu REST API into MCP-compatible resources, prompts, and tools following the MCP 2025-06-18 specification.

**Status**: Production ready with proper MCP SDK implementation and graceful error handling for partial API access.

## Latest Update (2025-08-26)
✅ **MAJOR FIX COMPLETED**: Server completely rewritten to use proper MCP SDK implementation instead of custom Express.js JSON-RPC handling. All 31 tools now properly registered and available through Claude Code.

### Streamable HTTP Transport Migration (Latest)
✅ **STREAMABLE HTTP TRANSPORT IMPLEMENTED**: Migrated from deprecated SSE transport to modern Streamable HTTP transport (MCP 2025-03-26 specification). Server now uses single `/mcp` endpoint with built-in session management, improved reliability, and simplified architecture.

## Requirements
- Follow MCP specifications from https://modelcontextprotocol.io/specification/2025-06-18
- Use official @modelcontextprotocol/sdk Server class
- Support Streamable HTTP transport for Claude Code (MCP 2025-03-26)
- Convert Hudu swagger API (hudu.json) to MCP server functionality
- Provide secure access to Hudu resources with proper authentication
- Handle API permission limitations gracefully

## Key Features
Based on the Hudu API analysis, this MCP server will provide:

### Resources
- Activity logs and audit trails
- Knowledge base articles and documentation
- IT assets and asset layouts
- Password and credential management
- Company and client information
- Files and attachments
- Network documentation
- Procedures and processes

### Tools
- CRUD operations for all Hudu resources
- Search and filtering capabilities
- Bulk operations for data management
- Archive/unarchive functionality
- File upload and management

### Prompts
- Templates for creating documentation
- Standard procedures and workflows
- Asset inventory templates
- Security assessment prompts

## Architecture
- Node.js/TypeScript implementation using MCP SDK
- Official @modelcontextprotocol/sdk Server class
- Streamable HTTP transport for Claude Code (MCP 2025-03-26 specification)
- StdIO transport for traditional MCP clients
- Secure API key authentication for Hudu
- Rate limiting and error handling
- Comprehensive logging and monitoring
- Graceful degradation for partial API permissions

## Security Considerations
- User consent required for all data operations
- Secure credential storage and transmission
- Access control and authorization
- Audit logging for all operations
- Data encryption in transit and at rest
- Graceful handling of 401 unauthorized responses

## Error Handling
The server implements robust error handling for API permission limitations:
- 401 Unauthorized responses are caught and logged as warnings
- Partial results are returned when some endpoints fail
- Search operations continue even if individual endpoints are restricted
- All errors are properly logged for debugging

## Development Commands
```bash
# Docker Commands (Required for MCP testing)
docker-compose up --build -d    # Build and start MCP server in Docker
docker-compose down             # Stop and remove containers
docker-compose logs -f          # View server logs

# Development Tools
npm run build        # Build for production (run before Docker build)
npm run test         # Run tests
npm run lint         # Run linter
npm run type-check   # Run TypeScript checks
```

## Hudu API Coverage
The server will support all major Hudu API endpoints including:
- Activity Logs (/activity_logs)
- Articles (/articles)
- Asset Layouts (/asset_layouts)
- Asset Passwords (/asset_passwords)
- Assets (/assets)
- Companies (/companies)
- Files (/files)
- Networks (/networks)
- Procedures (/procedures)
- And many more...

## Environment Variables
- `HUDU_API_KEY` - Hudu API authentication key
- `HUDU_BASE_URL` - Hudu instance URL
- `MCP_SERVER_PORT` - Port for MCP server (default: 3050)
- `LOG_LEVEL` - Logging level (debug, info, warn, error)

## Getting Started
1. Set up Hudu API credentials in `.env` file
2. Configure environment variables (HUDU_API_KEY, HUDU_BASE_URL)
3. Install dependencies: `npm install`
4. Build and start Docker container: `docker-compose up --build -d`
5. Connect Claude Code to MCP server via HTTP transport

## Claude Code Configuration
The MCP server must be configured in Claude Code using the CLI command:

```bash
# Add Streamable HTTP MCP server to Claude Code
claude mcp add --transport http hudu http://127.0.0.1:3050/mcp
```

**CRITICAL**: Always use the Claude Code CLI with the `--transport http` flag for Streamable HTTP MCP servers.

**Alternative Configuration (if using Claude Desktop)**:
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

## Current Implementation Status
- ✅ **MIGRATED**: Streamable HTTP transport implementation (MCP 2025-03-26 specification)
- ✅ **FIXED**: All 31 tools properly registered through MCP SDK tool registration system
- ✅ **FIXED**: Server runs on http://localhost:3050/mcp with Claude Code compatibility
- ✅ **SIMPLIFIED**: Single `/mcp` endpoint handles both GET (SSE) and POST (JSON-RPC) requests
- ✅ **IMPROVED**: Built-in session management with UUID generation and security features
- ✅ **ENHANCED**: DNS rebinding protection and proper CORS configuration
- ✅ Search functionality with graceful error handling
- ✅ Support for articles, assets, companies, and password endpoints
- ✅ Error handling for insufficient API permissions
- ✅ Comprehensive search across multiple Hudu resource types
- ✅ Latest MCP SDK @modelcontextprotocol/sdk@^1.17.4
- ⚠️ Password endpoint requires elevated API permissions

## Development Best Practices
- **Always use Docker for testing**: Never use `npm run dev` for MCP testing - always run `docker-compose up --build -d`
- **NEVER USE CURL FOR MCP TESTING**: Always test MCP servers through Claude Code's native MCP functionality
- **Use Claude Code for MCP testing**: Connect via SSE transport and use actual MCP tools in conversations
- **Always use latest packages**: Keep all dependencies updated to their latest stable versions
- **Latest MCP SDK**: Currently using @modelcontextprotocol/sdk@^1.17.4 (latest)
- **Proper MCP SDK Usage**: Always use official MCP SDK Server class and transport layers
- **Modern tooling**: ESLint v9, Jest v30, TypeScript v5.9
- **Zero deprecation warnings**: All deprecated packages have been resolved or overridden
- **Package management**: Use npm overrides to force newer versions of transitive dependencies when needed
- **File management**: NEVER create `nul` files in the project directory - these are Windows system artifacts and should be avoided
- **Architecture**: Use MCP SDK patterns, not custom JSON-RPC implementations

## Testing Protocol
1. **Build and start Docker container**: `docker-compose up --build -d`
2. **Configure Claude Code**: `claude mcp add --transport sse hudu http://127.0.0.1:3050/sse`
3. **Test via Claude Code MCP tools**: Use actual MCP tools like `search`, `companies.query`, etc. in Claude Code
4. **NEVER USE CURL TO TEST MCP SERVERS**: Always test through Claude Code's native MCP functionality
5. **Verify connection**: Use MCP tools directly in Claude Code conversation, not `claude mcp list`
6. **Clean rebuild when needed**: Stop containers, rebuild, and restart for fresh testing

## MCP Testing Best Practices
- **✅ CORRECT**: Test by using MCP tools directly in Claude Code conversations (e.g., search for companies)
- **❌ WRONG**: Testing with curl commands or manual HTTP requests
- **❌ WRONG**: Relying on `claude mcp list` health checks as definitive connection status
- **✅ CORRECT**: Verify MCP server works by actually using the tools in Claude Code sessions

## Known Issues & Troubleshooting
### MCP Tools Not Available ("No such tool available" error)
**Problem**: Claude Code shows MCP server as configured but tools like `search`, `companies`, etc. are not available.

**Root Cause Analysis**:
1. **Incorrect Transport Implementation**: The server was using custom Express.js instead of MCP SDK's official transport layer.
2. **Missing MCP SDK Integration**: Custom HTTP implementation couldn't properly handle MCP protocol requirements.

**Solutions Applied (2025-08-26)**:
1. **Streamable HTTP Transport Migration**: 
   - ✅ Migrated from deprecated SSE transport to Streamable HTTP (MCP 2025-03-26)
   - ✅ Replaced complex session mapping with built-in `StreamableHTTPServerTransport`
   - ✅ Single `/mcp` endpoint handles both GET (SSE streams) and POST (JSON-RPC messages)
   - ✅ All 31 tools properly registered through MCP SDK's tool registration system

2. **Modern Transport Configuration**: 
   - ✅ Using `StreamableHTTPServerTransport` with UUID session generation
   - ✅ Server endpoint: http://localhost:3050/mcp
   - ✅ Updated Claude Code configuration: `claude mcp add --transport http hudu http://127.0.0.1:3050/mcp`

3. **Simplified Architecture**: 
   - ✅ Single `HuduMcpServer` class handles both stdio and Streamable HTTP transports
   - ✅ Built-in session management eliminates manual transport mapping
   - ✅ Proper MCP protocol handling through official SDK transport layer

4. **Enhanced Security and Reliability**:
   - ✅ DNS rebinding protection with configurable allowed origins
   - ✅ Secure UUID-based session ID generation
   - ✅ Built-in resumability support for connection recovery
   - ✅ Improved CORS configuration with proper header support

**Current Status**:
- ✅ Server successfully running on port 3050 with Streamable HTTP transport
- ✅ Tools list returns 31 tools: `articles`, `companies`, `assets`, `passwords`, `search`, etc.
- ✅ All tools registered through MCP SDK without custom handling
- ✅ Claude Code tools available as: `search`, `companies.query`, `articles`, etc. (no `mcp__hudu__` prefix)
- ✅ Docker container rebuilt and running successfully
- ✅ Streamable HTTP transport fully operational with built-in session management
- ✅ Single `/mcp` endpoint handles all MCP communication

**Key Files Modified**:
- `src/server.ts` - Migrated `runHttp()` method to use `StreamableHTTPServerTransport`
- `src/index.ts` - No changes needed (already using MCP server pattern)
- `package.json` - Dependencies unchanged (minimal Express.js for routing only)
- `CLAUDE.md` - Updated documentation to reflect Streamable HTTP transport

**Technical Implementation Details**:
```typescript
// Streamable HTTP Transport with Built-in Session Management (src/server.ts:253-259)
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),
  allowedOrigins: ['http://localhost:*', 'http://127.0.0.1:*', '*'],
  enableDnsRebindingProtection: false, // Disabled for localhost development
  enableJsonResponse: false // Keep SSE streaming enabled for real-time communication
});

// Single MCP endpoint - handles both GET (SSE) and POST (JSON-RPC) requests
app.all('/mcp', async (req, res) => {
  await transport.handleRequest(req, res);
});
```

**Important**: The server now uses the latest MCP 2025-03-26 Streamable HTTP specification, providing better reliability and simplified architecture compared to the previous SSE implementation.