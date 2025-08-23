import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
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
  MCP_TOOLS,
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

export class HuduMcpServer {
  private server: Server;
  public huduClient: HuduClient;

  constructor(huduConfig: HuduConfig) {
    this.server = new Server(
      {
        name: 'hudu-mcp-server',
        version: '1.0.0',
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
            uri: `${MCP_RESOURCE_TYPES.PROCEDURE_TASK}/list`,
            name: 'Hudu Procedure Tasks',
            description: 'List of all procedure tasks',
            mimeType: 'application/json',
          },
          {
            uri: `${MCP_RESOURCE_TYPES.NETWORK}/list`,
            name: 'Hudu Networks',
            description: 'List of all networks',
            mimeType: 'application/json',
          },
          {
            uri: `${MCP_RESOURCE_TYPES.PASSWORD_FOLDER}/list`,
            name: 'Hudu Password Folders',
            description: 'List of all password folders',
            mimeType: 'application/json',
          },
          {
            uri: `${MCP_RESOURCE_TYPES.UPLOAD}/list`,
            name: 'Hudu Uploads',
            description: 'List of all file uploads',
            mimeType: 'application/json',
          },
          {
            uri: `${MCP_RESOURCE_TYPES.WEBSITE}/list`,
            name: 'Hudu Websites',
            description: 'List of all monitored websites',
            mimeType: 'application/json',
          },
          {
            uri: `${MCP_RESOURCE_TYPES.VLAN}/list`,
            name: 'Hudu VLANs',
            description: 'List of all VLANs',
            mimeType: 'application/json',
          },
          {
            uri: `${MCP_RESOURCE_TYPES.VLAN_ZONE}/list`,
            name: 'Hudu VLAN Zones',
            description: 'List of all VLAN zones',
            mimeType: 'application/json',
          },
          {
            uri: `${MCP_RESOURCE_TYPES.IP_ADDRESS}/list`,
            name: 'Hudu IP Addresses',
            description: 'List of all IP addresses',
            mimeType: 'application/json',
          },
          {
            uri: `${MCP_RESOURCE_TYPES.RELATION}/list`,
            name: 'Hudu Relations',
            description: 'List of all object relations',
            mimeType: 'application/json',
          },
          {
            uri: `${MCP_RESOURCE_TYPES.LIST}/list`,
            name: 'Hudu Lists',
            description: 'List of all custom lists',
            mimeType: 'application/json',
          },
          {
            uri: `${MCP_RESOURCE_TYPES.GROUP}/list`,
            name: 'Hudu Groups',
            description: 'List of all user groups',
            mimeType: 'application/json',
          },
          {
            uri: `${MCP_RESOURCE_TYPES.MAGIC_DASH}/list`,
            name: 'Hudu Magic Dashes',
            description: 'List of all magic dashboard items',
            mimeType: 'application/json',
          },
          {
            uri: `${MCP_RESOURCE_TYPES.MATCHER}/list`,
            name: 'Hudu Matchers',
            description: 'List of all asset matchers',
            mimeType: 'application/json',
          },
          {
            uri: `${MCP_RESOURCE_TYPES.EXPIRATION}/list`,
            name: 'Hudu Expirations',
            description: 'List of all expiration items',
            mimeType: 'application/json',
          },
          {
            uri: `${MCP_RESOURCE_TYPES.EXPORT}/list`,
            name: 'Hudu Exports',
            description: 'List of all data exports',
            mimeType: 'application/json',
          },
          {
            uri: `${MCP_RESOURCE_TYPES.RACK_STORAGE}/list`,
            name: 'Hudu Rack Storage',
            description: 'List of all rack storage containers',
            mimeType: 'application/json',
          },
          {
            uri: `${MCP_RESOURCE_TYPES.RACK_STORAGE_ITEM}/list`,
            name: 'Hudu Rack Storage Items',
            description: 'List of all rack storage items',
            mimeType: 'application/json',
          },
          {
            uri: `${MCP_RESOURCE_TYPES.PUBLIC_PHOTO}/list`,
            name: 'Hudu Public Photos',
            description: 'List of all public photos',
            mimeType: 'application/json',
          },
          {
            uri: `${MCP_RESOURCE_TYPES.CARD}/list`,
            name: 'Hudu Cards',
            description: 'List of all dashboard cards',
            mimeType: 'application/json',
          },
        ],
      };
    });

    // Read specific resources
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request): Promise<{ contents: { uri: string; mimeType: string; text: string; }[]; }> => {
      const { uri } = request.params;
      
      try {
        if (uri.startsWith(MCP_RESOURCE_TYPES.ARTICLE)) {
          return await this.readArticleResource(uri);
        } else if (uri.startsWith(MCP_RESOURCE_TYPES.ASSET)) {
          return await this.readAssetResource(uri);
        } else if (uri.startsWith(MCP_RESOURCE_TYPES.PASSWORD)) {
          return await this.readPasswordResource(uri);
        } else if (uri.startsWith(MCP_RESOURCE_TYPES.COMPANY)) {
          return await this.readCompanyResource(uri);
        } else if (uri.startsWith(MCP_RESOURCE_TYPES.ASSET_LAYOUT)) {
          return await this.readAssetLayoutResource(uri);
        } else if (uri.startsWith(MCP_RESOURCE_TYPES.ACTIVITY_LOG)) {
          return await this.readActivityLogResource(uri);
        } else if (uri.startsWith(MCP_RESOURCE_TYPES.FOLDER)) {
          return await this.readFolderResource(uri);
        } else if (uri.startsWith(MCP_RESOURCE_TYPES.USER)) {
          return await this.readUserResource(uri);
        } else if (uri.startsWith(MCP_RESOURCE_TYPES.PROCEDURE)) {
          return await this.readProcedureResource(uri);
        } else if (uri.startsWith(MCP_RESOURCE_TYPES.PROCEDURE_TASK)) {
          return await this.readProcedureTaskResource(uri);
        } else if (uri.startsWith(MCP_RESOURCE_TYPES.NETWORK)) {
          return await this.readNetworkResource(uri);
        } else if (uri.startsWith(MCP_RESOURCE_TYPES.PASSWORD_FOLDER)) {
          return await this.readPasswordFolderResource(uri);
        } else if (uri.startsWith(MCP_RESOURCE_TYPES.UPLOAD)) {
          return await this.readUploadResource(uri);
        } else if (uri.startsWith(MCP_RESOURCE_TYPES.WEBSITE)) {
          return await this.readWebsiteResource(uri);
        } else if (uri.startsWith(MCP_RESOURCE_TYPES.VLAN)) {
          return await this.readVlanResource(uri);
        } else if (uri.startsWith(MCP_RESOURCE_TYPES.VLAN_ZONE)) {
          return await this.readVlanZoneResource(uri);
        } else if (uri.startsWith(MCP_RESOURCE_TYPES.IP_ADDRESS)) {
          return await this.readIpAddressResource(uri);
        } else if (uri.startsWith(MCP_RESOURCE_TYPES.RELATION)) {
          return await this.readRelationResource(uri);
        } else if (uri.startsWith(MCP_RESOURCE_TYPES.LIST)) {
          return await this.readListResource(uri);
        } else if (uri.startsWith(MCP_RESOURCE_TYPES.GROUP)) {
          return await this.readGroupResource(uri);
        } else if (uri.startsWith(MCP_RESOURCE_TYPES.MAGIC_DASH)) {
          return await this.readMagicDashResource(uri);
        } else if (uri.startsWith(MCP_RESOURCE_TYPES.MATCHER)) {
          return await this.readMatcherResource(uri);
        } else if (uri.startsWith(MCP_RESOURCE_TYPES.EXPIRATION)) {
          return await this.readExpirationResource(uri);
        } else if (uri.startsWith(MCP_RESOURCE_TYPES.EXPORT)) {
          return await this.readExportResource(uri);
        } else if (uri.startsWith(MCP_RESOURCE_TYPES.RACK_STORAGE)) {
          return await this.readRackStorageResource(uri);
        } else if (uri.startsWith(MCP_RESOURCE_TYPES.RACK_STORAGE_ITEM)) {
          return await this.readRackStorageItemResource(uri);
        } else if (uri.startsWith(MCP_RESOURCE_TYPES.PUBLIC_PHOTO)) {
          return await this.readPublicPhotoResource(uri);
        } else if (uri.startsWith(MCP_RESOURCE_TYPES.CARD)) {
          return await this.readCardResource(uri);
        }

        throw new McpError(ErrorCode.InvalidRequest, `Unknown resource URI: ${uri}`);
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(ErrorCode.InternalError, `Failed to read resource: ${error}`);
      }
    });

    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
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
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case MCP_TOOLS.GET_ARTICLES:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getArticles(args as any)) }] };
          case MCP_TOOLS.GET_ARTICLE:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Article ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getArticle((args as any).id)) }] };
          case MCP_TOOLS.CREATE_ARTICLE:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.createArticle(args as any)) }] };
          case MCP_TOOLS.UPDATE_ARTICLE:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Article ID is required');
            }
            const { id, ...updateData } = args as any;
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.updateArticle(id, updateData)) }] };
          case MCP_TOOLS.DELETE_ARTICLE:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Article ID is required');
            }
            await this.huduClient.deleteArticle((args as any).id);
            return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Article deleted' }) }] };
          
          case MCP_TOOLS.GET_COMPANIES:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getCompanies(args as any)) }] };
          case MCP_TOOLS.GET_COMPANY:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Company ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getCompany((args as any).id)) }] };
            
          case MCP_TOOLS.GET_ASSETS:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getAssets(args as any)) }] };
          case MCP_TOOLS.GET_ASSET:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Asset ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getAsset((args as any).id)) }] };
            
          case MCP_TOOLS.GET_PASSWORDS:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getAssetPasswords(args as any)) }] };

          // Missing Article handlers
          case MCP_TOOLS.ARCHIVE_ARTICLE:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Article ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.archiveArticle((args as any).id)) }] };
          case MCP_TOOLS.UNARCHIVE_ARTICLE:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Article ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.unarchiveArticle((args as any).id)) }] };

          // Missing Asset handlers
          case MCP_TOOLS.CREATE_ASSET:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.createAsset(args as any)) }] };
          case MCP_TOOLS.UPDATE_ASSET:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Asset ID is required');
            }
            const { id: assetId, ...assetUpdateData } = args as any;
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.updateAsset(assetId, assetUpdateData)) }] };
          case MCP_TOOLS.DELETE_ASSET:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Asset ID is required');
            }
            await this.huduClient.deleteAsset((args as any).id);
            return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Asset deleted' }) }] };
          case MCP_TOOLS.ARCHIVE_ASSET:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Asset ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.archiveAsset((args as any).id)) }] };
          case MCP_TOOLS.UNARCHIVE_ASSET:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Asset ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.unarchiveAsset((args as any).id)) }] };

          // Missing Company handlers
          case MCP_TOOLS.CREATE_COMPANY:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.createCompany(args as any)) }] };
          case MCP_TOOLS.UPDATE_COMPANY:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Company ID is required');
            }
            const { id: companyId, ...companyUpdateData } = args as any;
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.updateCompany(companyId, companyUpdateData)) }] };
          case MCP_TOOLS.ARCHIVE_COMPANY:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Company ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.archiveCompany((args as any).id)) }] };
          case MCP_TOOLS.UNARCHIVE_COMPANY:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Company ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.unarchiveCompany((args as any).id)) }] };

          // Missing Password handlers
          case MCP_TOOLS.GET_PASSWORD:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Password ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getAssetPassword((args as any).id)) }] };
          case MCP_TOOLS.CREATE_PASSWORD:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.createAssetPassword(args as any)) }] };
          case MCP_TOOLS.UPDATE_PASSWORD:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Password ID is required');
            }
            const { id: passwordId, ...passwordUpdateData } = args as any;
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.updateAssetPassword(passwordId, passwordUpdateData)) }] };
          case MCP_TOOLS.DELETE_PASSWORD:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Password ID is required');
            }
            await this.huduClient.deleteAssetPassword((args as any).id);
            return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Password deleted' }) }] };
          case MCP_TOOLS.ARCHIVE_PASSWORD:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Password ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.archiveAssetPassword((args as any).id)) }] };
          case MCP_TOOLS.UNARCHIVE_PASSWORD:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Password ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.unarchiveAssetPassword((args as any).id)) }] };

          // Asset Layout handlers
          case MCP_TOOLS.GET_ASSET_LAYOUTS:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getAssetLayouts(args as any)) }] };
          case MCP_TOOLS.GET_ASSET_LAYOUT:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Asset Layout ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getAssetLayout((args as any).id)) }] };
          case MCP_TOOLS.CREATE_ASSET_LAYOUT:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.createAssetLayout(args as any)) }] };
          case MCP_TOOLS.UPDATE_ASSET_LAYOUT:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Asset Layout ID is required');
            }
            const { id: layoutId, ...layoutUpdateData } = args as any;
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.updateAssetLayout(layoutId, layoutUpdateData)) }] };

          // Activity Log handlers
          case MCP_TOOLS.GET_ACTIVITY_LOGS:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getActivityLogs(args as any)) }] };
          case MCP_TOOLS.DELETE_ACTIVITY_LOGS:
            if (!args || typeof (args as any).datetime !== 'string') {
              throw new McpError(ErrorCode.InvalidRequest, 'Datetime is required');
            }
            await this.huduClient.deleteActivityLogs((args as any).datetime, (args as any).delete_unassigned_logs);
            return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Activity logs deleted' }) }] };

          // Folder handlers
          case MCP_TOOLS.GET_FOLDERS:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getFolders(args as any)) }] };
          case MCP_TOOLS.GET_FOLDER:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Folder ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getFolder((args as any).id)) }] };
          case MCP_TOOLS.CREATE_FOLDER:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.createFolder(args as any)) }] };
          case MCP_TOOLS.UPDATE_FOLDER:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Folder ID is required');
            }
            const { id: folderId, ...folderUpdateData } = args as any;
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.updateFolder(folderId, folderUpdateData)) }] };
          case MCP_TOOLS.DELETE_FOLDER:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Folder ID is required');
            }
            await this.huduClient.deleteFolder((args as any).id);
            return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Folder deleted' }) }] };

          // User handlers
          case MCP_TOOLS.GET_USERS:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getUsers(args as any)) }] };
          case MCP_TOOLS.GET_USER:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'User ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getUser((args as any).id)) }] };
          case MCP_TOOLS.CREATE_USER:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.createUser(args as any)) }] };
          case MCP_TOOLS.UPDATE_USER:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'User ID is required');
            }
            const { id: userId, ...userUpdateData } = args as any;
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.updateUser(userId, userUpdateData)) }] };
          case MCP_TOOLS.DELETE_USER:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'User ID is required');
            }
            await this.huduClient.deleteUser((args as any).id);
            return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'User deleted' }) }] };

          // Procedure handlers
          case MCP_TOOLS.GET_PROCEDURES:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getProcedures(args as any)) }] };
          case MCP_TOOLS.GET_PROCEDURE:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Procedure ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getProcedure((args as any).id)) }] };
          case MCP_TOOLS.CREATE_PROCEDURE:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.createProcedure(args as any)) }] };
          case MCP_TOOLS.UPDATE_PROCEDURE:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Procedure ID is required');
            }
            const { id: procedureId, ...procedureUpdateData } = args as any;
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.updateProcedure(procedureId, procedureUpdateData)) }] };
          case MCP_TOOLS.DELETE_PROCEDURE:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Procedure ID is required');
            }
            await this.huduClient.deleteProcedure((args as any).id);
            return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Procedure deleted' }) }] };
          case MCP_TOOLS.KICKOFF_PROCEDURE:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Procedure ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.kickoffProcedure((args as any).id)) }] };
          case MCP_TOOLS.DUPLICATE_PROCEDURE:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Procedure ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.duplicateProcedure((args as any).id)) }] };
          case MCP_TOOLS.CREATE_FROM_TEMPLATE:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Template Procedure ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.createFromTemplate((args as any).id)) }] };

          // Procedure Task handlers
          case MCP_TOOLS.GET_PROCEDURE_TASKS:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getProcedureTasks(args as any)) }] };
          case MCP_TOOLS.GET_PROCEDURE_TASK:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Procedure Task ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getProcedureTask((args as any).id)) }] };
          case MCP_TOOLS.CREATE_PROCEDURE_TASK:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.createProcedureTask(args as any)) }] };
          case MCP_TOOLS.UPDATE_PROCEDURE_TASK:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Procedure Task ID is required');
            }
            const { id: taskId, ...taskUpdateData } = args as any;
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.updateProcedureTask(taskId, taskUpdateData)) }] };
          case MCP_TOOLS.DELETE_PROCEDURE_TASK:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Procedure Task ID is required');
            }
            await this.huduClient.deleteProcedureTask((args as any).id);
            return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Procedure task deleted' }) }] };

          // Network handlers
          case MCP_TOOLS.GET_NETWORKS:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getNetworks(args as any)) }] };
          case MCP_TOOLS.GET_NETWORK:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Network ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getNetwork((args as any).id)) }] };
          case MCP_TOOLS.CREATE_NETWORK:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.createNetwork(args as any)) }] };
          case MCP_TOOLS.UPDATE_NETWORK:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Network ID is required');
            }
            const { id: networkId, ...networkUpdateData } = args as any;
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.updateNetwork(networkId, networkUpdateData)) }] };
          case MCP_TOOLS.DELETE_NETWORK:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Network ID is required');
            }
            await this.huduClient.deleteNetwork((args as any).id);
            return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Network deleted' }) }] };

          // Password Folder handlers
          case MCP_TOOLS.GET_PASSWORD_FOLDERS:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getPasswordFolders(args as any)) }] };
          case MCP_TOOLS.GET_PASSWORD_FOLDER:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Password Folder ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getPasswordFolder((args as any).id)) }] };
          case MCP_TOOLS.CREATE_PASSWORD_FOLDER:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.createPasswordFolder(args as any)) }] };
          case MCP_TOOLS.UPDATE_PASSWORD_FOLDER:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Password Folder ID is required');
            }
            const { id: passwordFolderId, ...passwordFolderUpdateData } = args as any;
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.updatePasswordFolder(passwordFolderId, passwordFolderUpdateData)) }] };
          case MCP_TOOLS.DELETE_PASSWORD_FOLDER:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Password Folder ID is required');
            }
            await this.huduClient.deletePasswordFolder((args as any).id);
            return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Password folder deleted' }) }] };

          // Upload handlers
          case MCP_TOOLS.GET_UPLOADS:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getUploads(args as any)) }] };
          case MCP_TOOLS.GET_UPLOAD:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Upload ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getUpload((args as any).id)) }] };
          case MCP_TOOLS.CREATE_UPLOAD:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.createUpload(args as any)) }] };
          case MCP_TOOLS.UPDATE_UPLOAD:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Upload ID is required');
            }
            const { id: uploadId, ...uploadUpdateData } = args as any;
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.updateUpload(uploadId, uploadUpdateData)) }] };
          case MCP_TOOLS.DELETE_UPLOAD:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Upload ID is required');
            }
            await this.huduClient.deleteUpload((args as any).id);
            return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Upload deleted' }) }] };

          // Website handlers
          case MCP_TOOLS.GET_WEBSITES:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getWebsites(args as any)) }] };
          case MCP_TOOLS.GET_WEBSITE:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Website ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getWebsite((args as any).id)) }] };
          case MCP_TOOLS.CREATE_WEBSITE:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.createWebsite(args as any)) }] };
          case MCP_TOOLS.UPDATE_WEBSITE:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Website ID is required');
            }
            const { id: websiteId, ...websiteUpdateData } = args as any;
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.updateWebsite(websiteId, websiteUpdateData)) }] };
          case MCP_TOOLS.DELETE_WEBSITE:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Website ID is required');
            }
            await this.huduClient.deleteWebsite((args as any).id);
            return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Website deleted' }) }] };

          // VLAN handlers
          case MCP_TOOLS.GET_VLANS:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getVlans(args as any)) }] };
          case MCP_TOOLS.GET_VLAN:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'VLAN ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getVlan((args as any).id)) }] };
          case MCP_TOOLS.CREATE_VLAN:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.createVlan(args as any)) }] };
          case MCP_TOOLS.UPDATE_VLAN:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'VLAN ID is required');
            }
            const { id: vlanId, ...vlanUpdateData } = args as any;
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.updateVlan(vlanId, vlanUpdateData)) }] };
          case MCP_TOOLS.DELETE_VLAN:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'VLAN ID is required');
            }
            await this.huduClient.deleteVlan((args as any).id);
            return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'VLAN deleted' }) }] };

          // VLAN Zone handlers
          case MCP_TOOLS.GET_VLAN_ZONES:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getVlanZones(args as any)) }] };
          case MCP_TOOLS.GET_VLAN_ZONE:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'VLAN Zone ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getVlanZone((args as any).id)) }] };
          case MCP_TOOLS.CREATE_VLAN_ZONE:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.createVlanZone(args as any)) }] };
          case MCP_TOOLS.UPDATE_VLAN_ZONE:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'VLAN Zone ID is required');
            }
            const { id: vlanZoneId, ...vlanZoneUpdateData } = args as any;
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.updateVlanZone(vlanZoneId, vlanZoneUpdateData)) }] };
          case MCP_TOOLS.DELETE_VLAN_ZONE:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'VLAN Zone ID is required');
            }
            await this.huduClient.deleteVlanZone((args as any).id);
            return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'VLAN zone deleted' }) }] };

          // IP Address handlers
          case MCP_TOOLS.GET_IP_ADDRESSES:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getIpAddresses(args as any)) }] };
          case MCP_TOOLS.GET_IP_ADDRESS:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'IP Address ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getIpAddress((args as any).id)) }] };
          case MCP_TOOLS.CREATE_IP_ADDRESS:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.createIpAddress(args as any)) }] };
          case MCP_TOOLS.UPDATE_IP_ADDRESS:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'IP Address ID is required');
            }
            const { id: ipAddressId, ...ipAddressUpdateData } = args as any;
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.updateIpAddress(ipAddressId, ipAddressUpdateData)) }] };
          case MCP_TOOLS.DELETE_IP_ADDRESS:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'IP Address ID is required');
            }
            await this.huduClient.deleteIpAddress((args as any).id);
            return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'IP address deleted' }) }] };

          // Relation handlers
          case MCP_TOOLS.GET_RELATIONS:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getRelations(args as any)) }] };
          case MCP_TOOLS.GET_RELATION:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Relation ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getRelation((args as any).id)) }] };
          case MCP_TOOLS.CREATE_RELATION:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.createRelation(args as any)) }] };
          case MCP_TOOLS.UPDATE_RELATION:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Relation ID is required');
            }
            const { id: relationId, ...relationUpdateData } = args as any;
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.updateRelation(relationId, relationUpdateData)) }] };
          case MCP_TOOLS.DELETE_RELATION:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Relation ID is required');
            }
            await this.huduClient.deleteRelation((args as any).id);
            return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Relation deleted' }) }] };

          // List handlers
          case MCP_TOOLS.GET_LISTS:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getLists(args as any)) }] };
          case MCP_TOOLS.GET_LIST:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'List ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getList((args as any).id)) }] };
          case MCP_TOOLS.CREATE_LIST:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.createList(args as any)) }] };
          case MCP_TOOLS.UPDATE_LIST:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'List ID is required');
            }
            const { id: listId, ...listUpdateData } = args as any;
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.updateList(listId, listUpdateData)) }] };
          case MCP_TOOLS.DELETE_LIST:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'List ID is required');
            }
            await this.huduClient.deleteList((args as any).id);
            return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'List deleted' }) }] };

          // Group handlers
          case MCP_TOOLS.GET_GROUPS:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getGroups(args as any)) }] };
          case MCP_TOOLS.GET_GROUP:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Group ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getGroup((args as any).id)) }] };
          case MCP_TOOLS.CREATE_GROUP:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.createGroup(args as any)) }] };
          case MCP_TOOLS.UPDATE_GROUP:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Group ID is required');
            }
            const { id: groupId, ...groupUpdateData } = args as any;
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.updateGroup(groupId, groupUpdateData)) }] };
          case MCP_TOOLS.DELETE_GROUP:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Group ID is required');
            }
            await this.huduClient.deleteGroup((args as any).id);
            return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Group deleted' }) }] };

          // Magic Dash handlers
          case MCP_TOOLS.GET_MAGIC_DASHES:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getMagicDashes(args as any)) }] };
          case MCP_TOOLS.GET_MAGIC_DASH:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Magic dash ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getMagicDash((args as any).id)) }] };
          case MCP_TOOLS.CREATE_MAGIC_DASH:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.createMagicDash(args as any)) }] };
          case MCP_TOOLS.UPDATE_MAGIC_DASH:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Magic dash ID is required');
            }
            await this.huduClient.updateMagicDash((args as any).id, args as any);
            return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Magic dash updated' }) }] };
          case MCP_TOOLS.DELETE_MAGIC_DASH:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Magic dash ID is required');
            }
            await this.huduClient.deleteMagicDash((args as any).id);
            return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Magic dash deleted' }) }] };

          // Matcher handlers
          case MCP_TOOLS.GET_MATCHERS:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getMatchers(args as any)) }] };
          case MCP_TOOLS.GET_MATCHER:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Matcher ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getMatcher((args as any).id)) }] };
          case MCP_TOOLS.CREATE_MATCHER:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.createMatcher(args as any)) }] };
          case MCP_TOOLS.UPDATE_MATCHER:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Matcher ID is required');
            }
            await this.huduClient.updateMatcher((args as any).id, args as any);
            return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Matcher updated' }) }] };
          case MCP_TOOLS.DELETE_MATCHER:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Matcher ID is required');
            }
            await this.huduClient.deleteMatcher((args as any).id);
            return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Matcher deleted' }) }] };

          // Expiration handlers
          case MCP_TOOLS.GET_EXPIRATIONS:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getExpirations(args as any)) }] };

          // Export handlers
          case MCP_TOOLS.GET_EXPORTS:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getExports(args as any)) }] };
          case MCP_TOOLS.GET_S3_EXPORTS:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getS3Exports(args as any)) }] };

          // Rack Storage handlers
          case MCP_TOOLS.GET_RACK_STORAGES:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getRackStorages(args as any)) }] };
          case MCP_TOOLS.GET_RACK_STORAGE:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Rack storage ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getRackStorage((args as any).id)) }] };
          case MCP_TOOLS.CREATE_RACK_STORAGE:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.createRackStorage(args as any)) }] };
          case MCP_TOOLS.UPDATE_RACK_STORAGE:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Rack storage ID is required');
            }
            await this.huduClient.updateRackStorage((args as any).id, args as any);
            return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Rack storage updated' }) }] };
          case MCP_TOOLS.DELETE_RACK_STORAGE:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Rack storage ID is required');
            }
            await this.huduClient.deleteRackStorage((args as any).id);
            return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Rack storage deleted' }) }] };

          // Rack Storage Item handlers
          case MCP_TOOLS.GET_RACK_STORAGE_ITEMS:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getRackStorageItems(args as any)) }] };
          case MCP_TOOLS.GET_RACK_STORAGE_ITEM:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Rack storage item ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getRackStorageItem((args as any).id)) }] };
          case MCP_TOOLS.CREATE_RACK_STORAGE_ITEM:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.createRackStorageItem(args as any)) }] };
          case MCP_TOOLS.UPDATE_RACK_STORAGE_ITEM:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Rack storage item ID is required');
            }
            await this.huduClient.updateRackStorageItem((args as any).id, args as any);
            return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Rack storage item updated' }) }] };
          case MCP_TOOLS.DELETE_RACK_STORAGE_ITEM:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Rack storage item ID is required');
            }
            await this.huduClient.deleteRackStorageItem((args as any).id);
            return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Rack storage item deleted' }) }] };

          // Public Photo handlers
          case MCP_TOOLS.GET_PUBLIC_PHOTOS:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getPublicPhotos(args as any)) }] };
          case MCP_TOOLS.GET_PUBLIC_PHOTO:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Public photo ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getPublicPhoto((args as any).id)) }] };
          case MCP_TOOLS.CREATE_PUBLIC_PHOTO:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.createPublicPhoto(args as any)) }] };
          case MCP_TOOLS.UPDATE_PUBLIC_PHOTO:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Public photo ID is required');
            }
            await this.huduClient.updatePublicPhoto((args as any).id, args as any);
            return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Public photo updated' }) }] };
          case MCP_TOOLS.DELETE_PUBLIC_PHOTO:
            if (!args || typeof (args as any).id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Public photo ID is required');
            }
            await this.huduClient.deletePublicPhoto((args as any).id);
            return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Public photo deleted' }) }] };

          // Card handlers
          case MCP_TOOLS.CARD_JUMP:
            if (!args || typeof (args as any).name !== 'string') {
              throw new McpError(ErrorCode.InvalidRequest, 'Card name is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.cardJump({ name: (args as any).name, company_id: (args as any).company_id })) }] };
          case MCP_TOOLS.CARD_LOOKUP:
            if (!args || typeof (args as any).name !== 'string') {
              throw new McpError(ErrorCode.InvalidRequest, 'Card name is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.cardLookup({ name: (args as any).name, company_id: (args as any).company_id })) }] };

          // Company Asset handlers
          case MCP_TOOLS.GET_COMPANY_ASSETS:
            if (!args || typeof (args as any).company_id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Company ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getCompanyAssets((args as any).company_id, args as any)) }] };
          case MCP_TOOLS.GET_COMPANY_ASSET:
            if (!args || typeof (args as any).company_id !== 'number' || typeof (args as any).asset_id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Company ID and Asset ID are required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getCompanyAsset((args as any).company_id, (args as any).asset_id)) }] };
          case MCP_TOOLS.ARCHIVE_COMPANY_ASSET:
            if (!args || typeof (args as any).company_id !== 'number' || typeof (args as any).asset_id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Company ID and Asset ID are required');
            }
            await this.huduClient.archiveCompanyAsset((args as any).company_id, (args as any).asset_id);
            return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Company asset archived' }) }] };
          case MCP_TOOLS.UNARCHIVE_COMPANY_ASSET:
            if (!args || typeof (args as any).company_id !== 'number' || typeof (args as any).asset_id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Company ID and Asset ID are required');
            }
            await this.huduClient.unarchiveCompanyAsset((args as any).company_id, (args as any).asset_id);
            return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Company asset unarchived' }) }] };
          case MCP_TOOLS.MOVE_COMPANY_ASSET_LAYOUT:
            if (!args || typeof (args as any).company_id !== 'number' || typeof (args as any).asset_id !== 'number' || typeof (args as any).new_layout_id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Company ID, Asset ID, and new layout ID are required');
            }
            await this.huduClient.moveCompanyAssetLayout((args as any).company_id, (args as any).asset_id, (args as any).new_layout_id);
            return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Company asset moved to new layout' }) }] };

          // Company Jump handler
          case MCP_TOOLS.COMPANY_JUMP:
            if (!args || typeof (args as any).company_id !== 'number') {
              throw new McpError(ErrorCode.InvalidRequest, 'Company ID is required');
            }
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.companyJump((args as any).company_id)) }] };

          // API Info handler
          case MCP_TOOLS.GET_API_INFO:
            return { content: [{ type: 'text', text: JSON.stringify(await this.huduClient.getApiInfo()) }] };
            
          case MCP_TOOLS.SEARCH_ALL:
            return await this.handleSearch(args as any);
            
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error}`);
      }
    });
  }

  private async readArticleResource(uri: string) {
    if (uri.endsWith('/list')) {
      const articles = await this.huduClient.getArticles();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(articles, null, 2),
        }],
      };
    }

    const id = this.extractIdFromUri(uri);
    if (id) {
      const article = await this.huduClient.getArticle(id);
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(article, null, 2),
        }],
      };
    }

    throw new McpError(ErrorCode.InvalidRequest, `Invalid article URI: ${uri}`);
  }

  private async readAssetResource(uri: string) {
    if (uri.endsWith('/list')) {
      const assets = await this.huduClient.getAssets();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(assets, null, 2),
        }],
      };
    }

    const id = this.extractIdFromUri(uri);
    if (id) {
      const asset = await this.huduClient.getAsset(id);
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(asset, null, 2),
        }],
      };
    }

    throw new McpError(ErrorCode.InvalidRequest, `Invalid asset URI: ${uri}`);
  }

  private async readPasswordResource(uri: string) {
    if (uri.endsWith('/list')) {
      const passwords = await this.huduClient.getAssetPasswords();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(passwords, null, 2),
        }],
      };
    }

    const id = this.extractIdFromUri(uri);
    if (id) {
      const password = await this.huduClient.getAssetPassword(id);
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(password, null, 2),
        }],
      };
    }

    throw new McpError(ErrorCode.InvalidRequest, `Invalid password URI: ${uri}`);
  }

  private async readCompanyResource(uri: string) {
    if (uri.endsWith('/list')) {
      const companies = await this.huduClient.getCompanies();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(companies, null, 2),
        }],
      };
    }

    const id = this.extractIdFromUri(uri);
    if (id) {
      const company = await this.huduClient.getCompany(id);
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(company, null, 2),
        }],
      };
    }

    throw new McpError(ErrorCode.InvalidRequest, `Invalid company URI: ${uri}`);
  }

  private async readAssetLayoutResource(uri: string) {
    if (uri.endsWith('/list')) {
      const layouts = await this.huduClient.getAssetLayouts();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(layouts, null, 2),
        }],
      };
    }

    const id = this.extractIdFromUri(uri);
    if (id) {
      const layout = await this.huduClient.getAssetLayout(id);
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(layout, null, 2),
        }],
      };
    }

    throw new McpError(ErrorCode.InvalidRequest, `Invalid asset layout URI: ${uri}`);
  }

  private async readActivityLogResource(uri: string) {
    if (uri.endsWith('/list')) {
      const logs = await this.huduClient.getActivityLogs();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(logs, null, 2),
        }],
      };
    }

    throw new McpError(ErrorCode.InvalidRequest, `Invalid activity log URI: ${uri}`);
  }

  private async readFolderResource(uri: string) {
    if (uri.endsWith('/list')) {
      const folders = await this.huduClient.getFolders();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(folders, null, 2),
        }],
      };
    }

    const id = this.extractIdFromUri(uri);
    if (id) {
      const folder = await this.huduClient.getFolder(id);
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(folder, null, 2),
        }],
      };
    }

    throw new McpError(ErrorCode.InvalidRequest, `Invalid folder URI: ${uri}`);
  }

  private async readUserResource(uri: string) {
    if (uri.endsWith('/list')) {
      const users = await this.huduClient.getUsers();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(users, null, 2),
        }],
      };
    }

    const id = this.extractIdFromUri(uri);
    if (id) {
      const user = await this.huduClient.getUser(id);
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(user, null, 2),
        }],
      };
    }

    throw new McpError(ErrorCode.InvalidRequest, `Invalid user URI: ${uri}`);
  }

  private async readProcedureResource(uri: string) {
    if (uri.endsWith('/list')) {
      const procedures = await this.huduClient.getProcedures();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(procedures, null, 2),
        }],
      };
    }

    const id = this.extractIdFromUri(uri);
    if (id) {
      const procedure = await this.huduClient.getProcedure(id);
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(procedure, null, 2),
        }],
      };
    }

    throw new McpError(ErrorCode.InvalidRequest, `Invalid procedure URI: ${uri}`);
  }

  private async readProcedureTaskResource(uri: string) {
    if (uri.endsWith('/list')) {
      const tasks = await this.huduClient.getProcedureTasks();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(tasks, null, 2),
        }],
      };
    }

    const id = this.extractIdFromUri(uri);
    if (id) {
      const task = await this.huduClient.getProcedureTask(id);
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(task, null, 2),
        }],
      };
    }

    throw new McpError(ErrorCode.InvalidRequest, `Invalid procedure task URI: ${uri}`);
  }

  private async readNetworkResource(uri: string) {
    if (uri.endsWith('/list')) {
      const networks = await this.huduClient.getNetworks();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(networks, null, 2),
        }],
      };
    }

    const id = this.extractIdFromUri(uri);
    if (id) {
      const network = await this.huduClient.getNetwork(id);
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(network, null, 2),
        }],
      };
    }

    throw new McpError(ErrorCode.InvalidRequest, `Invalid network URI: ${uri}`);
  }

  private async readPasswordFolderResource(uri: string) {
    if (uri.endsWith('/list')) {
      const folders = await this.huduClient.getPasswordFolders();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(folders, null, 2),
        }],
      };
    }

    const id = this.extractIdFromUri(uri);
    if (id) {
      const folder = await this.huduClient.getPasswordFolder(id);
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(folder, null, 2),
        }],
      };
    }

    throw new McpError(ErrorCode.InvalidRequest, `Invalid password folder URI: ${uri}`);
  }

  private async readUploadResource(uri: string) {
    if (uri.endsWith('/list')) {
      const uploads = await this.huduClient.getUploads();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(uploads, null, 2),
        }],
      };
    }

    const id = this.extractIdFromUri(uri);
    if (id) {
      const upload = await this.huduClient.getUpload(id);
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(upload, null, 2),
        }],
      };
    }

    throw new McpError(ErrorCode.InvalidRequest, `Invalid upload URI: ${uri}`);
  }

  private async readWebsiteResource(uri: string) {
    if (uri.endsWith('/list')) {
      const websites = await this.huduClient.getWebsites();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(websites, null, 2),
        }],
      };
    }

    const id = this.extractIdFromUri(uri);
    if (id) {
      const website = await this.huduClient.getWebsite(id);
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(website, null, 2),
        }],
      };
    }

    throw new McpError(ErrorCode.InvalidRequest, `Invalid website URI: ${uri}`);
  }

  private async readVlanResource(uri: string) {
    if (uri.endsWith('/list')) {
      const vlans = await this.huduClient.getVlans();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(vlans, null, 2),
        }],
      };
    }

    const id = this.extractIdFromUri(uri);
    if (id) {
      const vlan = await this.huduClient.getVlan(id);
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(vlan, null, 2),
        }],
      };
    }

    throw new McpError(ErrorCode.InvalidRequest, `Invalid VLAN URI: ${uri}`);
  }

  private async readVlanZoneResource(uri: string) {
    if (uri.endsWith('/list')) {
      const zones = await this.huduClient.getVlanZones();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(zones, null, 2),
        }],
      };
    }

    const id = this.extractIdFromUri(uri);
    if (id) {
      const zone = await this.huduClient.getVlanZone(id);
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(zone, null, 2),
        }],
      };
    }

    throw new McpError(ErrorCode.InvalidRequest, `Invalid VLAN zone URI: ${uri}`);
  }

  private async readIpAddressResource(uri: string) {
    if (uri.endsWith('/list')) {
      const ipAddresses = await this.huduClient.getIpAddresses();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(ipAddresses, null, 2),
        }],
      };
    }

    const id = this.extractIdFromUri(uri);
    if (id) {
      const ipAddress = await this.huduClient.getIpAddress(id);
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(ipAddress, null, 2),
        }],
      };
    }

    throw new McpError(ErrorCode.InvalidRequest, `Invalid IP address URI: ${uri}`);
  }

  private async readRelationResource(uri: string) {
    if (uri.endsWith('/list')) {
      const relations = await this.huduClient.getRelations();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(relations, null, 2),
        }],
      };
    }

    const id = this.extractIdFromUri(uri);
    if (id) {
      const relation = await this.huduClient.getRelation(id);
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(relation, null, 2),
        }],
      };
    }

    throw new McpError(ErrorCode.InvalidRequest, `Invalid relation URI: ${uri}`);
  }

  private async readListResource(uri: string) {
    if (uri.endsWith('/list')) {
      const lists = await this.huduClient.getLists();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(lists, null, 2),
        }],
      };
    }

    const id = this.extractIdFromUri(uri);
    if (id) {
      const list = await this.huduClient.getList(id);
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(list, null, 2),
        }],
      };
    }

    throw new McpError(ErrorCode.InvalidRequest, `Invalid list URI: ${uri}`);
  }

  private async readGroupResource(uri: string) {
    if (uri.endsWith('/list')) {
      const groups = await this.huduClient.getGroups();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(groups, null, 2),
        }],
      };
    }

    const id = this.extractIdFromUri(uri);
    if (id) {
      const group = await this.huduClient.getGroup(id);
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(group, null, 2),
        }],
      };
    }

    throw new McpError(ErrorCode.InvalidRequest, `Invalid group URI: ${uri}`);
  }

  private async readMagicDashResource(uri: string) {
    if (uri.endsWith('/list')) {
      const magicDashes = await this.huduClient.getMagicDashes();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(magicDashes, null, 2),
        }],
      };
    }

    const id = this.extractIdFromUri(uri);
    if (id) {
      const magicDash = await this.huduClient.getMagicDash(id);
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(magicDash, null, 2),
        }],
      };
    }

    throw new McpError(ErrorCode.InvalidRequest, `Invalid magic dash URI: ${uri}`);
  }

  private async readMatcherResource(uri: string) {
    if (uri.endsWith('/list')) {
      const matchers = await this.huduClient.getMatchers();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(matchers, null, 2),
        }],
      };
    }

    const id = this.extractIdFromUri(uri);
    if (id) {
      const matcher = await this.huduClient.getMatcher(id);
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(matcher, null, 2),
        }],
      };
    }

    throw new McpError(ErrorCode.InvalidRequest, `Invalid matcher URI: ${uri}`);
  }

  private async readExpirationResource(uri: string) {
    if (uri.endsWith('/list')) {
      const expirations = await this.huduClient.getExpirations();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(expirations, null, 2),
        }],
      };
    }

    throw new McpError(ErrorCode.InvalidRequest, `Invalid expiration URI: ${uri}`);
  }

  private async readExportResource(uri: string) {
    if (uri.endsWith('/list')) {
      const exports = await this.huduClient.getExports();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(exports, null, 2),
        }],
      };
    }

    throw new McpError(ErrorCode.InvalidRequest, `Invalid export URI: ${uri}`);
  }

  private async readRackStorageResource(uri: string) {
    if (uri.endsWith('/list')) {
      const rackStorages = await this.huduClient.getRackStorages();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(rackStorages, null, 2),
        }],
      };
    }

    const id = this.extractIdFromUri(uri);
    if (id) {
      const rackStorage = await this.huduClient.getRackStorage(id);
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(rackStorage, null, 2),
        }],
      };
    }

    throw new McpError(ErrorCode.InvalidRequest, `Invalid rack storage URI: ${uri}`);
  }

  private async readRackStorageItemResource(uri: string) {
    if (uri.endsWith('/list')) {
      const rackStorageItems = await this.huduClient.getRackStorageItems();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(rackStorageItems, null, 2),
        }],
      };
    }

    const id = this.extractIdFromUri(uri);
    if (id) {
      const rackStorageItem = await this.huduClient.getRackStorageItem(id);
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(rackStorageItem, null, 2),
        }],
      };
    }

    throw new McpError(ErrorCode.InvalidRequest, `Invalid rack storage item URI: ${uri}`);
  }

  private async readPublicPhotoResource(uri: string) {
    if (uri.endsWith('/list')) {
      const publicPhotos = await this.huduClient.getPublicPhotos();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(publicPhotos, null, 2),
        }],
      };
    }

    const id = this.extractIdFromUri(uri);
    if (id) {
      const publicPhoto = await this.huduClient.getPublicPhoto(id);
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(publicPhoto, null, 2),
        }],
      };
    }

    throw new McpError(ErrorCode.InvalidRequest, `Invalid public photo URI: ${uri}`);
  }

  private async readCardResource(uri: string): Promise<{ contents: { uri: string; mimeType: string; text: string; }[]; }> {
    if (uri.endsWith('/list')) {
      // Cards don't have a direct list endpoint, so we return an error or empty result
      throw new McpError(ErrorCode.InvalidRequest, `Card list not available - use card lookup tool instead`);
    }

    throw new McpError(ErrorCode.InvalidRequest, `Invalid card URI: ${uri}`);
  }

  private async handleSearch(args: any) {
    const { query, type, company_id } = args;
    let results: any = {};

    if (!type || type === 'articles') {
      results.articles = await this.huduClient.getArticles({ search: query, company_id });
    }
    if (!type || type === 'assets') {
      results.assets = await this.huduClient.getAssets({ search: query, company_id });
    }
    if (!type || type === 'passwords') {
      results.passwords = await this.huduClient.getAssetPasswords({ search: query, company_id });
    }
    if (!type || type === 'companies') {
      results.companies = await this.huduClient.getCompanies({ search: query });
    }

    return { content: [{ type: 'text', text: JSON.stringify(results) }] };
  }

  private extractIdFromUri(uri: string): number | null {
    const match = uri.match(/\/(\d+)$/);
    return match && match[1] ? parseInt(match[1], 10) : null;
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Hudu MCP server running on stdio');
  }
}