import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { createServer } from 'http';
import { randomUUID } from 'crypto';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { HuduClient } from './hudu-client.js';
import { 
  HuduConfig, 
  MCP_RESOURCE_TYPES,
  HuduArticle,
  HuduAsset,
  HuduAssetPassword,
  HuduCompany,
  HuduAssetLayout,
  HuduActivityLog,
  HuduFolder,
  HuduUser,
  HuduProcedure,
  HuduProcedureTask,
  HuduNetwork,
  HuduPasswordFolder,
  HuduUpload,
  HuduWebsite,
  HuduVlan,
  HuduVlanZone,
  HuduIpAddress,
  HuduRelation,
  HuduList,
  HuduGroup,
  HuduMagicDash,
  HuduMatcher,
  HuduExpiration,
  HuduExport,
  HuduRackStorage,
  HuduRackStorageItem,
  HuduPublicPhoto,
  HuduCard
} from './types.js';
import { WORKING_TOOLS, WORKING_TOOL_EXECUTORS, type ToolResponse } from './tools/working-index.js';

export class HuduMcpServer {
  private server: Server;
  public huduClient: HuduClient;

  constructor(huduConfig: HuduConfig) {
    this.server = new Server(
      {
        name: 'hudu-mcp-server',
        version: '1.1.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.huduClient = new HuduClient(huduConfig);
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: `${MCP_RESOURCE_TYPES.ARTICLE}/list`,
            name: 'Hudu Articles',
            description: 'List of all knowledge base articles',
            mimeType: 'application/json',
          },
          {
            uri: `${MCP_RESOURCE_TYPES.ASSET}/list`,
            name: 'Hudu Assets',
            description: 'List of all IT assets',
            mimeType: 'application/json',
          },
          {
            uri: `${MCP_RESOURCE_TYPES.PASSWORD}/list`,
            name: 'Hudu Passwords',
            description: 'List of all password entries',
            mimeType: 'application/json',
          },
          {
            uri: `${MCP_RESOURCE_TYPES.COMPANY}/list`,
            name: 'Hudu Companies',
            description: 'List of all companies',
            mimeType: 'application/json',
          },
          {
            uri: `${MCP_RESOURCE_TYPES.ASSET_LAYOUT}/list`,
            name: 'Hudu Asset Layouts',
            description: 'List of all asset layout templates',
            mimeType: 'application/json',
          },
          {
            uri: `${MCP_RESOURCE_TYPES.ACTIVITY_LOG}/list`,
            name: 'Hudu Activity Logs',
            description: 'List of all activity logs',
            mimeType: 'application/json',
          },
          {
            uri: `${MCP_RESOURCE_TYPES.FOLDER}/list`,
            name: 'Hudu Folders',
            description: 'List of all folders',
            mimeType: 'application/json',
          },
          {
            uri: `${MCP_RESOURCE_TYPES.USER}/list`,
            name: 'Hudu Users',
            description: 'List of all users',
            mimeType: 'application/json',
          },
          {
            uri: `${MCP_RESOURCE_TYPES.PROCEDURE}/list`,
            name: 'Hudu Procedures',
            description: 'List of all procedures',
            mimeType: 'application/json',
          },
          {
            uri: `${MCP_RESOURCE_TYPES.NETWORK}/list`,
            name: 'Hudu Networks',
            description: 'List of all networks',
            mimeType: 'application/json',
          }
        ],
      };
    });

    // Read specific resources (simplified - just return basic info)
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request): Promise<{ contents: { uri: string; mimeType: string; text: string; }[]; }> => {
      const { uri } = request.params;
      
      try {
        let data: any[] = [];
        
        if (uri.startsWith(MCP_RESOURCE_TYPES.ARTICLE)) {
          data = await this.huduClient.getArticles({});
        } else if (uri.startsWith(MCP_RESOURCE_TYPES.ASSET)) {
          data = await this.huduClient.getAssets({});
        } else if (uri.startsWith(MCP_RESOURCE_TYPES.PASSWORD)) {
          data = await this.huduClient.getAssetPasswords({});
        } else if (uri.startsWith(MCP_RESOURCE_TYPES.COMPANY)) {
          data = await this.huduClient.getCompanies({});
        } else if (uri.startsWith(MCP_RESOURCE_TYPES.ASSET_LAYOUT)) {
          data = await this.huduClient.getAssetLayouts({});
        } else if (uri.startsWith(MCP_RESOURCE_TYPES.FOLDER)) {
          data = await this.huduClient.getFolders({});
        } else if (uri.startsWith(MCP_RESOURCE_TYPES.USER)) {
          data = await this.huduClient.getUsers({});
        } else if (uri.startsWith(MCP_RESOURCE_TYPES.PROCEDURE)) {
          data = await this.huduClient.getProcedures({});
        } else if (uri.startsWith(MCP_RESOURCE_TYPES.NETWORK)) {
          data = await this.huduClient.getNetworks({});
        } else {
          throw new McpError(ErrorCode.InvalidRequest, `Unknown resource URI: ${uri}`);
        }

        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(data, null, 2)
          }]
        };
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(ErrorCode.InternalError, `Failed to read resource: ${error}`);
      }
    });

    // List available tools - now using consolidated resource+action pattern
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = Object.values(WORKING_TOOLS).map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }));
      
      return {
        tools
      };
    });

    // Handle tool calls - now using consolidated resource+action pattern
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const executor = WORKING_TOOL_EXECUTORS[name];
        if (!executor) {
          throw new McpError(ErrorCode.InvalidRequest, `Unknown tool: ${name}`);
        }

        const result: ToolResponse = await executor(args, this.huduClient);
        
        if (result.success) {
          return { 
            content: [{ 
              type: 'text', 
              text: JSON.stringify(result.data || { success: true, message: result.message }) 
            }] 
          };
        } else {
          throw new McpError(ErrorCode.InternalError, result.error || 'Tool execution failed');
        }
      } catch (error: any) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error.message}`);
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Hudu MCP server running on stdio');
  }

  async runHttp(port: number): Promise<void> {
    const app = express();
    
    // Parse JSON middleware
    app.use(express.json());
    
    // CORS middleware
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Cache-Control, Mcp-Session-Id, Last-Event-ID');
      if (req.method === 'OPTIONS') {
        res.status(204).send();
        return;
      }
      next();
    });

    // Create Streamable HTTP transport with session management and security
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      allowedOrigins: ['http://localhost:*', 'http://127.0.0.1:*', '*'],
      enableDnsRebindingProtection: false, // Disabled for localhost development
      enableJsonResponse: false // Keep SSE streaming enabled for real-time communication
    });

    // Single MCP endpoint - handles both GET (SSE) and POST (JSON-RPC) requests
    app.all('/mcp', async (req, res) => {
      try {
        await transport.handleRequest(req, res);
      } catch (error) {
        console.error('Error handling MCP request:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Connect the MCP server to the transport
    await this.server.connect(transport);

    app.listen(port, () => {
      console.error(`Hudu MCP server running on Streamable HTTP transport at port ${port}`);
      console.error(`Connect Claude Code to: http://localhost:${port}/mcp`);
    });
    
    // Keep the process alive
    return new Promise(() => {});
  }
}