import type { Config } from "drizzle-kit";

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "turso",
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
    authToken: process.env.AUTH_TOKEN,
  },
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
});
