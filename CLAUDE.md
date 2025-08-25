# Hudu MCP Server

## Project Overview
A Model Context Protocol (MCP) server for Hudu - a comprehensive IT documentation and password management platform. This server converts the Hudu REST API into MCP-compatible resources, prompts, and tools following the MCP 2025-06-18 specification.

**Status**: Production ready with graceful error handling for partial API access.

## Requirements
- Follow MCP specifications from https://modelcontextprotocol.io/specification/2025-06-18
- Support Streamable HTTP transport
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
- Node.js/TypeScript implementation
- JSON-RPC 2.0 communication protocol
- Streamable HTTP transport support
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
npm run dev          # Start development server
npm run build        # Build for production
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
1. Set up Hudu API credentials
2. Configure environment variables
3. Install dependencies: `npm install`
4. Start development server: `npm run dev`
5. Connect MCP client to server

## Claude Code Configuration
The MCP server is configured in Claude Code at:
```json
{
  "mcpServers": {
    "hudu": {
      "transport": "http",
      "url": "http://localhost:3050/mcp"
    }
  }
}
```

## Current Implementation Status
- ✅ HTTP transport server running on port 3050
- ✅ Search functionality with graceful error handling
- ✅ Support for articles, assets, companies, and password endpoints
- ✅ Error handling for insufficient API permissions
- ✅ Comprehensive search across multiple Hudu resource types
- ✅ Latest package versions with zero deprecation warnings
- ⚠️ Password endpoint requires elevated API permissions

## Development Best Practices
- **Always use latest packages**: Keep all dependencies updated to their latest stable versions
- **Latest MCP SDK**: Currently using @modelcontextprotocol/sdk@^1.17.4 (latest)
- **Modern tooling**: ESLint v9, Jest v30, TypeScript v5.9
- **Zero deprecation warnings**: All deprecated packages have been resolved or overridden
- **Package management**: Use npm overrides to force newer versions of transitive dependencies when needed