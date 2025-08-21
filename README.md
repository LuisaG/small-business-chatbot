# Small Business Chatbot

A production-ready chatbot system for small businesses, featuring a NestJS backend with RAG (Retrieval-Augmented Generation) and a modern React frontend.

## Business Context

This chatbot is designed for **The Cellar**, a wine bar and café located at 156 Avenida Del Mar, San Clemente, CA.

**About The Cellar:**
The Cellar is my go-to coffee shop for getting work done! It's pretty cool how it transforms throughout the day - it opens as a peaceful coffee shop at 11:00 AM with great coffee and a quiet atmosphere perfect for focusing, then later transforms into a restaurant/brunch place. During those morning hours when it's just opening up, it's super peaceful and not crowded at all, making it the perfect spot for remote work.

The system provides intelligent responses about:

- **Business Information**: Hours, menu highlights, policies, amenities
- **Weather Integration**: Current weather conditions at the business location
- **Conversation History**: Persistent chat sessions using SQLite database
- **Intelligent Routing**: Automatically determines if queries are about business info, weather, or both

## Architecture

### Backend (NestJS + Fastify)

- **Framework**: NestJS with Fastify adapter for high performance
- **Database**: SQLite with Prisma ORM for conversation persistence
- **RAG System**: YAML-based knowledge base for business information
- **APIs**: OpenAI GPT-4 for natural language generation, Tomorrow.io for weather data
- **Caching**: In-memory TTL cache for weather and geocoding data
- **Security**: Helmet, CORS, rate limiting, input validation with Zod

### Frontend (React + TypeScript)

- **Framework**: React with TypeScript
- **UI Library**: Material-UI with custom theme
- **State Management**: Zustand for chat state
- **Real-time Streaming**: Server-Sent Events for live response streaming

## Quick Start

### Prerequisites

- Node.js 20+
- npm 9+

### Installation

1. **Clone and install dependencies**

   ```bash
   git clone <repository-url>
   cd small-business-chatbot
   npm run install:all
   ```

2. **Set up environment variables**

   ```bash
   cp apps/api/env.example .env
   # Edit .env with your API keys
   ```

3. **Initialize database**

   ```bash
   cd apps/api
   npx prisma migrate dev --name init
   ```

4. **Start the application**

   ```bash
   # From root directory - starts both frontend and backend
   npm run dev

   # Or start individually:
   npm run dev:api    # Backend only (port 3000)
   npm run dev:web    # Frontend only (port 3001)
   ```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
CACHE_TTL_SECONDS=120

# Geocoding (Nominatim)
NOMINATIM_USER_AGENT=small-business-chatbot/1.0 (your-email@example.com)

# Weather API (Tomorrow.io)
TOMORROW_API_KEY=your_tomorrow_io_api_key
TOMORROW_FIELDS=temperature,weatherCode

# OpenAI API
OPEN_API_KEY=your_openai_api_key

# Database
DATABASE_URL="file:./apps/api/dev.db"
```

### Required API Keys

1. **Tomorrow.io** - Weather data provider

   - Sign up at [tomorrow.io](https://www.tomorrow.io/)
   - Free tier includes 1000 calls/month

2. **OpenAI** - Language model for responses
   - Sign up at [platform.openai.com](https://platform.openai.com/)
   - Requires billing setup for GPT-4 access

## Project Structure

```
small-business-chatbot/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   ├── src/
│   │   │   ├── chat/          # Chat endpoints and logic
│   │   │   ├── weather/       # Weather API integration
│   │   │   ├── router/        # Message routing logic
│   │   │   ├── database/      # Prisma database service
│   │   │   └── common/        # Shared services (RAG, cache, HTTP)
│   │   ├── knowledge/         # YAML business information
│   │   └── prisma/           # Database schema
│   └── web/                   # React Frontend
│       ├── src/
│       │   ├── components/    # Chat UI components
│       │   ├── store/         # Zustand state management
│       │   └── lib/           # API client
│       └── public/            # Static assets
└── package.json               # Monorepo scripts
```

## API Endpoints

### Chat Endpoints

- `POST /chat-simple` - Simplified chat for UI
- `POST /chat-simple/stream` - Streaming chat response
- `POST /chat` - Full chat with all options
- `POST /chat/stream` - Streaming chat with all options

### Utility Endpoints

- `GET /health` - Health check
- `GET /weather` - Weather information
- `POST /router` - Message routing logic

## Development

### Running Tests

```bash
# All tests
npm run test

# Backend tests only
cd apps/api && npm test

# Frontend tests only
cd apps/web && npm test
```

### Database Management

```bash
cd apps/api

# View database
npx prisma studio

# Reset database
npx prisma migrate reset --force

# Generate Prisma client
npx prisma generate
```

### Building for Production

```bash
# Build everything
npm run build

# Build backend only
cd apps/api && npm run build

# Build frontend only
cd apps/web && npm run build
```

## Key Features

### Intelligent Message Routing

The system automatically categorizes user queries:

- **Weather**: Temperature, forecast, conditions
- **Business**: Hours, menu, policies, amenities
- **Both**: Queries requiring both weather and business info
- **Fallback**: Unclear or out-of-scope queries

### RAG Knowledge Base

Business information is stored in YAML format (`apps/api/knowledge/cellar-sc/business-info.yaml`) and includes:

- Operating hours
- Menu highlights
- Policies (reservations, pets, etc.)
- Amenities and features
- Contact information

### Real-time Streaming

Responses stream word-by-word for better user experience, using OpenAI's streaming API.

### Conversation Persistence

All conversations are stored in SQLite database with:

- Conversation tracking
- Message history
- Timestamp logging

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm run test`
4. Run linting: `npm run lint`
5. Submit a pull request

## License

[Your License Here]
