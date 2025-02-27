import { createClient } from "@libsql/client";
import { schema } from "./schema";
import { drizzle } from "drizzle-orm/libsql";

export default () => {
  try {
    const sqlite = createClient({
      url:
        process.env.NODE_ENV == "production"
          ? (process.env.DATABASE_URL as string)
          : "http://localhost:8080",
      authToken: process.env.AUTH_TOKEN,
    });
    const db = drizzle(sqlite, { schema });
    return db;
  } catch (error) {
    console.error("Error creating db client:", error);
    throw error;
  }
};
export const DB = () => {
  try {
    const sqlite = createClient({
      url:
        process.env.NODE_ENV == "production"
          ? (process.env.DATABASE_URL as string)
          : "http://localhost:8080",
      authToken: process.env.AUTH_TOKEN,
    });
    const db = drizzle(sqlite, { schema });
    return db;
  } catch (error) {
    console.error("Error creating db client:", error);
    throw error;
  }
};
