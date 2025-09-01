import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import express from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';
import { HuduClient } from './hudu-client.js';
import { HuduConfig } from './types.js';
import { WORKING_TOOLS, WORKING_TOOL_EXECUTORS, type ToolResponse } from './tools/working-index.js';

export interface HuduMcpServerConfig {
  huduConfig: HuduConfig;
  logLevel?: string;
  port?: number;
  transport?: 'stdio' | 'http';
}

export class HuduMcpServer {
  private server: Server;
  private huduClient: HuduClient;
  private logger!: winston.Logger;
  private config: HuduMcpServerConfig;

  constructor(config: HuduMcpServerConfig) {
    this.config = config;
    
    // Setup Winston logger with file rotation first
    this.setupLogger();

    // Initialize Hudu client
    this.huduClient = new HuduClient(config.huduConfig);

    // Create MCP server with proper SDK patterns
    this.server = new Server(
      {
        name: 'hudu-mcp-server',
        version: '1.1.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.setupHandlers();
    this.logger.info('Hudu MCP Server initialized', {
      version: '1.1.0',
      huduBaseUrl: config.huduConfig.baseUrl,
      logLevel: config.logLevel || 'info',
      transport: config.transport || 'stdio'
    });
  }

  private setupLogger(): void {
    // Ensure logs directory exists
    const logsDir = join(process.cwd(), 'logs');
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });
    }

    // Initialize the logger
    this.logger = winston.createLogger({
      level: this.config.logLevel || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        // Console logging
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        // Combined log file (all levels)
        new DailyRotateFile({
          filename: join(logsDir, 'combined-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
          )
        }),
        // Error log file (error level only)
        new DailyRotateFile({
          filename: join(logsDir, 'error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '30d',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
          )
        }),
        // API log file (for API calls and responses)
        new DailyRotateFile({
          filename: join(logsDir, 'api-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '7d',
          level: 'debug',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
          )
        })
      ]
    });
  }

  private setupHandlers(): void {
    this.logger.debug('Setting up MCP request handlers');

    // Tools handler - using proper MCP SDK patterns
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.logger.debug('Listing available tools');
      
      const tools = Object.values(WORKING_TOOLS).map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }));

      this.logger.info('Tools listed successfully', { 
        count: tools.length,
        tools: tools.map(t => t.name)
      });

      return { tools };
    });

    // Tool execution handler - proper MCP SDK pattern
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const requestId = Math.random().toString(36).substring(7);
      
      this.logger.info('Tool execution started', {
        requestId,
        toolName: name,
        arguments: args
      });

      const startTime = Date.now();

      try {
        const executor = WORKING_TOOL_EXECUTORS[name];
        
        if (!executor) {
          this.logger.error('Unknown tool requested', {
            requestId,
            toolName: name,
            availableTools: Object.keys(WORKING_TOOL_EXECUTORS)
          });
          throw new McpError(ErrorCode.InvalidRequest, `Unknown tool: ${name}`);
        }

        const result: ToolResponse = await executor(args, this.huduClient);
        const duration = Date.now() - startTime;

        if (result.success) {
          this.logger.info('Tool execution completed successfully', {
            requestId,
            toolName: name,
            duration,
            dataSize: JSON.stringify(result.data).length
          });

          return {
            content: [{
              type: 'text',
              text: JSON.stringify(result.data || { success: true, message: result.message }, null, 2)
            }]
          };
        } else {
          this.logger.error('Tool execution failed', {
            requestId,
            toolName: name,
            duration,
            error: result.error
          });
          throw new McpError(ErrorCode.InternalError, result.error || 'Tool execution failed');
        }
      } catch (error: any) {
        const duration = Date.now() - startTime;
        this.logger.error('Tool execution error', {
          requestId,
          toolName: name,
          duration,
          error: error.message,
          stack: error.stack
        });
        
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error.message}`);
      }
    });

    // Resources handler - proper MCP SDK pattern
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      this.logger.debug('Listing available resources');
      
      const resources = [
        {
          uri: 'hudu://articles',
          name: 'Hudu Articles',
          description: 'Knowledge base articles from Hudu',
          mimeType: 'application/json'
        },
        {
          uri: 'hudu://assets',
          name: 'Hudu Assets',
          description: 'IT assets inventory from Hudu',
          mimeType: 'application/json'
        },
        {
          uri: 'hudu://companies',
          name: 'Hudu Companies',
          description: 'Company information from Hudu',
          mimeType: 'application/json'
        },
        {
          uri: 'hudu://passwords',
          name: 'Hudu Passwords',
          description: 'Password entries from Hudu',
          mimeType: 'application/json'
        }
      ];

      this.logger.info('Resources listed successfully', { 
        count: resources.length 
      });

      return { resources };
    });

    // Resource read handler - proper MCP SDK pattern
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      const requestId = Math.random().toString(36).substring(7);
      
      this.logger.info('Resource read started', {
        requestId,
        uri
      });

      try {
        let data: any[] = [];
        
        switch (uri) {
          case 'hudu://articles':
            data = await this.huduClient.getArticles({});
            break;
          case 'hudu://assets':
            data = await this.huduClient.getAssets({});
            break;
          case 'hudu://companies':
            data = await this.huduClient.getCompanies({});
            break;
          case 'hudu://passwords':
            data = await this.huduClient.getAssetPasswords({});
            break;
          default:
            throw new McpError(ErrorCode.InvalidRequest, `Unknown resource URI: ${uri}`);
        }

        this.logger.info('Resource read completed', {
          requestId,
          uri,
          dataSize: JSON.stringify(data).length
        });

        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(data, null, 2)
          }]
        };
      } catch (error: any) {
        this.logger.error('Resource read error', {
          requestId,
          uri,
          error: error.message
        });
        
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(ErrorCode.InternalError, `Failed to read resource: ${error.message}`);
      }
    });

    // Prompts handler - proper MCP SDK pattern
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      this.logger.debug('Listing available prompts');
      
      const prompts = [
        {
          name: 'hudu_security_audit',
          description: 'Generate a comprehensive security audit report based on Hudu data',
          arguments: [
            {
              name: 'company_id',
              description: 'Company ID to audit (optional)',
              required: false
            }
          ]
        },
        {
          name: 'hudu_asset_report',
          description: 'Generate an asset inventory report',
          arguments: [
            {
              name: 'company_id',
              description: 'Company ID to report on (optional)',
              required: false
            }
          ]
        }
      ];

      this.logger.info('Prompts listed successfully', { 
        count: prompts.length 
      });

      return { prompts };
    });

    // Prompt get handler - proper MCP SDK pattern
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      this.logger.info('Prompt requested', { name, arguments: args });

      switch (name) {
        case 'hudu_security_audit':
          const companyId = args?.company_id;
          return {
            description: 'Security audit prompt for Hudu data',
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `Perform a comprehensive security audit${companyId ? ` for company ID ${companyId}` : ' across all companies'}. Review assets, passwords, and documentation for security compliance. Focus on:

1. Password strength and rotation policies
2. Asset inventory completeness
3. Documentation coverage
4. Access controls and permissions
5. Compliance with security standards

Provide actionable recommendations for improvement.`
                }
              }
            ]
          };

        case 'hudu_asset_report':
          const reportCompanyId = args?.company_id;
          return {
            description: 'Asset inventory report prompt for Hudu data',
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `Generate a comprehensive asset inventory report${reportCompanyId ? ` for company ID ${reportCompanyId}` : ' across all companies'}. Include:

1. Total asset count by type
2. Assets requiring updates
3. Missing documentation
4. Asset relationships and dependencies
5. Compliance status

Format as a professional report with executive summary.`
                }
              }
            ]
          };

        default:
          throw new McpError(ErrorCode.InvalidRequest, `Unknown prompt: ${name}`);
      }
    });

    this.logger.debug('MCP request handlers setup complete');
  }

  async runStdio(): Promise<void> {
    this.logger.info('Starting MCP server with stdio transport');
    
    const transport = new StdioServerTransport();
    
    transport.onerror = (error) => {
      this.logger.error('Transport error', { error: error.message, stack: error.stack });
    };

    transport.onclose = () => {
      this.logger.info('Transport closed');
    };
    
    await this.server.connect(transport);
    
    this.logger.info('MCP server connected via stdio transport');
    
    // Handle graceful shutdown
    const shutdown = () => {
      this.logger.info('Shutting down MCP server');
      transport.close();
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  async runHttp(): Promise<void> {
    const port = this.config.port || 3050;
    this.logger.info('Starting MCP server with Streamable HTTP transport', { port });
    
    const app = express();
    
    // Configure middleware
    app.use(cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Mcp-Session-Id']
    }));
    
    app.use(express.json());
    
    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.1.0',
        transport: 'streamable-http'
      });
    });
    
    // Info endpoint
    app.get('/', (req, res) => {
      res.json({
        name: 'hudu-mcp-server',
        version: '1.1.0',
        mcp: {
          version: '2025-06-18',
          transports: {
            sse: '/sse',
            http: '/mcp'
          }
        }
      });
    });
    
    
    // SSE endpoint for MCP Inspector compatibility
    app.get('/sse', async (req, res) => {
      this.logger.info('SSE connection initiated', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      const transport = new SSEServerTransport('/sse', res);
      await this.server.connect(transport);
      
      this.logger.info('SSE transport connected');
    });
    
    // Create Streamable HTTP transport in stateless mode
    const httpTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      allowedOrigins: ['*'],
      enableDnsRebindingProtection: false,
      enableJsonResponse: false
    });
    
    // Connect the server to the HTTP transport
    await this.server.connect(httpTransport);
    
    // Streamable HTTP transport endpoint - handles both GET and POST
    app.all('/mcp', async (req, res) => {
      this.logger.info('Streamable HTTP MCP request received', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        method: req.method,
        body: req.method === 'POST' ? req.body : undefined
      });
      
      try {
        await httpTransport.handleRequest(req, res, req.body);
        this.logger.info('Streamable HTTP transport handled request');
      } catch (error: any) {
        this.logger.error('Transport error', { error: error.message });
        if (!res.headersSent) {
          res.status(500).json({ error: 'Transport error' });
        }
      }
    });
    
    // Start HTTP server
    const httpServer = app.listen(port, '0.0.0.0', () => {
      this.logger.info('MCP server started with dual transports', {
        port,
        endpoints: {
          health: `http://localhost:${port}/health`,
          info: `http://localhost:${port}/`,
          sse: `http://localhost:${port}/sse`,
          mcp: `http://localhost:${port}/mcp`
        }
      });
    });
    
    // Handle graceful shutdown
    const shutdown = () => {
      this.logger.info('Shutting down HTTP server');
      httpServer.close(() => {
        this.logger.info('HTTP server closed');
        process.exit(0);
      });
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
    // Keep the server running
    await new Promise(() => {});
  }

  async run(): Promise<void> {
    const transport = this.config.transport || 'stdio';
    
    if (transport === 'http') {
      await this.runHttp();
    } else {
      await this.runStdio();
    }
  }
}