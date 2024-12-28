import type { Config } from "drizzle-kit";

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "turso",
  dbCredentials: {
    url:
      process.env.NODE_ENV === "production"
        ? "http://db:8080"
        : "http://localhost:8080",
  },
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
});
