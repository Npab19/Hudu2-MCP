// import { Server } from '@modelcontextprotocol/sdk/server/index.js';
// import { HuduClient } from './hudu-client.js';
import { HuduConfig, MCP_TOOLS } from './types.js';
import express, { Request, Response, NextFunction } from 'express';
import { HuduMcpServer } from './server.js';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: any;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export class HuduHttpServer {
  private app: express.Application;
  private mcpServer: HuduMcpServer;
  private port: number;

  constructor(huduConfig: HuduConfig, port: number = 3000) {
    this.app = express();
    this.mcpServer = new HuduMcpServer(huduConfig);
    this.port = port;
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Enhanced CORS middleware for mcpjam compatibility
    this.app.use((req: Request, res: Response, next: NextFunction): void => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Content-Type', 'application/json');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
      }
      
      next();
    });

    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Enhanced request logging for debugging
    this.app.use((req: Request, res: Response, next: NextFunction): void => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      console.log('Headers:', JSON.stringify(req.headers, null, 2));
      if (req.body && Object.keys(req.body).length > 0) {
        console.log('Request body:', JSON.stringify(req.body, null, 2));
      }
      if (req.query && Object.keys(req.query).length > 0) {
        console.log('Query params:', JSON.stringify(req.query, null, 2));
      }
      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // Keep server alive endpoint (for Docker)
    this.app.get('/keepalive', (req: Request, res: Response) => {
      res.json({ alive: true, uptime: process.uptime() });
    });

    // MCP info endpoint - try to match what mcpjam expects
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        name: 'hudu-mcp-server',
        version: '1.0.0',
        protocolVersion: '2025-06-18',
        serverInfo: {
          name: 'hudu-mcp-server',
          version: '1.0.0'
        },
        capabilities: {
          resources: {},
          tools: {}
        }
      });
    });

    // GET /mcp - Provide information about the endpoint
    this.app.get('/mcp', (req: Request, res: Response) => {
      res.json({
        name: 'hudu-mcp-server',
        version: '1.0.0',
        protocolVersion: '2025-06-18',
        transport: {
          type: 'http',
          endpoint: '/mcp'
        },
        capabilities: {
          resources: {},
          tools: {}
        },
        methods: ['POST'],
        supportedMethods: [
          'initialize',
          'resources/list', 
          'resources/read',
          'tools/list',
          'tools/call',
          'ping'
        ]
      });
    });

    // Main MCP JSON-RPC endpoint
    this.app.post('/mcp', async (req: Request, res: Response) => {
      try {
        const jsonRpcRequest: JsonRpcRequest = req.body;
        
        // Validate JSON-RPC request
        if (!this.isValidJsonRpcRequest(jsonRpcRequest)) {
          return res.status(400).json(this.createErrorResponse(null, -32600, 'Invalid Request'));
        }

        const response = await this.handleMcpRequest(jsonRpcRequest);
        if (response === null) {
          // This was a notification, return 204 No Content
          return res.status(204).send();
        }
        return res.json(response);
      } catch (error) {
        console.error('MCP request error:', error);
        return res.status(500).json(this.createErrorResponse(null, -32603, 'Internal error', error));
      }
    });

    // Batch request support
    this.app.post('/mcp/batch', async (req: Request, res: Response) => {
      try {
        const requests: JsonRpcRequest[] = req.body;
        
        if (!Array.isArray(requests)) {
          return res.status(400).json(this.createErrorResponse(null, -32600, 'Invalid Request'));
        }

        const responses = await Promise.all(
          requests.map(request => this.handleMcpRequest(request))
        );
        
        return res.json(responses);
      } catch (error) {
        console.error('MCP batch request error:', error);
        return res.status(500).json(this.createErrorResponse(null, -32603, 'Internal error', error));
      }
    });

    // Alternative MCP endpoints for compatibility
    this.app.post('/', async (req: Request, res: Response) => {
      // Forward root POST to /mcp handler
      try {
        const jsonRpcRequest: JsonRpcRequest = req.body;
        if (!this.isValidJsonRpcRequest(jsonRpcRequest)) {
          return res.status(400).json(this.createErrorResponse(null, -32600, 'Invalid Request'));
        }
        const response = await this.handleMcpRequest(jsonRpcRequest);
        return res.json(response);
      } catch (error) {
        console.error('MCP request error:', error);
        return res.status(500).json(this.createErrorResponse(null, -32603, 'Internal error', error));
      }
    });

    // Add a specific initialization endpoint
    this.app.post('/initialize', async (req: Request, res: Response) => {
      try {
        const result = await this.handleInitialize(req.body);
        return res.json({
          jsonrpc: '2.0',
          id: req.body.id || null,
          result
        });
      } catch (error) {
        return res.status(500).json(this.createErrorResponse(req.body.id || null, -32603, 'Internal error', error));
      }
    });

    // SSE endpoint for streaming (in case mcpjam expects this)
    this.app.get('/sse', (req: Request, res: Response) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });
      res.write('data: {"type":"connection","status":"ready"}\n\n');
      
      // Keep alive ping every 30 seconds
      const interval = setInterval(() => {
        res.write('data: {"type":"ping"}\n\n');
      }, 30000);
      
      req.on('close', () => {
        clearInterval(interval);
      });
    });
  }

  private isValidJsonRpcRequest(req: any): req is JsonRpcRequest {
    return (
      req &&
      req.jsonrpc === '2.0' &&
      typeof req.method === 'string' &&
      (req.id === undefined || req.id === null || typeof req.id === 'string' || typeof req.id === 'number')
    );
  }

  private createErrorResponse(id: string | number | null, code: number, message: string, data?: any): JsonRpcResponse {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message,
        ...(data && { data })
      }
    };
  }

  private createSuccessResponse(id: string | number | null, result: any): JsonRpcResponse {
    return {
      jsonrpc: '2.0',
      id,
      result
    };
  }

  private async handleMcpRequest(request: JsonRpcRequest): Promise<JsonRpcResponse | null> {
    const { id = null, method, params } = request;

    try {
      switch (method) {
        case 'initialize':
          return this.createSuccessResponse(id, await this.handleInitialize(params));
          
        case 'resources/list':
          return this.createSuccessResponse(id, await this.handleListResources());
          
        case 'resources/read':
          return this.createSuccessResponse(id, await this.handleReadResource(params));
          
        case 'tools/list':
          return this.createSuccessResponse(id, await this.handleListTools());
          
        case 'tools/call':
          return this.createSuccessResponse(id, await this.handleCallTool(params));
          
        case 'ping':
          return this.createSuccessResponse(id, {});
          
        case 'notifications/initialized':
          // Claude Code sends this after initialize - notifications don't need response
          if (request.id === undefined) {
            // This is a notification, don't return a response
            return null;
          }
          return this.createSuccessResponse(id, {});
          
        default:
          return this.createErrorResponse(id, -32601, `Method not found: ${method}`);
      }
    } catch (error) {
      console.error(`Error handling method ${method}:`, error);
      return this.createErrorResponse(id, -32603, 'Internal error', error);
    }
  }

  private async handleInitialize(params: any) {
    // Support both legacy and current protocol versions
    const clientProtocolVersion = params?.protocolVersion || '2025-06-18';
    return {
      protocolVersion: clientProtocolVersion,
      capabilities: {
        resources: {},
        tools: {},
      },
      serverInfo: {
        name: 'hudu-mcp-server',
        version: '1.0.0',
      },
    };
  }

  private async handleListResources() {
    // Get the server instance's resource handler
    const mcpServer = this.mcpServer as any;
    return {
      resources: [
        {
          uri: 'hudu://article/list',
          name: 'Hudu Articles',
          description: 'List of all knowledge base articles',
          mimeType: 'application/json',
        },
        {
          uri: 'hudu://asset/list',
          name: 'Hudu Assets',
          description: 'List of all IT assets',
          mimeType: 'application/json',
        },
        {
          uri: 'hudu://password/list',
          name: 'Hudu Passwords',
          description: 'List of all password entries',
          mimeType: 'application/json',
        },
        {
          uri: 'hudu://company/list',
          name: 'Hudu Companies',
          description: 'List of all companies',
          mimeType: 'application/json',
        },
        {
          uri: 'hudu://asset-layout/list',
          name: 'Hudu Asset Layouts',
          description: 'List of all asset layout templates',
          mimeType: 'application/json',
        },
        {
          uri: 'hudu://activity-log/list',
          name: 'Hudu Activity Logs',
          description: 'List of all activity logs',
          mimeType: 'application/json',
        },
      ],
    };
  }

  private async handleReadResource(params: any) {
    const { uri } = params;
    const huduClient = this.mcpServer.huduClient;
    
    if (uri === 'hudu://article/list') {
      const articles = await huduClient.getArticles();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(articles, null, 2),
        }],
      };
    } else if (uri === 'hudu://asset/list') {
      const assets = await huduClient.getAssets();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(assets, null, 2),
        }],
      };
    } else if (uri === 'hudu://password/list') {
      const passwords = await huduClient.getAssetPasswords();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(passwords, null, 2),
        }],
      };
    } else if (uri === 'hudu://company/list') {
      const companies = await huduClient.getCompanies();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(companies, null, 2),
        }],
      };
    } else if (uri === 'hudu://asset-layout/list') {
      const layouts = await huduClient.getAssetLayouts();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(layouts, null, 2),
        }],
      };
    } else if (uri === 'hudu://activity-log/list') {
      const logs = await huduClient.getActivityLogs();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(logs, null, 2),
        }],
      };
    }
    
    // Handle individual resource URIs
    const idMatch = uri.match(/\/(\d+)$/);
    if (idMatch) {
      const id = parseInt(idMatch[1], 10);
      
      if (uri.startsWith('hudu://article/')) {
        const article = await huduClient.getArticle(id);
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(article, null, 2),
          }],
        };
      } else if (uri.startsWith('hudu://asset/')) {
        const asset = await huduClient.getAsset(id);
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(asset, null, 2),
          }],
        };
      } else if (uri.startsWith('hudu://password/')) {
        const password = await huduClient.getAssetPassword(id);
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(password, null, 2),
          }],
        };
      } else if (uri.startsWith('hudu://company/')) {
        const company = await huduClient.getCompany(id);
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(company, null, 2),
          }],
        };
      }
    }
    
    throw new Error(`Unknown resource URI: ${uri}`);
  }

  private async handleListTools() {
    return {
      tools: [
        // Article tools
        {
          name: MCP_TOOLS.GET_ARTICLES,
          description: 'Get a list of articles with optional filtering',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Filter by article name' },
              company_id: { type: 'number', description: 'Filter by company ID' },
              page: { type: 'number', description: 'Page number for pagination' },
              page_size: { type: 'number', description: 'Number of results per page' },
              search: { type: 'string', description: 'Search query' },
              draft: { type: 'boolean', description: 'Filter by draft status' },
            },
          },
        },
        {
          name: MCP_TOOLS.GET_ARTICLE,
          description: 'Get a specific article by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Article ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.CREATE_ARTICLE,
          description: 'Create a new article',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Article name' },
              content: { type: 'string', description: 'Article content' },
              company_id: { type: 'number', description: 'Company ID' },
              folder_id: { type: 'number', description: 'Folder ID' },
              enable_sharing: { type: 'boolean', description: 'Enable public sharing' },
            },
            required: ['name', 'content'],
          },
        },
        {
          name: MCP_TOOLS.UPDATE_ARTICLE,
          description: 'Update an existing article',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Article ID' },
              name: { type: 'string', description: 'Article name' },
              content: { type: 'string', description: 'Article content' },
              company_id: { type: 'number', description: 'Company ID' },
              folder_id: { type: 'number', description: 'Folder ID' },
              enable_sharing: { type: 'boolean', description: 'Enable public sharing' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.DELETE_ARTICLE,
          description: 'Delete an article',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Article ID' },
            },
            required: ['id'],
          },
        },
        // Company tools
        {
          name: MCP_TOOLS.GET_COMPANIES,
          description: 'Get a list of companies',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Filter by company name' },
              page: { type: 'number', description: 'Page number' },
              page_size: { type: 'number', description: 'Results per page' },
              search: { type: 'string', description: 'Search query' },
            },
          },
        },
        {
          name: MCP_TOOLS.GET_COMPANY,
          description: 'Get a specific company by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Company ID' },
            },
            required: ['id'],
          },
        },
        // Asset tools  
        {
          name: MCP_TOOLS.GET_ASSETS,
          description: 'Get a list of assets',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Filter by asset name' },
              company_id: { type: 'number', description: 'Filter by company ID' },
              asset_layout_id: { type: 'number', description: 'Filter by asset layout ID' },
              page: { type: 'number', description: 'Page number' },
              page_size: { type: 'number', description: 'Results per page' },
              search: { type: 'string', description: 'Search query' },
              archived: { type: 'boolean', description: 'Include archived assets' },
            },
          },
        },
        {
          name: MCP_TOOLS.GET_ASSET,
          description: 'Get a specific asset by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Asset ID' },
            },
            required: ['id'],
          },
        },
        // Password tools
        {
          name: MCP_TOOLS.GET_PASSWORDS,
          description: 'Get a list of passwords',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Filter by password name' },
              company_id: { type: 'number', description: 'Filter by company ID' },
              page: { type: 'number', description: 'Page number' },
              page_size: { type: 'number', description: 'Results per page' },
              search: { type: 'string', description: 'Search query' },
            },
          },
        },
        // Missing Article tools
        {
          name: MCP_TOOLS.ARCHIVE_ARTICLE,
          description: 'Archive an article',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Article ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.UNARCHIVE_ARTICLE,
          description: 'Unarchive an article',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Article ID' },
            },
            required: ['id'],
          },
        },
        // Missing Asset tools
        {
          name: MCP_TOOLS.CREATE_ASSET,
          description: 'Create a new asset',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Asset name' },
              asset_type: { type: 'string', description: 'Asset type' },
              company_id: { type: 'number', description: 'Company ID' },
              asset_layout_id: { type: 'number', description: 'Asset layout ID' },
              fields: { type: 'array', description: 'Asset field values' },
            },
            required: ['name', 'company_id', 'asset_layout_id'],
          },
        },
        {
          name: MCP_TOOLS.UPDATE_ASSET,
          description: 'Update an existing asset',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Asset ID' },
              name: { type: 'string', description: 'Asset name' },
              asset_type: { type: 'string', description: 'Asset type' },
              fields: { type: 'array', description: 'Asset field values' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.DELETE_ASSET,
          description: 'Delete an asset',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Asset ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.ARCHIVE_ASSET,
          description: 'Archive an asset',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Asset ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.UNARCHIVE_ASSET,
          description: 'Unarchive an asset',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Asset ID' },
            },
            required: ['id'],
          },
        },
        // Missing Company tools
        {
          name: MCP_TOOLS.CREATE_COMPANY,
          description: 'Create a new company',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Company name' },
              nickname: { type: 'string', description: 'Company nickname' },
              company_type: { type: 'string', description: 'Company type' },
              address_line_1: { type: 'string', description: 'Address line 1' },
              city: { type: 'string', description: 'City' },
              state: { type: 'string', description: 'State' },
              zip: { type: 'string', description: 'ZIP code' },
              phone_number: { type: 'string', description: 'Phone number' },
              website: { type: 'string', description: 'Website URL' },
            },
            required: ['name'],
          },
        },
        {
          name: MCP_TOOLS.UPDATE_COMPANY,
          description: 'Update an existing company',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Company ID' },
              name: { type: 'string', description: 'Company name' },
              nickname: { type: 'string', description: 'Company nickname' },
              company_type: { type: 'string', description: 'Company type' },
              address_line_1: { type: 'string', description: 'Address line 1' },
              city: { type: 'string', description: 'City' },
              state: { type: 'string', description: 'State' },
              zip: { type: 'string', description: 'ZIP code' },
              phone_number: { type: 'string', description: 'Phone number' },
              website: { type: 'string', description: 'Website URL' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.ARCHIVE_COMPANY,
          description: 'Archive a company',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Company ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.UNARCHIVE_COMPANY,
          description: 'Unarchive a company',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Company ID' },
            },
            required: ['id'],
          },
        },
        // Missing Password tools
        {
          name: MCP_TOOLS.GET_PASSWORD,
          description: 'Get a specific password by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Password ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.CREATE_PASSWORD,
          description: 'Create a new password',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Password name' },
              username: { type: 'string', description: 'Username' },
              password: { type: 'string', description: 'Password value' },
              url: { type: 'string', description: 'URL' },
              description: { type: 'string', description: 'Description' },
              company_id: { type: 'number', description: 'Company ID' },
              passwordable_type: { type: 'string', description: 'Passwordable type' },
              passwordable_id: { type: 'number', description: 'Passwordable ID' },
            },
            required: ['name', 'password'],
          },
        },
        {
          name: MCP_TOOLS.UPDATE_PASSWORD,
          description: 'Update an existing password',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Password ID' },
              name: { type: 'string', description: 'Password name' },
              username: { type: 'string', description: 'Username' },
              password: { type: 'string', description: 'Password value' },
              url: { type: 'string', description: 'URL' },
              description: { type: 'string', description: 'Description' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.DELETE_PASSWORD,
          description: 'Delete a password',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Password ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.ARCHIVE_PASSWORD,
          description: 'Archive a password',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Password ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.UNARCHIVE_PASSWORD,
          description: 'Unarchive a password',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Password ID' },
            },
            required: ['id'],
          },
        },
        // Asset Layout tools
        {
          name: MCP_TOOLS.GET_ASSET_LAYOUTS,
          description: 'Get a list of asset layouts',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Filter by layout name' },
              page: { type: 'number', description: 'Page number' },
              slug: { type: 'string', description: 'Filter by slug' },
            },
          },
        },
        {
          name: MCP_TOOLS.GET_ASSET_LAYOUT,
          description: 'Get a specific asset layout by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Asset Layout ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.CREATE_ASSET_LAYOUT,
          description: 'Create a new asset layout',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Layout name' },
              icon: { type: 'string', description: 'Icon name' },
              color: { type: 'string', description: 'Color hex code' },
              icon_color: { type: 'string', description: 'Icon color hex code' },
              fields: { type: 'array', description: 'Layout fields configuration' },
            },
            required: ['name', 'icon', 'color', 'icon_color', 'fields'],
          },
        },
        {
          name: MCP_TOOLS.UPDATE_ASSET_LAYOUT,
          description: 'Update an existing asset layout',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Asset Layout ID' },
              name: { type: 'string', description: 'Layout name' },
              icon: { type: 'string', description: 'Icon name' },
              color: { type: 'string', description: 'Color hex code' },
              icon_color: { type: 'string', description: 'Icon color hex code' },
              fields: { type: 'array', description: 'Layout fields configuration' },
            },
            required: ['id'],
          },
        },
        // Activity Log tools
        {
          name: MCP_TOOLS.GET_ACTIVITY_LOGS,
          description: 'Get activity logs with optional filtering',
          inputSchema: {
            type: 'object',
            properties: {
              page: { type: 'number', description: 'Page number' },
              user_id: { type: 'number', description: 'Filter by user ID' },
              resource_type: { type: 'string', description: 'Filter by resource type' },
              start_date: { type: 'string', description: 'Filter by start date' },
            },
          },
        },
        {
          name: MCP_TOOLS.DELETE_ACTIVITY_LOGS,
          description: 'Delete activity logs before a specific datetime',
          inputSchema: {
            type: 'object',
            properties: {
              datetime: { type: 'string', description: 'ISO datetime before which to delete logs' },
              delete_unassigned_logs: { type: 'boolean', description: 'Whether to delete unassigned logs' },
            },
            required: ['datetime'],
          },
        },
        // Folder tools
        {
          name: MCP_TOOLS.GET_FOLDERS,
          description: 'Get a list of folders',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Filter by folder name' },
              company_id: { type: 'number', description: 'Filter by company ID' },
              page: { type: 'number', description: 'Page number' },
            },
          },
        },
        {
          name: MCP_TOOLS.GET_FOLDER,
          description: 'Get a specific folder by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Folder ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.CREATE_FOLDER,
          description: 'Create a new folder',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Folder name' },
              icon: { type: 'string', description: 'Folder icon' },
              description: { type: 'string', description: 'Folder description' },
              parent_folder_id: { type: 'number', description: 'Parent folder ID' },
              company_id: { type: 'number', description: 'Company ID' },
            },
            required: ['name', 'icon'],
          },
        },
        {
          name: MCP_TOOLS.UPDATE_FOLDER,
          description: 'Update an existing folder',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Folder ID' },
              name: { type: 'string', description: 'Folder name' },
              icon: { type: 'string', description: 'Folder icon' },
              description: { type: 'string', description: 'Folder description' },
              parent_folder_id: { type: 'number', description: 'Parent folder ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.DELETE_FOLDER,
          description: 'Delete a folder',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Folder ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.SEARCH_ALL,
          description: 'Search across all Hudu content types',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
              type: { 
                type: 'string', 
                enum: ['articles', 'assets', 'passwords', 'companies'],
                description: 'Specific content type to search'
              },
              company_id: { type: 'number', description: 'Filter by company ID' },
            },
            required: ['query'],
          },
        },
        // User tools
        {
          name: MCP_TOOLS.GET_USERS,
          description: 'Get a list of users',
          inputSchema: {
            type: 'object',
            properties: {
              page: { type: 'number', description: 'Page number' },
              email: { type: 'string', description: 'Filter by email' },
              name: { type: 'string', description: 'Filter by name' },
            },
          },
        },
        {
          name: MCP_TOOLS.GET_USER,
          description: 'Get a specific user by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'User ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.CREATE_USER,
          description: 'Create a new user',
          inputSchema: {
            type: 'object',
            properties: {
              email: { type: 'string', description: 'User email' },
              first_name: { type: 'string', description: 'First name' },
              last_name: { type: 'string', description: 'Last name' },
              admin: { type: 'boolean', description: 'Admin privileges' },
              active: { type: 'boolean', description: 'User is active' },
            },
            required: ['email', 'first_name', 'last_name'],
          },
        },
        {
          name: MCP_TOOLS.UPDATE_USER,
          description: 'Update an existing user',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'User ID' },
              email: { type: 'string', description: 'User email' },
              first_name: { type: 'string', description: 'First name' },
              last_name: { type: 'string', description: 'Last name' },
              admin: { type: 'boolean', description: 'Admin privileges' },
              active: { type: 'boolean', description: 'User is active' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.DELETE_USER,
          description: 'Delete a user',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'User ID' },
            },
            required: ['id'],
          },
        },
        // Procedure tools
        {
          name: MCP_TOOLS.GET_PROCEDURES,
          description: 'Get a list of procedures',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Filter by procedure name' },
              company_id: { type: 'number', description: 'Filter by company ID' },
              page: { type: 'number', description: 'Page number' },
            },
          },
        },
        {
          name: MCP_TOOLS.GET_PROCEDURE,
          description: 'Get a specific procedure by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Procedure ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.CREATE_PROCEDURE,
          description: 'Create a new procedure',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Procedure name' },
              description: { type: 'string', description: 'Procedure description' },
              company_id: { type: 'number', description: 'Company ID' },
              folder_id: { type: 'number', description: 'Folder ID' },
            },
            required: ['name'],
          },
        },
        {
          name: MCP_TOOLS.UPDATE_PROCEDURE,
          description: 'Update an existing procedure',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Procedure ID' },
              name: { type: 'string', description: 'Procedure name' },
              description: { type: 'string', description: 'Procedure description' },
              company_id: { type: 'number', description: 'Company ID' },
              folder_id: { type: 'number', description: 'Folder ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.DELETE_PROCEDURE,
          description: 'Delete a procedure',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Procedure ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.KICKOFF_PROCEDURE,
          description: 'Kickoff a procedure',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Procedure ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.DUPLICATE_PROCEDURE,
          description: 'Duplicate a procedure',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Procedure ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.CREATE_FROM_TEMPLATE,
          description: 'Create a procedure from template',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Template Procedure ID' },
            },
            required: ['id'],
          },
        },
        // Procedure Task tools
        {
          name: MCP_TOOLS.GET_PROCEDURE_TASKS,
          description: 'Get a list of procedure tasks',
          inputSchema: {
            type: 'object',
            properties: {
              procedure_id: { type: 'number', description: 'Filter by procedure ID' },
              page: { type: 'number', description: 'Page number' },
            },
          },
        },
        {
          name: MCP_TOOLS.GET_PROCEDURE_TASK,
          description: 'Get a specific procedure task by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Procedure Task ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.CREATE_PROCEDURE_TASK,
          description: 'Create a new procedure task',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Task name' },
              description: { type: 'string', description: 'Task description' },
              procedure_id: { type: 'number', description: 'Procedure ID' },
              position: { type: 'number', description: 'Task position' },
            },
            required: ['name', 'procedure_id'],
          },
        },
        {
          name: MCP_TOOLS.UPDATE_PROCEDURE_TASK,
          description: 'Update an existing procedure task',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Procedure Task ID' },
              name: { type: 'string', description: 'Task name' },
              description: { type: 'string', description: 'Task description' },
              position: { type: 'number', description: 'Task position' },
              completed: { type: 'boolean', description: 'Task completed status' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.DELETE_PROCEDURE_TASK,
          description: 'Delete a procedure task',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Procedure Task ID' },
            },
            required: ['id'],
          },
        },
        // Network tools
        {
          name: MCP_TOOLS.GET_NETWORKS,
          description: 'Get a list of networks',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Filter by network name' },
              company_id: { type: 'number', description: 'Filter by company ID' },
              page: { type: 'number', description: 'Page number' },
            },
          },
        },
        {
          name: MCP_TOOLS.GET_NETWORK,
          description: 'Get a specific network by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Network ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.CREATE_NETWORK,
          description: 'Create a new network',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Network name' },
              network_type: { type: 'string', description: 'Network type' },
              network: { type: 'string', description: 'Network address' },
              mask: { type: 'string', description: 'Network mask' },
              gateway: { type: 'string', description: 'Gateway address' },
              company_id: { type: 'number', description: 'Company ID' },
            },
            required: ['name', 'network_type', 'network', 'mask'],
          },
        },
        {
          name: MCP_TOOLS.UPDATE_NETWORK,
          description: 'Update an existing network',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Network ID' },
              name: { type: 'string', description: 'Network name' },
              network_type: { type: 'string', description: 'Network type' },
              network: { type: 'string', description: 'Network address' },
              mask: { type: 'string', description: 'Network mask' },
              gateway: { type: 'string', description: 'Gateway address' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.DELETE_NETWORK,
          description: 'Delete a network',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Network ID' },
            },
            required: ['id'],
          },
        },
        // Password Folder tools
        {
          name: MCP_TOOLS.GET_PASSWORD_FOLDERS,
          description: 'Get a list of password folders',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Filter by folder name' },
              company_id: { type: 'number', description: 'Filter by company ID' },
              page: { type: 'number', description: 'Page number' },
            },
          },
        },
        {
          name: MCP_TOOLS.GET_PASSWORD_FOLDER,
          description: 'Get a specific password folder by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Password Folder ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.CREATE_PASSWORD_FOLDER,
          description: 'Create a new password folder',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Folder name' },
              description: { type: 'string', description: 'Folder description' },
              company_id: { type: 'number', description: 'Company ID' },
              parent_folder_id: { type: 'number', description: 'Parent folder ID' },
            },
            required: ['name'],
          },
        },
        {
          name: MCP_TOOLS.UPDATE_PASSWORD_FOLDER,
          description: 'Update an existing password folder',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Password Folder ID' },
              name: { type: 'string', description: 'Folder name' },
              description: { type: 'string', description: 'Folder description' },
              parent_folder_id: { type: 'number', description: 'Parent folder ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.DELETE_PASSWORD_FOLDER,
          description: 'Delete a password folder',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Password Folder ID' },
            },
            required: ['id'],
          },
        },
        // Upload tools
        {
          name: MCP_TOOLS.GET_UPLOADS,
          description: 'Get a list of uploads',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Filter by upload name' },
              page: { type: 'number', description: 'Page number' },
            },
          },
        },
        {
          name: MCP_TOOLS.GET_UPLOAD,
          description: 'Get a specific upload by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Upload ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.CREATE_UPLOAD,
          description: 'Create a new upload',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Upload name' },
              filename: { type: 'string', description: 'File name' },
              content_type: { type: 'string', description: 'Content type' },
              uploadable_type: { type: 'string', description: 'Uploadable type' },
              uploadable_id: { type: 'number', description: 'Uploadable ID' },
            },
            required: ['name', 'filename'],
          },
        },
        {
          name: MCP_TOOLS.UPDATE_UPLOAD,
          description: 'Update an existing upload',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Upload ID' },
              name: { type: 'string', description: 'Upload name' },
              filename: { type: 'string', description: 'File name' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.DELETE_UPLOAD,
          description: 'Delete an upload',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Upload ID' },
            },
            required: ['id'],
          },
        },
        // Website tools
        {
          name: MCP_TOOLS.GET_WEBSITES,
          description: 'Get a list of websites',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Filter by website name' },
              company_id: { type: 'number', description: 'Filter by company ID' },
              page: { type: 'number', description: 'Page number' },
            },
          },
        },
        {
          name: MCP_TOOLS.GET_WEBSITE,
          description: 'Get a specific website by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Website ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.CREATE_WEBSITE,
          description: 'Create a new website',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Website name' },
              url: { type: 'string', description: 'Website URL' },
              company_id: { type: 'number', description: 'Company ID' },
              paused: { type: 'boolean', description: 'Website monitoring paused' },
            },
            required: ['name', 'url'],
          },
        },
        {
          name: MCP_TOOLS.UPDATE_WEBSITE,
          description: 'Update an existing website',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Website ID' },
              name: { type: 'string', description: 'Website name' },
              url: { type: 'string', description: 'Website URL' },
              paused: { type: 'boolean', description: 'Website monitoring paused' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.DELETE_WEBSITE,
          description: 'Delete a website',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Website ID' },
            },
            required: ['id'],
          },
        },
        // VLAN tools
        {
          name: MCP_TOOLS.GET_VLANS,
          description: 'Get a list of VLANs',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Filter by VLAN name' },
              network_id: { type: 'number', description: 'Filter by network ID' },
              page: { type: 'number', description: 'Page number' },
            },
          },
        },
        {
          name: MCP_TOOLS.GET_VLAN,
          description: 'Get a specific VLAN by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'VLAN ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.CREATE_VLAN,
          description: 'Create a new VLAN',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'VLAN name' },
              vid: { type: 'number', description: 'VLAN ID number' },
              network_id: { type: 'number', description: 'Network ID' },
            },
            required: ['name', 'vid'],
          },
        },
        {
          name: MCP_TOOLS.UPDATE_VLAN,
          description: 'Update an existing VLAN',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'VLAN ID' },
              name: { type: 'string', description: 'VLAN name' },
              vid: { type: 'number', description: 'VLAN ID number' },
              network_id: { type: 'number', description: 'Network ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.DELETE_VLAN,
          description: 'Delete a VLAN',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'VLAN ID' },
            },
            required: ['id'],
          },
        },
        // VLAN Zone tools
        {
          name: MCP_TOOLS.GET_VLAN_ZONES,
          description: 'Get a list of VLAN zones',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Filter by zone name' },
              company_id: { type: 'number', description: 'Filter by company ID' },
              page: { type: 'number', description: 'Page number' },
            },
          },
        },
        {
          name: MCP_TOOLS.GET_VLAN_ZONE,
          description: 'Get a specific VLAN zone by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'VLAN Zone ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.CREATE_VLAN_ZONE,
          description: 'Create a new VLAN zone',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Zone name' },
              description: { type: 'string', description: 'Zone description' },
              company_id: { type: 'number', description: 'Company ID' },
            },
            required: ['name'],
          },
        },
        {
          name: MCP_TOOLS.UPDATE_VLAN_ZONE,
          description: 'Update an existing VLAN zone',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'VLAN Zone ID' },
              name: { type: 'string', description: 'Zone name' },
              description: { type: 'string', description: 'Zone description' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.DELETE_VLAN_ZONE,
          description: 'Delete a VLAN zone',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'VLAN Zone ID' },
            },
            required: ['id'],
          },
        },
        // IP Address tools
        {
          name: MCP_TOOLS.GET_IP_ADDRESSES,
          description: 'Get a list of IP addresses',
          inputSchema: {
            type: 'object',
            properties: {
              address: { type: 'string', description: 'Filter by IP address' },
              network_id: { type: 'number', description: 'Filter by network ID' },
              page: { type: 'number', description: 'Page number' },
            },
          },
        },
        {
          name: MCP_TOOLS.GET_IP_ADDRESS,
          description: 'Get a specific IP address by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'IP Address ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.CREATE_IP_ADDRESS,
          description: 'Create a new IP address',
          inputSchema: {
            type: 'object',
            properties: {
              address: { type: 'string', description: 'IP address' },
              hostname: { type: 'string', description: 'Hostname' },
              network_id: { type: 'number', description: 'Network ID' },
            },
            required: ['address'],
          },
        },
        {
          name: MCP_TOOLS.UPDATE_IP_ADDRESS,
          description: 'Update an existing IP address',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'IP Address ID' },
              address: { type: 'string', description: 'IP address' },
              hostname: { type: 'string', description: 'Hostname' },
              network_id: { type: 'number', description: 'Network ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.DELETE_IP_ADDRESS,
          description: 'Delete an IP address',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'IP Address ID' },
            },
            required: ['id'],
          },
        },
        // Relation tools
        {
          name: MCP_TOOLS.GET_RELATIONS,
          description: 'Get a list of relations',
          inputSchema: {
            type: 'object',
            properties: {
              fromable_type: { type: 'string', description: 'Filter by from type' },
              fromable_id: { type: 'number', description: 'Filter by from ID' },
              toable_type: { type: 'string', description: 'Filter by to type' },
              toable_id: { type: 'number', description: 'Filter by to ID' },
              page: { type: 'number', description: 'Page number' },
            },
          },
        },
        {
          name: MCP_TOOLS.GET_RELATION,
          description: 'Get a specific relation by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Relation ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.CREATE_RELATION,
          description: 'Create a new relation',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Relation name' },
              description: { type: 'string', description: 'Relation description' },
              fromable_type: { type: 'string', description: 'From object type' },
              fromable_id: { type: 'number', description: 'From object ID' },
              toable_type: { type: 'string', description: 'To object type' },
              toable_id: { type: 'number', description: 'To object ID' },
            },
            required: ['fromable_type', 'fromable_id', 'toable_type', 'toable_id'],
          },
        },
        {
          name: MCP_TOOLS.UPDATE_RELATION,
          description: 'Update an existing relation',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Relation ID' },
              name: { type: 'string', description: 'Relation name' },
              description: { type: 'string', description: 'Relation description' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.DELETE_RELATION,
          description: 'Delete a relation',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Relation ID' },
            },
            required: ['id'],
          },
        },
        // List tools
        {
          name: MCP_TOOLS.GET_LISTS,
          description: 'Get a list of lists',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Filter by list name' },
              list_type: { type: 'string', description: 'Filter by list type' },
              page: { type: 'number', description: 'Page number' },
            },
          },
        },
        {
          name: MCP_TOOLS.GET_LIST,
          description: 'Get a specific list by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'List ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.CREATE_LIST,
          description: 'Create a new list',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'List name' },
              description: { type: 'string', description: 'List description' },
              list_type: { type: 'string', description: 'List type' },
              items: { type: 'array', description: 'List items' },
            },
            required: ['name', 'list_type'],
          },
        },
        {
          name: MCP_TOOLS.UPDATE_LIST,
          description: 'Update an existing list',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'List ID' },
              name: { type: 'string', description: 'List name' },
              description: { type: 'string', description: 'List description' },
              list_type: { type: 'string', description: 'List type' },
              items: { type: 'array', description: 'List items' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.DELETE_LIST,
          description: 'Delete a list',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'List ID' },
            },
            required: ['id'],
          },
        },
        // Group tools
        {
          name: MCP_TOOLS.GET_GROUPS,
          description: 'Get a list of groups',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Filter by group name' },
              page: { type: 'number', description: 'Page number' },
            },
          },
        },
        {
          name: MCP_TOOLS.GET_GROUP,
          description: 'Get a specific group by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Group ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.CREATE_GROUP,
          description: 'Create a new group',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Group name' },
              description: { type: 'string', description: 'Group description' },
              permissions: { type: 'array', description: 'Group permissions' },
            },
            required: ['name'],
          },
        },
        {
          name: MCP_TOOLS.UPDATE_GROUP,
          description: 'Update an existing group',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Group ID' },
              name: { type: 'string', description: 'Group name' },
              description: { type: 'string', description: 'Group description' },
              permissions: { type: 'array', description: 'Group permissions' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.DELETE_GROUP,
          description: 'Delete a group',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Group ID' },
            },
            required: ['id'],
          },
        },
        // Magic Dash tools
        {
          name: MCP_TOOLS.GET_MAGIC_DASHES,
          description: 'Get a list of magic dashes',
          inputSchema: {
            type: 'object',
            properties: {
              company_id: { type: 'number', description: 'Filter by company ID' },
              page: { type: 'number', description: 'Page number for pagination' },
              page_size: { type: 'number', description: 'Number of results per page' },
            },
          },
        },
        {
          name: MCP_TOOLS.GET_MAGIC_DASH,
          description: 'Get a specific magic dash by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Magic dash ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.CREATE_MAGIC_DASH,
          description: 'Create a new magic dash',
          inputSchema: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Magic dash title' },
              message: { type: 'string', description: 'Magic dash message' },
              icon: { type: 'string', description: 'Magic dash icon' },
              color: { type: 'string', description: 'Magic dash color' },
              company_id: { type: 'number', description: 'Company ID' },
            },
            required: ['title'],
          },
        },
        {
          name: MCP_TOOLS.UPDATE_MAGIC_DASH,
          description: 'Update an existing magic dash',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Magic dash ID' },
              title: { type: 'string', description: 'Magic dash title' },
              message: { type: 'string', description: 'Magic dash message' },
              icon: { type: 'string', description: 'Magic dash icon' },
              color: { type: 'string', description: 'Magic dash color' },
              company_id: { type: 'number', description: 'Company ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.DELETE_MAGIC_DASH,
          description: 'Delete a magic dash',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Magic dash ID' },
            },
            required: ['id'],
          },
        },
        // Matcher tools
        {
          name: MCP_TOOLS.GET_MATCHERS,
          description: 'Get a list of matchers',
          inputSchema: {
            type: 'object',
            properties: {
              company_id: { type: 'number', description: 'Filter by company ID' },
              page: { type: 'number', description: 'Page number for pagination' },
              page_size: { type: 'number', description: 'Number of results per page' },
            },
          },
        },
        {
          name: MCP_TOOLS.GET_MATCHER,
          description: 'Get a specific matcher by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Matcher ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.CREATE_MATCHER,
          description: 'Create a new matcher',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Matcher name' },
              matcher_type: { type: 'string', description: 'Type of matcher' },
              company_id: { type: 'number', description: 'Company ID' },
            },
            required: ['name'],
          },
        },
        {
          name: MCP_TOOLS.UPDATE_MATCHER,
          description: 'Update an existing matcher',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Matcher ID' },
              name: { type: 'string', description: 'Matcher name' },
              matcher_type: { type: 'string', description: 'Type of matcher' },
              company_id: { type: 'number', description: 'Company ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.DELETE_MATCHER,
          description: 'Delete a matcher',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Matcher ID' },
            },
            required: ['id'],
          },
        },
        // Expiration tools
        {
          name: MCP_TOOLS.GET_EXPIRATIONS,
          description: 'Get a list of expirations',
          inputSchema: {
            type: 'object',
            properties: {
              company_id: { type: 'number', description: 'Filter by company ID' },
              expiration_type: { type: 'string', description: 'Filter by expiration type' },
              page: { type: 'number', description: 'Page number for pagination' },
              page_size: { type: 'number', description: 'Number of results per page' },
            },
          },
        },
        // Export tools
        {
          name: MCP_TOOLS.GET_EXPORTS,
          description: 'Get a list of exports',
          inputSchema: {
            type: 'object',
            properties: {
              page: { type: 'number', description: 'Page number for pagination' },
              page_size: { type: 'number', description: 'Number of results per page' },
            },
          },
        },
        {
          name: MCP_TOOLS.GET_S3_EXPORTS,
          description: 'Get a list of S3 exports',
          inputSchema: {
            type: 'object',
            properties: {
              page: { type: 'number', description: 'Page number for pagination' },
              page_size: { type: 'number', description: 'Number of results per page' },
            },
          },
        },
        // Rack Storage tools
        {
          name: MCP_TOOLS.GET_RACK_STORAGES,
          description: 'Get a list of rack storages',
          inputSchema: {
            type: 'object',
            properties: {
              company_id: { type: 'number', description: 'Filter by company ID' },
              page: { type: 'number', description: 'Page number for pagination' },
              page_size: { type: 'number', description: 'Number of results per page' },
            },
          },
        },
        {
          name: MCP_TOOLS.GET_RACK_STORAGE,
          description: 'Get a specific rack storage by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Rack storage ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.CREATE_RACK_STORAGE,
          description: 'Create a new rack storage',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Rack storage name' },
              location: { type: 'string', description: 'Rack storage location' },
              company_id: { type: 'number', description: 'Company ID' },
            },
            required: ['name'],
          },
        },
        {
          name: MCP_TOOLS.UPDATE_RACK_STORAGE,
          description: 'Update an existing rack storage',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Rack storage ID' },
              name: { type: 'string', description: 'Rack storage name' },
              location: { type: 'string', description: 'Rack storage location' },
              company_id: { type: 'number', description: 'Company ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.DELETE_RACK_STORAGE,
          description: 'Delete a rack storage',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Rack storage ID' },
            },
            required: ['id'],
          },
        },
        // Rack Storage Item tools
        {
          name: MCP_TOOLS.GET_RACK_STORAGE_ITEMS,
          description: 'Get a list of rack storage items',
          inputSchema: {
            type: 'object',
            properties: {
              rack_storage_id: { type: 'number', description: 'Filter by rack storage ID' },
              page: { type: 'number', description: 'Page number for pagination' },
              page_size: { type: 'number', description: 'Number of results per page' },
            },
          },
        },
        {
          name: MCP_TOOLS.GET_RACK_STORAGE_ITEM,
          description: 'Get a specific rack storage item by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Rack storage item ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.CREATE_RACK_STORAGE_ITEM,
          description: 'Create a new rack storage item',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Rack storage item name' },
              rack_storage_id: { type: 'number', description: 'Rack storage ID' },
              position: { type: 'string', description: 'Position in rack storage' },
            },
            required: ['name', 'rack_storage_id'],
          },
        },
        {
          name: MCP_TOOLS.UPDATE_RACK_STORAGE_ITEM,
          description: 'Update an existing rack storage item',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Rack storage item ID' },
              name: { type: 'string', description: 'Rack storage item name' },
              rack_storage_id: { type: 'number', description: 'Rack storage ID' },
              position: { type: 'string', description: 'Position in rack storage' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.DELETE_RACK_STORAGE_ITEM,
          description: 'Delete a rack storage item',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Rack storage item ID' },
            },
            required: ['id'],
          },
        },
        // Public Photo tools
        {
          name: MCP_TOOLS.GET_PUBLIC_PHOTOS,
          description: 'Get a list of public photos',
          inputSchema: {
            type: 'object',
            properties: {
              page: { type: 'number', description: 'Page number for pagination' },
              page_size: { type: 'number', description: 'Number of results per page' },
            },
          },
        },
        {
          name: MCP_TOOLS.GET_PUBLIC_PHOTO,
          description: 'Get a specific public photo by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Public photo ID' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.CREATE_PUBLIC_PHOTO,
          description: 'Create a new public photo',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Photo name' },
              description: { type: 'string', description: 'Photo description' },
              file_url: { type: 'string', description: 'Photo file URL' },
            },
            required: ['name'],
          },
        },
        {
          name: MCP_TOOLS.UPDATE_PUBLIC_PHOTO,
          description: 'Update an existing public photo',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Public photo ID' },
              name: { type: 'string', description: 'Photo name' },
              description: { type: 'string', description: 'Photo description' },
              file_url: { type: 'string', description: 'Photo file URL' },
            },
            required: ['id'],
          },
        },
        {
          name: MCP_TOOLS.DELETE_PUBLIC_PHOTO,
          description: 'Delete a public photo',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Public photo ID' },
            },
            required: ['id'],
          },
        },
        // Card tools
        {
          name: MCP_TOOLS.CARD_JUMP,
          description: 'Jump to a specific card location',
          inputSchema: {
            type: 'object',
            properties: {
              card_id: { type: 'number', description: 'Card ID' },
              company_id: { type: 'number', description: 'Company ID' },
            },
            required: ['card_id'],
          },
        },
        {
          name: MCP_TOOLS.CARD_LOOKUP,
          description: 'Look up card information',
          inputSchema: {
            type: 'object',
            properties: {
              search: { type: 'string', description: 'Search query for cards' },
              company_id: { type: 'number', description: 'Filter by company ID' },
            },
          },
        },
        // Company Asset tools
        {
          name: MCP_TOOLS.GET_COMPANY_ASSETS,
          description: 'Get assets for a specific company',
          inputSchema: {
            type: 'object',
            properties: {
              company_id: { type: 'number', description: 'Company ID' },
              asset_layout_id: { type: 'number', description: 'Filter by asset layout ID' },
              page: { type: 'number', description: 'Page number for pagination' },
              page_size: { type: 'number', description: 'Number of results per page' },
            },
            required: ['company_id'],
          },
        },
        {
          name: MCP_TOOLS.GET_COMPANY_ASSET,
          description: 'Get a specific company asset by ID',
          inputSchema: {
            type: 'object',
            properties: {
              company_id: { type: 'number', description: 'Company ID' },
              asset_id: { type: 'number', description: 'Asset ID' },
            },
            required: ['company_id', 'asset_id'],
          },
        },
        {
          name: MCP_TOOLS.ARCHIVE_COMPANY_ASSET,
          description: 'Archive a company asset',
          inputSchema: {
            type: 'object',
            properties: {
              company_id: { type: 'number', description: 'Company ID' },
              asset_id: { type: 'number', description: 'Asset ID' },
            },
            required: ['company_id', 'asset_id'],
          },
        },
        {
          name: MCP_TOOLS.UNARCHIVE_COMPANY_ASSET,
          description: 'Unarchive a company asset',
          inputSchema: {
            type: 'object',
            properties: {
              company_id: { type: 'number', description: 'Company ID' },
              asset_id: { type: 'number', description: 'Asset ID' },
            },
            required: ['company_id', 'asset_id'],
          },
        },
        {
          name: MCP_TOOLS.MOVE_COMPANY_ASSET_LAYOUT,
          description: 'Move a company asset to a different layout',
          inputSchema: {
            type: 'object',
            properties: {
              company_id: { type: 'number', description: 'Company ID' },
              asset_id: { type: 'number', description: 'Asset ID' },
              new_layout_id: { type: 'number', description: 'New asset layout ID' },
            },
            required: ['company_id', 'asset_id', 'new_layout_id'],
          },
        },
        // Company Jump tool
        {
          name: MCP_TOOLS.COMPANY_JUMP,
          description: 'Jump to a specific company page',
          inputSchema: {
            type: 'object',
            properties: {
              company_id: { type: 'number', description: 'Company ID' },
            },
            required: ['company_id'],
          },
        },
        // API Info tool
        {
          name: MCP_TOOLS.GET_API_INFO,
          description: 'Get API information',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    };
  }

  private async handleCallTool(params: any) {
    const { name, arguments: args } = params;
    
    try {
      // Delegate to the main MCP server's tool handler using reflection
      const mcpServerInstance = this.mcpServer as any;
      const server = mcpServerInstance.server;
      
      // Create a mock request object that matches MCP CallToolRequest schema
      const mockRequest = {
        jsonrpc: '2.0' as const,
        id: null,
        method: 'tools/call',
        params: {
          name,
          arguments: args
        }
      };
      
      // Call the server's request handlers directly
      const handlers = server._requestHandlers;
      const toolHandler = handlers?.get('tools/call');
      
      if (toolHandler) {
        const result = await toolHandler(mockRequest);
        return result;
      } else {
        // Fallback to direct client calls for basic functionality
        const huduClient = this.mcpServer.huduClient;
        
        switch (name) {
          case 'hudu_get_articles':
            const articles = await huduClient.getArticles(args);
            return { content: [{ type: 'text', text: JSON.stringify(articles) }] };
            
          case 'hudu_get_article':
            if (!args || typeof args.id !== 'number') {
              throw new Error('Article ID is required');
            }
            const article = await huduClient.getArticle(args.id);
            return { content: [{ type: 'text', text: JSON.stringify(article) }] };
            
          case 'hudu_get_companies':
            const companies = await huduClient.getCompanies(args);
            return { content: [{ type: 'text', text: JSON.stringify(companies) }] };
            
          case 'hudu_get_assets':
            const assets = await huduClient.getAssets(args);
            return { content: [{ type: 'text', text: JSON.stringify(assets) }] };
            
          case 'hudu_search_all':
            const { query, type, company_id } = args;
            let results: any = {};

            if (!type || type === 'articles') {
              try {
                results.articles = await huduClient.getArticles({ search: query, company_id });
              } catch (error: any) {
                if (error.response?.status === 401) {
                  console.warn('Skipping articles search - insufficient permissions');
                } else {
                  throw error;
                }
              }
            }
            if (!type || type === 'assets') {
              try {
                results.assets = await huduClient.getAssets({ search: query, company_id });
              } catch (error: any) {
                if (error.response?.status === 401) {
                  console.warn('Skipping assets search - insufficient permissions');
                } else {
                  throw error;
                }
              }
            }
            if (!type || type === 'passwords') {
              try {
                results.passwords = await huduClient.getAssetPasswords({ search: query, company_id });
              } catch (error: any) {
                if (error.response?.status === 401) {
                  console.warn('Skipping passwords search - insufficient permissions');
                } else {
                  throw error;
                }
              }
            }
            if (!type || type === 'companies') {
              try {
                results.companies = await huduClient.getCompanies({ search: query });
              } catch (error: any) {
                if (error.response?.status === 401) {
                  console.warn('Skipping companies search - insufficient permissions');
                } else {
                  throw error;
                }
              }
            }

            return { content: [{ type: 'text', text: JSON.stringify(results) }] };
            
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      }
    } catch (error) {
      console.error(`Error executing tool ${name}:`, error);
      throw error;
    }
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.app.listen(this.port, () => {
          console.log(`Hudu MCP HTTP server running on port ${this.port}`);
          console.log(`Health check: http://localhost:${this.port}/health`);
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}