import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { HuduClient } from './hudu-client.js';
import { HuduConfig } from './types.js';
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
        protocolVersion: '2024-11-05',
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
        protocolVersion: '2024-11-05',
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
    // Support both 2024-11-05 and 2025-06-18 protocol versions
    const clientProtocolVersion = params?.protocolVersion || '2024-11-05';
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
        {
          name: 'hudu_get_articles',
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
          name: 'hudu_get_article',
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
          name: 'hudu_create_article',
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
          name: 'hudu_get_companies',
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
          name: 'hudu_get_assets',
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
          name: 'hudu_search_all',
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
      ],
    };
  }

  private async handleCallTool(params: any) {
    const { name, arguments: args } = params;
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
        
      case 'hudu_create_article':
        const newArticle = await huduClient.createArticle(args);
        return { content: [{ type: 'text', text: JSON.stringify(newArticle) }] };
        
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
          results.articles = await huduClient.getArticles({ search: query, company_id });
        }
        if (!type || type === 'assets') {
          results.assets = await huduClient.getAssets({ search: query, company_id });
        }
        if (!type || type === 'passwords') {
          results.passwords = await huduClient.getAssetPasswords({ search: query, company_id });
        }
        if (!type || type === 'companies') {
          results.companies = await huduClient.getCompanies({ search: query });
        }

        return { content: [{ type: 'text', text: JSON.stringify(results) }] };
        
      default:
        throw new Error(`Unknown tool: ${name}`);
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