# Docker Deployment Guide

This document provides detailed instructions for deploying the Hudu MCP Server using Docker.

## Prerequisites

- Docker Engine 20.10+ 
- Docker Compose 2.0+
- Git (for cloning the repository)

## Quick Start

1. **Clone and configure:**
   ```bash
   git clone <your-repo-url>
   cd hudu-mcp-server
   cp docker.env.example .env
   ```

2. **Edit `.env` with your Hudu credentials:**
   ```env
   HUDU_BASE_URL=https://your-hudu-instance.com
   HUDU_API_KEY=your-api-key-here
   ```

3. **Start the server:**
   ```bash
   docker-compose up -d
   ```

## Docker Compose Configuration

The `docker-compose.yml` includes:

- **Auto-restart**: Container restarts unless manually stopped
- **Health checks**: Monitors container health
- **Resource limits**: CPU and memory constraints
- **Log rotation**: Prevents log files from growing too large
- **Environment variables**: Secure configuration management

### Available Services

- `hudu-mcp-server`: The main MCP server container
- `nginx` (optional): Reverse proxy for HTTP transport

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `HUDU_BASE_URL` | Your Hudu instance URL | - | ✅ |
| `HUDU_API_KEY` | Hudu API authentication key | - | ✅ |
| `HUDU_TIMEOUT` | API request timeout (ms) | 30000 | ❌ |
| `NODE_ENV` | Node.js environment | production | ❌ |
| `LOG_LEVEL` | Logging verbosity | info | ❌ |
| `MCP_SERVER_PORT` | HTTP port (if using HTTP transport) | 3000 | ❌ |

## Docker Commands

### Using Docker Compose (Recommended)

```bash
# Start services in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and start
docker-compose up --build -d

# Scale the service (if needed)
docker-compose up -d --scale hudu-mcp-server=2
```

### Using Docker directly

```bash
# Build the image
docker build -t hudu-mcp-server .

# Run with environment file
docker run -d --name hudu-mcp-server --env-file .env hudu-mcp-server

# Run with inline environment variables
docker run -d --name hudu-mcp-server \
  -e HUDU_BASE_URL=https://your-hudu.com \
  -e HUDU_API_KEY=your-key \
  hudu-mcp-server

# View logs
docker logs -f hudu-mcp-server

# Stop and remove container
docker stop hudu-mcp-server && docker rm hudu-mcp-server
```

## Production Deployment

### Security Considerations

1. **Environment Variables**: Use Docker secrets or encrypted environment files
2. **Network Security**: Run on private networks, use TLS
3. **Resource Limits**: Set appropriate CPU/memory limits
4. **User Permissions**: Container runs as non-root user
5. **Image Updates**: Regularly update base images for security patches

### Recommended Production Setup

```yaml
version: '3.8'
services:
  hudu-mcp-server:
    build: .
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=warn
    env_file:
      - .env.production
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 256M
      replicas: 2
    healthcheck:
      test: ["CMD", "node", "-e", "console.log('OK')"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Monitoring and Logging

### Health Checks

The container includes built-in health checks:
```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' hudu-mcp-server

# View health check logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' hudu-mcp-server
```

### Log Management

```bash
# View real-time logs
docker-compose logs -f hudu-mcp-server

# View logs with timestamps
docker-compose logs -f -t hudu-mcp-server

# Export logs to file
docker-compose logs hudu-mcp-server > hudu-mcp-server.log
```

### Container Stats

```bash
# View resource usage
docker stats hudu-mcp-server

# Get container information
docker inspect hudu-mcp-server
```

## Troubleshooting

### Common Issues

1. **Container won't start**
   ```bash
   # Check logs for errors
   docker-compose logs hudu-mcp-server
   
   # Verify environment variables
   docker-compose config
   ```

2. **Can't connect to Hudu API**
   ```bash
   # Test API connectivity from container
   docker exec -it hudu-mcp-server wget -qO- $HUDU_BASE_URL/api/v1/api_info
   ```

3. **High memory usage**
   ```bash
   # Monitor memory usage
   docker stats --no-stream hudu-mcp-server
   
   # Adjust memory limits in docker-compose.yml
   ```

### Debug Mode

Run container in debug mode:
```bash
docker-compose -f docker-compose.yml -f docker-compose.debug.yml up
```

Create `docker-compose.debug.yml`:
```yaml
version: '3.8'
services:
  hudu-mcp-server:
    environment:
      - LOG_LEVEL=debug
      - NODE_ENV=development
```

## Scaling and Load Balancing

For high-availability deployments:

```yaml
version: '3.8'
services:
  hudu-mcp-server:
    # ... existing configuration
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
        
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - hudu-mcp-server
```

## Backup and Recovery

### Configuration Backup
```bash
# Backup environment files
tar -czf hudu-mcp-backup-$(date +%Y%m%d).tar.gz .env docker-compose.yml

# Backup Docker volumes (if any)
docker run --rm -v hudu-mcp-data:/data -v $(pwd):/backup ubuntu tar czf /backup/volumes-backup.tar.gz /data
```

### Container Recovery
```bash
# Pull latest image
docker-compose pull

# Recreate containers
docker-compose up -d --force-recreate
```