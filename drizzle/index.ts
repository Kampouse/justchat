import { createClient } from "@libsql/client";
import { schema } from "./schema";
import { drizzle } from "drizzle-orm/libsql";

export default () => {
  console.log(process.env.DATABASE_URL, process.env.AUTH_TOKEN);
  const sqlite = createClient({
    url:
      process.env.NODE_ENV === "production"
        ? "libsql://just-chat-kampouse.turso.io"
        : "http://localhost:8080",

    authToken: process.env.AUTH_TOKEN,
  });
  const db = drizzle(sqlite, { schema });
  return db;
};
