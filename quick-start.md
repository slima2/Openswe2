# 🚀 Quick Start Guide for Open SWE

## Minimum Configuration Required

### 1. Edit `apps\web\.env`:
```env
# API URLs for development
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
LANGGRAPH_API_URL="http://localhost:2024"

# Your generated encryption key
SECRETS_ENCRYPTION_KEY="8B6D8A9548531924EC59BA36DF9EA9FE8465C8E23E3C581A2E30CC05014B14A3"

# Leave GitHub App settings empty for now (optional)
NEXT_PUBLIC_GITHUB_APP_CLIENT_ID=""
GITHUB_APP_CLIENT_SECRET=""
GITHUB_APP_REDIRECT_URI=""
GITHUB_APP_NAME=""
GITHUB_APP_ID=""
GITHUB_APP_PRIVATE_KEY=""
GITHUB_WEBHOOK_SECRET=""
```

### 2. Edit `apps\open-swe\.env`:
```env
# LangSmith (Required - Get from https://smith.langchain.com)
LANGCHAIN_PROJECT="default"
LANGCHAIN_API_KEY="YOUR_LANGSMITH_API_KEY_HERE"
LANGCHAIN_TRACING_V2="true"

# LLM Provider (At least one required)
ANTHROPIC_API_KEY="YOUR_ANTHROPIC_KEY_HERE"  # Recommended
# OR
OPENAI_API_KEY="YOUR_OPENAI_KEY_HERE"

# Infrastructure (Required - Get from https://daytona.io)
DAYTONA_API_KEY="YOUR_DAYTONA_KEY_HERE"

# Server configuration
PORT="2024"
OPEN_SWE_APP_URL="http://localhost:3000"
SECRETS_ENCRYPTION_KEY="8B6D8A9548531924EC59BA36DF9EA9FE8465C8E23E3C581A2E30CC05014B14A3"

# Optional
FIRECRAWL_API_KEY=""
GITHUB_APP_NAME=""
GITHUB_APP_ID=""
GITHUB_APP_PRIVATE_KEY=""
GITHUB_WEBHOOK_SECRET=""
SKIP_CI_UNTIL_LAST_COMMIT="true"
```

## Required API Keys

You MUST obtain these API keys before running:

1. **LangSmith API Key** (Required)
   - Go to: https://smith.langchain.com
   - Sign up/Login
   - Go to Settings → API Keys
   - Create a new API key

2. **LLM Provider Key** (At least one required)
   - **Anthropic (Recommended)**: https://console.anthropic.com/api-keys
   - **OpenAI**: https://platform.openai.com/api-keys
   - **Google**: https://makersuite.google.com/app/apikey

3. **Daytona API Key** (Required for sandboxes)
   - Go to: https://daytona.io
   - Sign up for an account
   - Get your API key from the dashboard

## Running the Servers

Once you have configured the environment variables with your API keys:

### Terminal 1 - Start the Agent Server:
```powershell
cd apps\open-swe
node ..\..\yarn.js dev
```
This will run at: http://localhost:2024

### Terminal 2 - Start the Web UI:
```powershell
cd apps\web
node ..\..\yarn.js dev
```
This will run at: http://localhost:3000

## Testing the System

1. Open your browser and go to: http://localhost:3000
2. You should see the Open SWE interface
3. Try creating a simple task to test the system

## Troubleshooting

- **"Missing API Key" errors**: Make sure all required keys are set in both .env files
- **Port already in use**: Change the PORT values in the .env files
- **Build errors**: Run `node yarn.js clean` then `node yarn.js build` again

## Next Steps

- Set up GitHub App for full GitHub integration
- Configure additional LLM providers for flexibility
- Read the full documentation at: https://docs.langchain.com/labs/swe/
