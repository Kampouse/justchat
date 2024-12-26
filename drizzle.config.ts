import type { Config } from "drizzle-kit";

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  dbCredentials: {
    url: " ./drizzle/db/db.sqlite",
  },
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
});
