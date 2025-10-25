# Hudu MCP Server - Deployment Guide
## Traefik + Azure AD OAuth Authentication

**Complete deployment guide for production-ready MCP server with enterprise authentication**

---

## 📋 Prerequisites Checklist

### ✅ Required Information
- [ ] Azure AD Tenant ID: `7b80db37-11b2-4046-b65a-d1a4cf738372`
- [ ] Azure AD Global Admin access
- [ ] Cloudflare account with DNS access for `247mgmt.com`
- [ ] Server with static IP: `172.16.0.16`
- [ ] Docker and Docker Compose installed
- [ ] Internal DNS configured: `corp.wheelhouseit.com`

### ✅ Required Credentials
- [ ] Hudu API key
- [ ] Cloudflare API token (for Let's Encrypt DNS challenge)
- [ ] Azure AD Client ID (from App Registration)
- [ ] Azure AD Client Secret (from App Registration)

---

## 🚀 Quick Start (15 Minutes)

### Step 1: Complete Azure AD Setup (5 min)

Follow [AZURE_AD_SETUP.md](AZURE_AD_SETUP.md) to:
1. Create App Registration
2. Generate Client Secret
3. Configure API permissions
4. Grant admin consent

**Save these values:**
- Client ID: `________________`
- Client Secret: `________________`

---

### Step 2: Configure Environment (3 min)

1. Copy the environment template:
```bash
cp .env.traefik.example .env.traefik
```

2. Edit `.env.traefik` and fill in your values:
```env
# Hudu Configuration
HUDU_BASE_URL=https://hudu.247mgmt.com
HUDU_API_KEY=your-hudu-api-key

# Azure AD
AZURE_TENANT_ID=7b80db37-11b2-4046-b65a-d1a4cf738372
AZURE_CLIENT_ID=your-azure-client-id-here
AZURE_CLIENT_SECRET=your-azure-client-secret-here
AZURE_TENANT_DOMAIN=wheelhouseit.onmicrosoft.com
OAUTH2_EMAIL_DOMAINS=wheelhouseit.com,247mgmt.com

# Cloudflare (for Let's Encrypt)
LETSENCRYPT_EMAIL=admin@247mgmt.com
CF_DNS_API_TOKEN=your-cloudflare-api-token

# Server
MCP_HOSTNAME=mcp.hudu.247mgmt.com
MCP_SERVER_IP=172.16.0.16
```

3. Generate OAuth2-Proxy cookie secret:
```bash
openssl rand -hex 16
```

Add to `.env.traefik`:
```env
OAUTH2_COOKIE_SECRET=<generated-value>
```

---

### Step 3: Configure DNS (5 min)

#### Public DNS (Cloudflare):
Add A record for Let's Encrypt validation:
- **Type:** A
- **Name:** `mcp.hudu`
- **Content:** Your public IP (that NATs to 172.16.0.16)
- **TTL:** Auto
- **Proxy:** Disabled (orange cloud OFF)

#### Internal DNS (corp.wheelhouseit.com):
Add A record for internal resolution:
- **Type:** A
- **Name:** `mcp.hudu.247mgmt.com`
- **Content:** `172.16.0.16`

**Verify DNS:**
```bash
# From internal network
nslookup mcp.hudu.247mgmt.com
# Should return: 172.16.0.16

# From internet (for Let's Encrypt)
nslookup mcp.hudu.247mgmt.com 8.8.8.8
# Should return: Your public IP
```

---

### Step 4: Deploy Stack (2 min)

```bash
# Build and start all services
docker-compose -f docker-compose.traefik.yml up -d --build

# Check status
docker-compose -f docker-compose.traefik.yml ps

# View logs
docker-compose -f docker-compose.traefik.yml logs -f
```

**Expected output:**
```
✅ hudu-mcp-traefik       ... Up (healthy)
✅ hudu-mcp-oauth2-proxy  ... Up (healthy)
✅ hudu-mcp-server        ... Up (healthy)
✅ hudu-mcp-token-portal  ... Up (healthy)
```

---

## 🧪 Testing & Verification

### Test 1: SSL Certificate

```bash
# Check certificate
curl -I https://mcp.hudu.247mgmt.com

# Expected:
# HTTP/2 200
# server: traefik
```

**From browser:** Visit `https://mcp.hudu.247mgmt.com`
- Should show green padlock (valid Let's Encrypt cert)
- Should redirect to Azure AD login

---

### Test 2: OAuth Flow

1. **Visit:** `https://mcp.hudu.247mgmt.com`
2. **Expected:**
   - Redirects to `login.microsoftonline.com`
   - Shows Microsoft login page
3. **Login** with your Azure AD credentials
4. **Expected:**
   - Redirects back to `mcp.hudu.247mgmt.com`
   - Shows authenticated page or MCP server info

**✅ Success:** OAuth authentication working!

---

### Test 3: Token Portal

1. **Visit:** `https://mcp.hudu.247mgmt.com/token`
2. **Login** with Azure AD (if not already authenticated)
3. **Expected:**
   - See your name and email
   - See your access token displayed
   - Can copy token to clipboard

**✅ Success:** Token portal working!

---

### Test 4: Health Endpoints

```bash
# Traefik health
curl http://172.16.0.16:8080/ping
# Expected: OK

# MCP Server health
curl -H "Authorization: Bearer $(your-token)" https://mcp.hudu.247mgmt.com/health
# Expected: {"status":"healthy",...}

# OAuth2-Proxy health
docker exec hudu-mcp-oauth2-proxy wget -O- http://localhost:4180/ping
# Expected: OK
```

---

## 👥 User Onboarding

### For Each New User:

1. **Admin:** Add user to Azure AD (if not already present)

2. **Send user this link:** `https://mcp.hudu.247mgmt.com/token`

3. **User follows:** [USER_ONBOARDING.md](USER_ONBOARDING.md)
   - Login with Azure AD
   - Copy token from portal
   - Configure Claude Desktop
   - Test MCP tools

**Estimated time:** 5 minutes per user

---

## 📊 Monitoring & Logs

### View Logs:

```bash
# All services
docker-compose -f docker-compose.traefik.yml logs -f

# Specific service
docker-compose -f docker-compose.traefik.yml logs -f hudu-mcp-server
docker-compose -f docker-compose.traefik.yml logs -f oauth2-proxy
docker-compose -f docker-compose.traefik.yml logs -f traefik
```

### Log Files:

- **MCP Server:** `./logs/combined-YYYY-MM-DD.log`
- **MCP Errors:** `./logs/error-YYYY-MM-DD.log`
- **MCP API:** `./logs/api-YYYY-MM-DD.log`
- **Traefik:** `./logs/traefik/access.log`

### What to Monitor:

**MCP Server logs show user activity:**
```json
{
  "level": "info",
  "message": "Tool execution started",
  "toolName": "companies.query",
  "user": "alice@wheelhouseit.com",
  "userGroups": ["IT-Admins"],
  "timestamp": "2025-10-24T10:30:00.000Z"
}
```

**OAuth2-Proxy logs show authentication:**
```
[2025/10/24 10:30:00] [AuthSuccess] Authenticated user: alice@wheelhouseit.com
```

---

## 🔧 Maintenance

### Certificate Renewal

Let's Encrypt certificates auto-renew via Traefik.

**Check certificate expiry:**
```bash
echo | openssl s_client -servername mcp.hudu.247mgmt.com -connect mcp.hudu.247mgmt.com:443 2>/dev/null | openssl x509 -noout -dates
```

**Force renewal (if needed):**
```bash
docker-compose -f docker-compose.traefik.yml restart traefik
```

Certificates stored in: `./traefik/letsencrypt/acme.json`

---

### Updating MCP Server

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.traefik.yml up -d --build hudu-mcp-server

# Check logs
docker-compose -f docker-compose.traefik.yml logs -f hudu-mcp-server
```

---

### Rotating Azure AD Client Secret

When secret expires (every 24 months):

1. **Azure Portal:** Create new secret in App Registration
2. **Update .env.traefik:**
   ```env
   AZURE_CLIENT_SECRET=new-secret-here
   ```
3. **Restart OAuth2-Proxy:**
   ```bash
   docker-compose -f docker-compose.traefik.yml restart oauth2-proxy
   ```

---

## 🔒 Security Checklist

### Before Production:

- [ ] Azure AD App Registration completed
- [ ] API permissions granted with admin consent
- [ ] Client secret stored securely (not in git)
- [ ] `.env.traefik` added to `.gitignore`
- [ ] Let's Encrypt certificate validated (green padlock)
- [ ] OAuth flow tested with real user
- [ ] Token portal accessible and working
- [ ] Firewall configured (ports 80, 443 only)
- [ ] Internal DNS resolves correctly
- [ ] Rate limiting tested (1000 req/15min)
- [ ] Logs show user email in audit trail
- [ ] All health checks passing
- [ ] Backup `.env.traefik` securely

### Ongoing:

- [ ] Monitor logs weekly for suspicious activity
- [ ] Review Azure AD sign-in logs monthly
- [ ] Update dependencies monthly (`npm update`, rebuild)
- [ ] Rotate client secret every 12 months
- [ ] Review user access quarterly
- [ ] Test disaster recovery annually

---

## 🚨 Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues and solutions.

**Quick fixes:**

**Problem:** Can't access `https://mcp.hudu.247mgmt.com`
```bash
# Check DNS
nslookup mcp.hudu.247mgmt.com

# Check containers running
docker-compose -f docker-compose.traefik.yml ps

# Check Traefik logs
docker-compose -f docker-compose.traefik.yml logs traefik
```

**Problem:** OAuth login fails
```bash
# Check OAuth2-Proxy logs
docker-compose -f docker-compose.traefik.yml logs oauth2-proxy

# Verify Azure AD config
# - Check redirect URI matches: https://mcp.hudu.247mgmt.com/oauth2/callback
# - Verify client ID and secret in .env.traefik
```

**Problem:** Let's Encrypt certificate fails
```bash
# Check Cloudflare API token has DNS edit permissions
# Check DNS propagation: dig mcp.hudu.247mgmt.com @8.8.8.8
# Check Traefik ACME logs
docker-compose -f docker-compose.traefik.yml logs traefik | grep acme
```

---

## 📚 Additional Resources

- [AZURE_AD_SETUP.md](AZURE_AD_SETUP.md) - Azure AD App Registration
- [USER_ONBOARDING.md](USER_ONBOARDING.md) - User setup instructions
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues
- [SECURITY_IMPROVEMENTS.md](SECURITY_IMPROVEMENTS.md) - Security audit results

---

## 🎯 Success Metrics

**Deployment is successful when:**

✅ All 4 containers healthy
✅ SSL certificate valid (Let's Encrypt)
✅ Azure AD login works
✅ Token portal displays tokens
✅ Users can configure Claude Desktop
✅ MCP tools work from Claude Desktop
✅ Logs show user email for audit trail
✅ Rate limiting prevents abuse
✅ Health endpoints return 200 OK

**Ready for production!** 🚀

---

## 💡 Tips

**Performance:**
- Each MCP request logs user email - check `logs/combined-*.log`
- Rate limit: 1000 requests per 15 min per IP
- OAuth tokens valid for 7 days, auto-refresh on use

**Security:**
- Never commit `.env.traefik` to git
- Rotate Azure AD secret every 12 months
- Review Azure AD sign-in logs regularly
- Use Azure AD groups for access control (optional)

**User Experience:**
- Provide users with direct link to token portal
- Include screenshots in user documentation
- Test token copy/paste works in Claude Desktop config
- Users only need to configure once (token valid 7 days)

---

**Questions or Issues?**
- Check `docker-compose -f docker-compose.traefik.yml logs`
- Review Azure AD sign-in logs: `portal.azure.com` → Azure AD → Sign-in logs
- See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
