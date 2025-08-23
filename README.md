# Hudu MCP Server

A Model Context Protocol (MCP) server for Hudu IT documentation platform. This server provides secure access to Hudu resources through the standardized MCP interface, enabling AI assistants to interact with your IT documentation, assets, and password management system.

## Features

- **Complete Hudu API Coverage**: 144 tools covering all Hudu API endpoints
- **MCP 2025-06-18 Compliant**: Follows the latest MCP specification
- **Dual Transport Support**: Both HTTP JSON-RPC and stdio transports
- **Secure Authentication**: API key-based authentication with Hudu
- **Rich Resource Access**: Browse and search 23 different content types
- **Comprehensive Tooling**: Full CRUD operations for all Hudu entities
- **TypeScript Support**: Full type safety and excellent developer experience
- **Docker Ready**: Containerized deployment with health checks

## Installation

### Option 1: Docker (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/npab19/Hudu-MCP.git
cd Hudu-MCP
```

2. Copy the Docker environment file:
```bash
cp docker.env.example .env
```

3. Configure your Hudu instance in `.env`:
```env
HUDU_BASE_URL=https://your-hudu-instance.com
HUDU_API_KEY=your-hudu-api-key-here
HUDU_TIMEOUT=30000
```

4. Run with Docker Compose:
```bash
npm run docker:compose:up
```

### Option 2: Local Development

1. Install dependencies:
```bash
npm install
```

2. Copy the example environment file:
```bash
cp .env.example .env
```

3. Configure your Hudu instance in `.env`:
```env
HUDU_BASE_URL=https://your-hudu-instance.com
HUDU_API_KEY=your-hudu-api-key-here
HUDU_TIMEOUT=30000
```

## Usage

### Docker Commands (HTTP Transport)

```bash
# Build and run with Docker Compose (recommended)
npm run docker:compose:up

# View logs
npm run docker:compose:logs

# Stop the container
npm run docker:compose:down

# Build Docker image manually
npm run docker:build

# Run Docker container manually
npm run docker:run
```

### Local Development (Stdio Transport)
```bash
# Remove MCP_SERVER_PORT from .env for stdio mode
npm run dev
```

### Production (Local)
```bash
npm run build
npm start
```

### Testing
```bash
npm test
```

## MCP Transport Options

### HTTP JSON-RPC Transport (Default in Docker)
When `MCP_SERVER_PORT` is set or `NODE_ENV=production`, the server runs in HTTP mode:
- **Endpoint**: `http://localhost:3000/mcp`
- **Protocol**: JSON-RPC 2.0 over HTTP POST
- **Batch Support**: `http://localhost:3000/mcp/batch`
- **Health Check**: `http://localhost:3000/health`

### Stdio Transport (Traditional MCP)  
When `MCP_SERVER_PORT` is not set, the server runs in stdio mode:
- **Protocol**: JSON-RPC 2.0 over stdin/stdout
- **Usage**: Connect MCP clients directly to the process

## MCP Resources

The server exposes 23 different resource types covering all Hudu entities:

**Core Resources:**
- `hudu://article/list` - List all articles
- `hudu://asset/list` - List all assets  
- `hudu://password/list` - List all passwords
- `hudu://company/list` - List all companies
- `hudu://asset-layout/list` - List all asset layouts
- `hudu://activity-log/list` - List all activity logs

**Extended Resources:**
- `hudu://folder/list` - List all folders
- `hudu://user/list` - List all users
- `hudu://procedure/list` - List all procedures
- `hudu://network/list` - List all networks
- `hudu://password-folder/list` - List all password folders
- `hudu://website/list` - List all websites
- `hudu://vlan/list` - List all VLANs
- `hudu://ip-address/list` - List all IP addresses
- `hudu://relation/list` - List all relations
- `hudu://list/list` - List all custom lists
- `hudu://group/list` - List all groups
- `hudu://magic-dash/list` - List all magic dashboard items
- `hudu://matcher/list` - List all asset matchers
- `hudu://expiration/list` - List all expirations
- `hudu://export/list` - List all exports
- `hudu://rack-storage/list` - List all rack storage
- `hudu://card/list` - List all dashboard cards

All resources support individual access via `{resource-type}/{id}` URIs.

## MCP Tools (144 Total)

The server provides comprehensive CRUD operations for all Hudu entities. Here are the main tool categories:

### Core Entities (Full CRUD + Archive/Unarchive)
**Articles** (7 tools):
- `hudu_get_articles`, `hudu_get_article`, `hudu_create_article`, `hudu_update_article`, `hudu_delete_article`, `hudu_archive_article`, `hudu_unarchive_article`

**Assets** (7 tools):
- `hudu_get_assets`, `hudu_get_asset`, `hudu_create_asset`, `hudu_update_asset`, `hudu_delete_asset`, `hudu_archive_asset`, `hudu_unarchive_asset`

**Passwords** (7 tools):
- `hudu_get_passwords`, `hudu_get_password`, `hudu_create_password`, `hudu_update_password`, `hudu_delete_password`, `hudu_archive_password`, `hudu_unarchive_password`

**Companies** (7 tools):
- `hudu_get_companies`, `hudu_get_company`, `hudu_create_company`, `hudu_update_company`, `hudu_delete_company`, `hudu_archive_company`, `hudu_unarchive_company`

### Extended Entities (Full CRUD)
**Asset Layouts** (5 tools): Get, create, update, delete, list
**Activity Logs** (2 tools): Get, list  
**Folders** (5 tools): Get, create, update, delete, list
**Users** (5 tools): Get, create, update, delete, list
**Procedures** (5 tools): Get, create, update, delete, list
**Networks** (5 tools): Get, create, update, delete, list
**Password Folders** (5 tools): Get, create, update, delete, list
**Websites** (5 tools): Get, create, update, delete, list
**VLANs** (5 tools): Get, create, update, delete, list
**IP Addresses** (5 tools): Get, create, update, delete, list
**Relations** (5 tools): Get, create, update, delete, list
**Custom Lists** (5 tools): Get, create, update, delete, list
**Groups** (5 tools): Get, create, update, delete, list

### Specialized Tools
**Magic Dashboard** (5 tools): Get, create, update, delete, list
**Asset Matchers** (5 tools): Get, create, update, delete, list  
**Expirations** (2 tools): Get, list
**Data Exports** (2 tools): Get, list
**Rack Storage** (5 tools): Get, create, update, delete, list
**Rack Storage Items** (5 tools): Get, create, update, delete, list
**Public Photos** (5 tools): Get, create, update, delete, list
**Dashboard Cards** (2 tools): Get, list

### Utility Tools
**Search**: `hudu_search_all` - Search across all content types
**File Upload**: `hudu_upload_file` - Upload files to Hudu
**API Info**: `hudu_get_api_info` - Get API information
**Company Jump**: `hudu_company_jump` - Quick company access

All tools support comprehensive filtering, pagination, and search capabilities where applicable.

## Security

This MCP server follows security best practices:

- **API Key Authentication**: Secure connection to Hudu using API keys
- **User Consent**: All operations require explicit user consent through MCP client
- **Data Encryption**: All data transmitted securely over HTTPS
- **Access Control**: Respects Hudu's built-in permission system
- **Audit Logging**: All operations are logged in Hudu's activity logs

## Architecture

- **Node.js/TypeScript**: Modern, type-safe implementation
- **JSON-RPC 2.0**: Standard MCP communication protocol
- **Axios HTTP Client**: Robust API communication with Hudu
- **Zod Validation**: Runtime type validation for configuration
- **Modular Design**: Clean separation of concerns

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the [Hudu API documentation](https://docs.hudu.com/api)
- Review [MCP specification](https://modelcontextprotocol.io/specification/2025-06-18)
- Open an issue in this repository