import type { Config } from "drizzle-kit";

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "turso",
  dbCredentials: {
    url:
      process.env.NODE_ENV === "production"
        ? (process.env.DATABASE_URL as string)
        : "http://localhost:8080",
    authToken: process.env.AUTH_TOKEN,
  },
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
});
