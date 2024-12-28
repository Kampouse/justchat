# JustChat - Qwik.js AI Chat Application

A modern AI chat application built with Qwik.js, DrizzleORM, LangChain, and GitHub authentication.

## Features

- Real-time AI chat powered by OpenAI GPT-3.5
- Previous conversation history and management
- GitHub OAuth authentication
- Streaming responses
- Clean and intuitive UI
- Responsive design

## Tech Stack

- **Frontend**: [Qwik.js](https://qwik.builder.io/)
- **Database**: PostgreSQL with [DrizzleORM](https://orm.drizzle.team/)
- **AI**: [LangChain](https://js.langchain.com/) with OpenAI
- **Authentication**: GitHub OAuth via [@auth/qwik](https://authjs.dev/)
- **Styling**: Tailwind CSS

## Prerequisites

- Node.js
- GitHub OAuth application credentials
- OpenAI API key

## Environment Variables

Create a `.env` file with:

```env

OPENAI_API_KEY=""
AI_SMITH=""
LANGCHAIN_TRACING_V2="true";
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""
AUTH_SECRET=""
SQLD_AUTH_JWT_KEY="" npx creds.ts
AUTH_TOKEN=""  npx creds.ts
```

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/justchat.git
cd justchat
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up your database:

```bash
    npx drizzle-kit  push:sqlite
```

4. Start the development server:

```bash
pnpm run dev
```

Visit http://localhost:5173 to see your app running!

## GitHub OAuth Setup

1. Go to GitHub Developer Settings
2. Create a new OAuth App
3. Set Homepage URL to `http://localhost:5173`
4. Set Authorization callback URL to `http://localhost:5173/auth/callback/github`
5. Copy Client ID and Client Secret to your `.env` file

## Project Structure

- `/src/routes` - Page routes and API endpoints
- `/src/components` - Reusable UI components
- `/src/server` - Server-side utilities and database operations
- `/drizzle` - Database schema and migrations

## Key Features Implementation

- Real-time chat using LangChain streaming
- Persistent conversations with DrizzleORM
- Auth   wit authJS
- Responsive UI with Tailwind CSS

## License
MIT

will not work without all the variables set in the .env file
```
 docker compose up --build
```

Then visit [http://localhost:5173/](http://localhost:5173/)



```
npm run serve
```

Then visit [http://localhost:5173/](http://localhost:5173/)
