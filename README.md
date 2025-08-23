# Hudu MCP Server

A Model Context Protocol (MCP) server for Hudu IT documentation platform. This server provides secure access to Hudu resources through the standardized MCP interface, enabling AI assistants to interact with your IT documentation, assets, and password management system.

## Features

- **Complete Hudu API Coverage**: Access articles, assets, passwords, companies, and more
- **MCP 2025-06-18 Compliant**: Follows the latest MCP specification
- **Dual Transport Support**: Both HTTP JSON-RPC and stdio transports
- **Secure Authentication**: API key-based authentication with Hudu
- **Rich Resource Access**: Browse and search all Hudu content types
- **Comprehensive Tooling**: CRUD operations for all major Hudu entities
- **TypeScript Support**: Full type safety and excellent developer experience
- **Docker Ready**: Containerized deployment with health checks

## Installation

### Option 1: Docker (Recommended)

1. Clone the repository:
```bash
git clone <your-repo-url>
cd hudu-mcp-server
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

The server exposes the following resource types:

- `hudu://article/list` - List all articles
- `hudu://article/{id}` - Specific article
- `hudu://asset/list` - List all assets  
- `hudu://asset/{id}` - Specific asset
- `hudu://password/list` - List all passwords
- `hudu://password/{id}` - Specific password
- `hudu://company/list` - List all companies
- `hudu://company/{id}` - Specific company
- `hudu://asset-layout/list` - List all asset layouts
- `hudu://activity-log/list` - List all activity logs

## MCP Tools

### Articles
- `hudu_get_articles` - List articles with filtering
- `hudu_get_article` - Get specific article
- `hudu_create_article` - Create new article
- `hudu_update_article` - Update existing article
- `hudu_delete_article` - Delete article

### Assets
- `hudu_get_assets` - List assets with filtering
- `hudu_get_asset` - Get specific asset
- `hudu_create_asset` - Create new asset
- `hudu_update_asset` - Update existing asset
- `hudu_delete_asset` - Delete asset

### Passwords
- `hudu_get_passwords` - List passwords with filtering
- `hudu_get_password` - Get specific password
- `hudu_create_password` - Create new password
- `hudu_update_password` - Update existing password
- `hudu_delete_password` - Delete password

### Companies
- `hudu_get_companies` - List companies
- `hudu_get_company` - Get specific company
- `hudu_create_company` - Create new company
- `hudu_update_company` - Update existing company

### Search
- `hudu_search_all` - Search across all content types

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