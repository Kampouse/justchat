# JustChat - Qwik.js AI Chat Application

A modern AI chat application built with Qwik.js, DrizzleORM, LangChain, and GitHub authentication.

## Features

- AI chat powered by OpenAI GPT-3.5
- Previous conversation access
- GitHub OAuth authentication
- Streaming responses

## Tech Stack

- **Frontend**: [Qwik.js](https://qwik.builder.io/)
- **Database**: libsql with [DrizzleORM](https://orm.drizzle.team/)
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

OPENAI_API_KEY="" https://platform.openai.com/account/api-keys
LANGCHAIN_TRACING_V2="false";
AUTH_GITHUB_ID="" https://github.com/settings/applications/new
CALLBACK_URL -> http://localhost:5173/auth/callback/github" on github not in .env
AUTH_GITHUB_SECRET=""
DATABASE_URL='http://db:8080' # in  signle quotes not double
AUTH_SECRET="" npm exec auth secret # will add itself to the .env file
SQLD_AUTH_JWT_KEY="" npx  tsx creds.ts
AUTH_TOKEN=""  npx tsx creds.ts
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

```bash
./drizzle/index.ts
for dev

```

```bash
docker compose up  // with --build if you want to rebuild the image

open http://localhost:5173 in your browser


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
- Auth wit authJS
- Responsive UI with Tailwind CSS

## License

MIT

will not work without all the variables set in the .env file

### Development
- `DATABASE_URL`: Local development database connection string
- `POLAR_ID_TEST`: Polar API test environment ID
- `OPENAI_API_KEY`: OpenAI API key for development
- `APP_URL`: Development application URL (e.g. http://localhost:3000)
- `POLAR_PRODUCT_PRICE_ID`: Polar product/price ID for test environment
- `NODE_ENV`: Set to 'development'
- `AUTH_SECRET`: Authentication secret key for dev
- `GITHUB_ID`: GitHub OAuth app client ID
- `GITHUB_SECRET`: GitHub OAuth app client secret
- `GOOGLE_ID`: Google OAuth app client ID
- `GOOGLE_SECRET`: Google OAuth app client secret

### Production
- `DATABASE_URL`: Production database connection string
- `POLAR_ID_PROD`: Polar API production environment ID
- `OPENAI_API_KEY`: OpenAI API key for production
- `APP_URL`: Production application URL
- `POLAR_PRODUCT_PRICE_ID`: Polar product/price ID for production
- `NODE_ENV`: Set to 'production'
- `AUTH_SECRET`: Authentication secret key for prod
- `GITHUB_ID`: GitHub OAuth app client ID
- `GITHUB_SECRET`: GitHub OAuth app client secret
- `GOOGLE_ID`: Google OAuth app client ID
- `GOOGLE_SECRET`: Google OAuth app client secret
