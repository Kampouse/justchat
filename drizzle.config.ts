import type { Config } from "drizzle-kit";

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "turso",
  dbCredentials: {
    url:
      process.env.NODE_ENV === "production"
        ? "http://db:8080"
        : (process.env.DATABASE_URL as string),
    authToken: process.env.AUTH_TOKEN,
  },
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
});
