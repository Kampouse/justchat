import { createClient } from "@libsql/client";
import { schema } from "./schema";
import { drizzle } from "drizzle-orm/libsql";

export default () => {
  const sqlite = createClient({
    url: process.env.DATABASE_URL as string,

    authToken: process.env.AUTH_TOKEN,
  });
  const db = drizzle(sqlite, { schema });
  return db;
};
