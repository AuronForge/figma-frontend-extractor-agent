# Figma Frontend Extractor Agent

🎨 AI-powered agent that extracts Figma designs and converts them into frontend code skeletons. Analyzes design components, layout structures, and styles to generate React/Vue/HTML boilerplate with proper component hierarchy and styling foundation.

## Overview

This agent specializes in bridging the gap between design and development. It connects to the Figma API, extracts design information (components, layouts, styles, typography), and uses AI to generate clean, structured frontend code skeletons ready for implementation.

## Features

- ✅ **Figma API Integration** - Direct connection to Figma files and components
- ✅ **Smart Component Extraction** - Identifies buttons, forms, cards, layouts automatically
- ✅ **Multi-framework Support** - Generate React, Vue, or vanilla HTML/CSS
- ✅ **AI-powered Analysis** - Uses GPT-4o/Claude to understand design intent
- ✅ **Component Hierarchy** - Maintains proper parent-child relationships
- ✅ **Style Extraction** - Colors, typography, spacing, and layout properties
- ✅ **Responsive Design** - Detects and generates responsive breakpoints
- ✅ **Multiple AI Providers** - OpenAI, GitHub Models (Free!), Anthropic
- ✅ **RESTful API** - HTTP endpoints with Swagger documentation
- ✅ **Auto-save** - Store extracted designs and generated code

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file:

```env
# Figma Configuration
FIGMA_ACCESS_TOKEN=your_figma_personal_access_token

# OpenAI Configuration
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o

# GitHub Models Configuration (Free! Recommended)
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_MODEL=gpt-4o

# Anthropic Configuration
ANTHROPIC_API_KEY=your_anthropic_key
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Environment
NODE_ENV=development
PORT=3003
```

### Figma Access Token Setup

1. Go to your Figma account settings:
   - Navigate to https://www.figma.com/settings
   - Scroll to "Personal access tokens"
   - Click "Generate new token"
   - Give it a name (e.g., "Frontend Extractor Agent")
   - Copy the token

2. Add to `.env`:

   ```env
   FIGMA_ACCESS_TOKEN=figd_your_token_here
   ```

3. Get Figma File Key:
   - Open your Figma file
   - Copy the URL: `https://www.figma.com/file/FILE_KEY/File-Name`
   - The FILE_KEY is what you need

### GitHub Models Setup (Recommended)

1. Generate a GitHub Personal Access Token:
   - Go to https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select scope: `read:packages`
   - Copy the generated token

2. Add to `.env`:

   ```env
   GITHUB_TOKEN=ghp_your_token_here
   GITHUB_MODEL=gpt-4o
   ```

3. **Benefits**: Free access to GPT-4o with generous rate limits!

## Usage

### Local Development

```bash
npm start
```

The server will start at `http://localhost:3003` using Vercel Dev

### API Documentation

📚 **Interactive Swagger Documentation:**

- **Local**: http://localhost:3003/api/v1/api-docs
- **Production**: https://figma-frontend-extractor-agent.vercel.app/api/v1/api-docs
- **OpenAPI Spec**: http://localhost:3003/api/v1/swagger

The API follows RESTful conventions and is fully documented with OpenAPI 3.0 specification. Use the Swagger UI to explore all endpoints, request/response schemas, and try out the API directly from your browser.

### API Versioning

All endpoints are versioned under `/api/v1/`. Legacy endpoints without version prefix are automatically redirected to the v1 endpoints for backward compatibility.

**Available Endpoints:**

- `GET /api/v1/health` - Health check and service status
- `GET /api/v1/validate-token` - Validate Figma access token
- `GET /api/v1/list-files` - List Figma files from team or project
- `POST /api/v1/extract-design` - Extract Figma design components
- `POST /api/v1/extract-project` - Extract entire project and generate JSON files
- `POST /api/v1/generate-code` - Generate frontend code from Figma
- `GET /api/v1/generated-code` - Retrieve generated code entries
- `GET /api/v1/swagger` - OpenAPI specification (JSON)
- `GET /api/v1/api-docs` - Swagger UI documentation

### API Endpoints

#### Health Check

```bash
curl http://localhost:3003/api/v1/health
```

**Response:**

```json
{
  "status": "ok",
  "service": "figma-frontend-extractor-agent",
  "version": "1.0.0",
  "apiVersion": "v1",
  "timestamp": "2026-01-19T22:38:03.173Z",
  "endpoints": {
    "validateToken": "/api/v1/validate-token",
    "listFiles": "/api/v1/list-files",
    "extractDesign": "/api/v1/extract-design",
    "extractProject": "/api/v1/extract-project",
    "generateCode": "/api/v1/generate-code",
    "generatedCode": "/api/v1/generated-code",
    "swagger": "/api/v1/swagger",
    "apiDocs": "/api/v1/api-docs"
  }
}
```

#### Validate Figma Token

Check if your Figma access token is valid:

```bash
curl http://localhost:3003/api/v1/validate-token
```

**Response:**

```json
{
  "success": true,
  "message": "Figma token is valid",
  "user": {
    "id": "1075405301613636173",
    "email": "user@example.com",
    "handle": "User Name"
  }
}
```

#### List Figma Files

List all files from a Figma team or project:

```bash
# List files from a team
curl "http://localhost:3003/api/v1/list-files?team_id=YOUR_TEAM_ID"

# List files from a specific project
curl "http://localhost:3003/api/v1/list-files?project_id=YOUR_PROJECT_ID"
```

**How to get IDs:**

- **Team ID**: Go to Figma → Select your team → URL will be `/team/TEAM_ID/`
- **Project ID**: Open a project → URL will be `/project/PROJECT_ID/`

**Response:**

```json
{
  "success": true,
  "source": "team",
  "id": "1234567890",
  "data": {
    "name": "My Team",
    "projects": [...]
  }
}
```

#### Extract Figma Design

Extract and analyze a specific Figma file or component:

```bash
curl -X POST http://localhost:3003/api/v1/extract-design \
  -H "Content-Type: application/json" \
  -H "x-ai-provider: github" \
  -d '{
    "fileKey": "your-figma-file-key",
    "nodeId": "123:456",
    "framework": "react",
    "options": {
      "includeStyles": true,
      "maxComponents": 5
    }
  }'
```

#### Extract Project and Generate JSON Files

Extract an entire Figma file and generate JSON specifications for development:

**Option 1: Extract specific file by fileKey**

```bash
curl -X POST http://localhost:3003/api/v1/extract-project \
  -H "Content-Type: application/json" \
  -d '{
    "fileKey": "UijlTILMmeErA1cakxBBLU",
    "figmaToken": "figd_your_figma_token",
    "githubToken": "ghp_your_github_token",
    "options": {
      "frameworks": ["react", "html"],
      "maxComponentsPerFile": 3,
      "includeStyles": true,
      "generateDocs": true
    }
  }'
```

**Option 2: Extract all files from a project**

```bash
curl -X POST http://localhost:3003/api/v1/extract-project \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "1550518470816288684",
    "projectId": "454737867",
    "figmaToken": "figd_your_figma_token",
    "githubToken": "ghp_your_github_token",
    "options": {
      "frameworks": ["react"],
      "maxComponentsPerFile": 5,
      "includeStyles": true,
      "generateDocs": true
    }
  }'
```

**Response:**

```json
{
  "success": true,
  "projectId": "454737867",
  "fileKey": "UijlTILMmeErA1cakxBBLU",
  "projectName": "Login App Prototype",
  "teamId": "1550518470816288684",
  "extractedAt": "2026-01-19T23:42:23.786Z",
  "filesProcessed": 1,
  "totalComponentsExtracted": 3,
  "frameworks": ["react"],
  "files": [
    {
      "fileName": "Login App Prototype",
      "fileKey": "UijlTILMmeErA1cakxBBLU",
      "frameworks": ["react"],
      "componentsExtracted": 3,
      "jsonPath": "Login-App-Prototype.json"
    }
  ],
  "outputDirectory": "file-UijlTILMmeErA1cakxBBLU-1768866142256"
}
```

**Output Structure:**

The endpoint generates JSON files in the `output/` directory:

```
output/
  file-UijlTILMmeErA1cakxBBLU-1768866142256/
    ├── Login-App-Prototype.json      # Component specs + generated code
    └── project-index.json             # Project metadata
```

**JSON File Contents:**

```json
{
  "id": "12a558e9-3d1b-495c-bf1e-fecc91490304",
  "fileName": "Login App Prototype",
  "fileKey": "UijlTILMmeErA1cakxBBLU",
  "extractedAt": "2026-01-19T23:42:22.625Z",
  "components": [...],              // Extracted Figma components
  "styles": {...},                  // Colors, typography, effects
  "generatedCode": {
    "react": {
      "components": [
        {
          "name": "LoginUser",
          "code": "import React...",  // Full React component code
          "styles": ".container {...}",  // CSS/CSS modules
          "dependencies": ["react"]
        }
      ],
      "globalStyles": "...",
      "notes": "..."
    }
  }
}
```

**Parameters:**

- `fileKey` (optional): Extract specific file (use this OR teamId+projectId)
- `teamId` (optional): Figma team ID (required if not using fileKey)
- `projectId` (optional): Figma project ID (required if not using fileKey)
- `figmaToken` (required): Figma personal access token
- `githubToken` (required): GitHub personal access token for AI generation
- `options.frameworks`: Array of frameworks to generate code for (default: ["react"])
- `options.maxComponentsPerFile`: Max components per file (default: 10, recommended: 2-3 for large files)
- `options.includeStyles`: Include style extraction (default: true)
- `options.generateDocs`: Generate project-index.json (default: true)

**Use Cases:**

1. **Single File Extraction**: Use `fileKey` to extract and generate code for a specific design file
2. **Project Batch Processing**: Use `teamId` + `projectId` to process all files in a project
3. **Developer Handoff**: Generated JSON files contain everything needed to develop the UI
4. **Multi-framework Support**: Generate code for React, Vue, Angular, and HTML simultaneously

#### Generate Frontend Code

```bash
curl -X POST http://localhost:3003/api/v1/generate-code \
  -H "Content-Type: application/json" \
  -H "x-ai-provider: github" \
  -d '{
    "fileKey": "your-figma-file-key",
    "framework": "react",
    "options": {
      "includeStyles": true,
      "responsive": true,
      "typescript": false
    }
  }'
```

#### List Generated Code

```bash
# List all generated code
curl http://localhost:3003/api/v1/generated-code

# Get specific generated code by ID
curl "http://localhost:3003/api/v1/generated-code?id=YOUR_CODE_ID"

# Filter by file key
curl "http://localhost:3003/api/v1/generated-code?fileKey=hlT4Sw9N8dd9bG2S1mUfxs"

# Filter by framework
curl "http://localhost:3003/api/v1/generated-code?framework=react"
```

### Supported Frameworks

- **React** - JSX components with hooks
- **Vue** - Single File Components (.vue) with Composition API
- **Angular** - Components with TypeScript and decorators
- **HTML** - Semantic HTML5 with CSS

### API Examples

#### Extract Login Component from Figma (React)

```bash
curl -X POST http://localhost:3003/api/v1/extract-design \
  -H "Content-Type: application/json" \
  -H "x-ai-provider: github" \
  -d '{
    "fileKey": "abc123xyz789",
    "nodeId": "15:234",
    "framework": "react",
    "componentName": "LoginForm",
    "options": {
      "includeStyles": true,
      "cssFramework": "tailwind",
      "responsive": true
    }
  }'
```

#### Generate Full Page (Vue)

```bash
curl -X POST http://localhost:3003/api/v1/generate-code \
  -H "Content-Type: application/json" \
  -H "x-ai-provider: openai" \
  -d '{
    "fileKey": "abc123xyz789",
    "framework": "vue",
    "pageId": "1:2",
    "options": {
      "typescript": true,
      "includeStyles": true
    }
  }'
```

#### Generate Angular Component

```bash
curl -X POST http://localhost:3003/api/v1/generate-code \
  -H "Content-Type: application/json" \
  -H "x-ai-provider: github" \
  -d '{
    "fileKey": "hlT4Sw9N8dd9bG2S1mUfxs",
    "framework": "angular",
    "options": {
      "typescript": true,
      "includeStyles": true,
      "responsive": true
    }
  }'
```

#### Extract with Anthropic Claude

```bash
curl -X POST http://localhost:3003/api/v1/extract-design \
  -H "Content-Type: application/json" \
  -H "x-ai-provider: anthropic" \
  -d '{
    "fileKey": "your-file-key",
    "framework": "html"
  }'
```

## How It Works

1. **Figma API Connection**: Agent connects to Figma using your access token
2. **Design Extraction**: Fetches component structure, styles, and properties
3. **AI Analysis**: GPT-4o/Claude analyzes the design intent and patterns
4. **Code Generation**: Creates clean, structured code with proper naming
5. **Style Conversion**: Converts Figma styles to CSS/Tailwind/styled-components
6. **Component Assembly**: Organizes code into reusable components
7. **Output**: Returns formatted code ready to use in your project

## Response Format

```json
{
  "success": true,
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "framework": "react",
    "components": [
      {
        "name": "LoginForm",
        "code": "import React from 'react'...",
        "styles": ".login-form { ... }",
        "dependencies": ["useState", "useEffect"]
      }
    ],
    "assets": {
      "images": ["logo.svg", "background.png"],
      "fonts": ["Inter", "Roboto"]
    }
  },
  "metadata": {
    "figmaFile": "abc123xyz789",
    "provider": "github",
    "timestamp": "2026-01-19T10:30:00.000Z"
  },
  "savedTo": "figma-extract-loginform.json"
}
```

## Testing

```bash
npm test                  # Run all tests
npm run test:coverage     # Run tests with coverage
npm run test:watch        # Watch mode
```

## Troubleshooting

### Error 413: Payload Too Large

If you encounter `Request failed with status code 413`, your Figma file has too many components:

**Solution:**

- Reduce `maxComponentsPerFile` to 2-3 in the options
- Use `fileKey` to extract specific files instead of entire projects
- Extract specific `nodeId` instead of the entire file

```bash
# Good - limits components
curl -X POST http://localhost:3003/api/v1/extract-project \
  -d '{"fileKey": "...", "options": {"maxComponentsPerFile": 2}}'
```

### Error 400: File Type Not Supported

This error occurs when trying to extract FigJam files (whiteboards):

**Solution:**

- Only Figma design files are supported
- Check if the file is a FigJam board (collaborative whiteboard)
- Use regular Figma design files instead

### Token Validation Issues

Use the validate-token endpoint to diagnose token problems:

```bash
curl http://localhost:3003/api/v1/validate-token
```

**Common Issues:**

- Token expired - generate a new token from Figma settings
- Missing `FIGMA_ACCESS_TOKEN` in `.env` file
- Invalid token format - ensure it starts with `figd_`

## Best Practices

### Component Extraction

1. **Start Small**: Test with 2-3 components before processing large files
2. **Use Specific Nodes**: Extract specific components using `nodeId` for better results
3. **Framework Selection**: Choose the framework that matches your project stack

### Performance

1. **Batch Processing**: Use `extract-project` for multiple files
2. **Output Management**: Clean up `output/` directory periodically
3. **AI Provider**: Use GitHub Models (free) for development, OpenAI/Anthropic for production

### Generated Code

1. **Review First**: Always review generated code before using in production
2. **Add Logic**: Generated code is a skeleton - add business logic and state management
3. **Styling**: Generated styles are foundation - refine for your design system
4. **Accessibility**: Verify and enhance ARIA labels and keyboard navigation

## Deployment

Deploy to Vercel:

```bash
vercel deploy
```

See [docs/DEPLOY.md](docs/DEPLOY.md) for complete deployment instructions and CI/CD setup.

## Use Cases

### Design System to Code

Extract your Figma design system components and generate a component library:

```bash
# Extract button component
POST /api/v1/extract-design
{
  "fileKey": "your-design-system",
  "nodeId": "button-component-id",
  "framework": "react"
}
```

### Landing Page Generation

Convert a complete landing page design to HTML/React:

```bash
# Generate full landing page
POST /api/v1/generate-code
{
  "fileKey": "landing-page-file",
  "framework": "react",
  "options": {
    "responsive": true,
    "seo": true
  }
}
```

### Prototype to Production

Bridge the gap from design prototype to development:

1. Designer creates prototype in Figma
2. Agent extracts components and structure
3. Developer receives clean code skeleton
4. Developer adds business logic and integrations

## Future Agents

This Figma Extractor Agent is part of a larger multi-agent ecosystem:

1. **Test Scenario Generator** - Generates test scenarios
2. **User Story Generator** - Converts tests to user stories
3. **Project Scaffolding Agent** - Creates project structure
4. **Figma Frontend Extractor** (Current) - Design to code
5. **Developer Agent** - Code implementation (Coming Soon)
6. **Code Review Agent** - Quality analysis (Coming Soon)

## Contributing

Contributions are welcome! Please read our contributing guidelines.

## License

MIT

## Links

- **GitHub**: https://github.com/AuronForge/figma-frontend-extractor-agent
- **Issues**: https://github.com/AuronForge/figma-frontend-extractor-agent/issues
- **API Documentation**: https://figma-frontend-extractor-agent.vercel.app/api/v1/api-docs
