# Small Business Chatbot Monorepo

A monorepo containing a NestJS API backend and web frontend for a small business chatbot system.

## Project Structure

```
small-business-chatbot/
├── api/                    # NestJS Backend API
│   ├── src/               # Source code
│   ├── test/              # Tests
│   ├── knowledge/         # RAG knowledge base (YAML)
│   ├── package.json       # API dependencies
│   └── ...
├── apps/
│   └── web/               # Frontend application
│       ├── src/           # Frontend source code
│       ├── package.json   # Frontend dependencies
│       └── ...
├── package.json           # Monorepo root package.json
└── README.md             # This file
```

## Features

### Backend API (`/api`)

- **NestJS + Fastify** REST API
- **Weather Integration** via Tomorrow.io API
- **RAG System** with YAML knowledge base
- **Intelligent Routing** for weather vs business queries
- **OpenAI Integration** for natural language responses
- **Caching** with TTL for performance
- **Rate Limiting** and security middleware
- **Structured Logging** with Pino

### Frontend (`/apps/web`)

- **Modern Web Application**
- **Real-time Chat Interface**
- **Responsive Design**
- **TypeScript Support**

## Quick Start

### Prerequisites

- Node.js 20+
- npm 9+

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd small-business-chatbot
   ```

2. **Install all dependencies**

   ```bash
   npm run install:all
   ```

3. **Set up environment variables**

   ```bash

   # Edit .env with your API keys
   ```

4. **Start both frontend and backend**
   ```bash
   npm run dev
   ```

## Available Scripts

### Monorepo Commands (from root)

```bash
npm run dev              # Start both API and web app
npm run dev:api          # Start only the API
npm run dev:web          # Start only the web app
npm run build            # Build both projects
npm run test             # Run tests for both projects
npm run lint             # Lint both projects
npm run install:all      # Install dependencies for all projects
```

### API Commands (from `/api`)

```bash
npm run start:dev        # Start API in development mode
npm run build            # Build the API
npm run test             # Run API tests
npm run test:e2e         # Run API integration tests
npm run lint             # Lint API code
```

### Web Commands (from `/apps/web`)

```bash
npm run dev              # Start web app in development mode
npm run build            # Build the web app
npm run test             # Run web app tests
npm run lint             # Lint web app code
```

## API Endpoints

### Chat Endpoints

- `POST /chat-simple` - Simplified chat (UI-friendly)
- `POST /chat-simple/stream` - Streaming chat response
- `POST /chat` - Full chat with all options
- `POST /chat/stream` - Streaming chat with all options

### Router Endpoint

- `POST /router` - Intelligent message routing

### Utility Endpoints

- `GET /health` - Health check
- `GET /weather` - Weather information

## Environment Variables

Create `.env` in the root directory with:

```env
PORT=3000
CACHE_TTL_SECONDS=120
NOMINATIM_USER_AGENT=small-business-chatbot/1.0 (your-email@example.com)
TOMORROW_API_KEY=your_tomorrow_io_api_key
TOMORROW_FIELDS=temperature,weatherCode
OPEN_API_KEY=your_openai_api_key
```

## Development

### Running Individual Services

**API Only:**

```bash
cd api
npm run start:dev
# API will be available at http://localhost:3000
```

**Web Only:**

```bash
cd apps/web
npm run dev
# Web app will be available at http://localhost:3001 (or next available port)
```

### Testing

**Run all tests:**

```bash
npm run test
```

**Run API tests only:**

```bash
cd api
npm test
```

**Run web tests only:**

```bash
cd apps/web
npm test
```

### Building for Production

**Build everything:**

```bash
npm run build
```

**Build API only:**

```bash
cd api
npm run build
```

**Build web only:**

```bash
cd apps/web
npm run build
```

## API Documentation

### Chat Simple Endpoint

The main endpoint for the UI:

```bash
curl -X POST http://localhost:3000/chat-simple \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the weather like today?"}'
```

**Response:**

```json
{
  "response": "It is currently 72°F in San Clemente.",
  "weatherInfo": {
    "location": "San Clemente, CA",
    "tempF": 72,
    "tempC": 22
  },
  "businessInfo": {
    "name": "The Cellar",
    "location": "San Clemente, CA",
    "type": "wine_bar_cafe"
  },
  "route": "weather",
  "business_facets": []
}
```

## Knowledge Base

The RAG system uses YAML files in `api/knowledge/`:

```
api/knowledge/
├── cellar-sc/
│   └── business-info.yaml    # The Cellar business information
└── README.md                 # Knowledge base documentation
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm run test`
4. Run linting: `npm run lint`
5. Submit a pull request

## License

[Your License Here]
