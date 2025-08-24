# Open SWE Setup Guide

## ✅ Completed Steps
1. ✅ Node.js v22.18.0 installed
2. ✅ Yarn 3.5.1 configured for this project
3. ✅ All dependencies installed
4. ✅ Basic .env files created

## 📝 Next Steps to Complete Setup

### 1. Configure Environment Variables

#### For Web App (apps/web/.env)
Add these variables to `apps\web\.env`:

```env
# API URLs for development
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
LANGGRAPH_API_URL="http://localhost:2024"

# Generate this key using PowerShell:
# [System.Convert]::ToHexString((1..32 | ForEach {Get-Random -Maximum 256}))
SECRETS_ENCRYPTION_KEY="YOUR_32_BYTE_HEX_KEY_HERE"

# GitHub App OAuth settings (fill after creating GitHub App)
NEXT_PUBLIC_GITHUB_APP_CLIENT_ID=""
GITHUB_APP_CLIENT_SECRET=""
GITHUB_APP_REDIRECT_URI="http://localhost:3000/api/auth/github/callback"

# GitHub App details (fill after creating GitHub App)
GITHUB_APP_NAME="open-swe-dev"
GITHUB_APP_ID=""
GITHUB_APP_PRIVATE_KEY=""

# GitHub Webhook Secret (generate same way as SECRETS_ENCRYPTION_KEY)
GITHUB_WEBHOOK_SECRET=""
```

#### For Agent (apps/open-swe/.env)
Add these variables to `apps\open-swe\.env`:

```env
# LangSmith tracing & LangGraph platform
LANGCHAIN_PROJECT="default"
LANGCHAIN_API_KEY="lsv2_pt_..."  # Get from https://smith.langchain.com
LANGCHAIN_TRACING_V2="true"
LANGCHAIN_TEST_TRACKING="false"

# LLM Provider Keys (at least one required)
ANTHROPIC_API_KEY=""  # Get from https://console.anthropic.com
OPENAI_API_KEY=""     # Get from https://platform.openai.com
GOOGLE_API_KEY=""     # Get from https://makersuite.google.com

# Infrastructure
DAYTONA_API_KEY=""    # Get from https://daytona.io

# Tools
FIRECRAWL_API_KEY=""  # Get from https://firecrawl.dev

# GitHub App settings (same as web app)
GITHUB_APP_NAME="open-swe-dev"
GITHUB_APP_ID=""
GITHUB_APP_PRIVATE_KEY=""
GITHUB_WEBHOOK_SECRET=""  # Same as web app

# Server configuration
PORT="2024"
OPEN_SWE_APP_URL="http://localhost:3000"
SECRETS_ENCRYPTION_KEY=""  # Must match web app value

# CI/CD
SKIP_CI_UNTIL_LAST_COMMIT="true"
```

### 2. Get Required API Keys

#### Essential APIs (Required):
1. **LangSmith API Key**: 
   - Go to https://smith.langchain.com
   - Sign up/login and get your API key

2. **LLM Provider** (at least one):
   - **Anthropic (Recommended)**: https://console.anthropic.com
   - **OpenAI**: https://platform.openai.com/api-keys
   - **Google**: https://makersuite.google.com

3. **Daytona API Key**:
   - Go to https://daytona.io
   - Sign up and get your API key
   - This is required for cloud sandboxes

#### Optional APIs:
- **Firecrawl**: https://firecrawl.dev (for URL content extraction)

### 3. Create GitHub App (Optional but Recommended)

If you want to use GitHub integration:

1. Go to https://github.com/settings/apps/new
2. Configure with:
   - Name: `open-swe-dev`
   - Homepage URL: `http://localhost:3000`
   - Callback URL: `http://localhost:3000/api/auth/github/callback`
   - Webhook URL: Use ngrok for local development
   - Permissions: Contents (R/W), Issues (R/W), Pull Requests (R/W)

### 4. Run the Development Servers

You need to run TWO servers in parallel:

#### Terminal 1 - LangGraph Agent Server:
```bash
cd apps/open-swe
node ../../yarn.js dev
```
This runs at: http://localhost:2024

#### Terminal 2 - Web Application:
```bash
cd apps/web
node ../../yarn.js dev
```
This runs at: http://localhost:3000

### 5. Access the Application

Once both servers are running:
1. Open your browser
2. Navigate to: http://localhost:3000
3. You should see the Open SWE web interface

## 🎯 Quick Start (Minimal Setup)

If you want to quickly test the system with minimal setup:

1. Get these essential API keys:
   - LangSmith API key
   - Anthropic API key (or OpenAI)
   - Daytona API key

2. Add them to both .env files

3. Generate a secrets encryption key and add to both files

4. Run both servers

## 📚 Usage Options

Once running, you can use Open SWE in multiple ways:

1. **Web UI**: http://localhost:3000
   - Create and manage tasks
   - Monitor progress
   - Review and approve plans

2. **GitHub Integration** (if configured):
   - Add `open-swe` label to GitHub issues
   - Use `open-swe-auto` for automatic plan acceptance
   - Use `open-swe-max` for Claude Opus on complex tasks

## 🔧 Troubleshooting

- **Port conflicts**: Change PORT in .env files if 3000 or 2024 are in use
- **API errors**: Verify all required API keys are set correctly
- **Build errors**: Try `node yarn.js clean` then `node yarn.js install`

## 📖 Documentation

For more details, see: https://docs.langchain.com/labs/swe/
