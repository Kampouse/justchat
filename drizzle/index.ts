import { createClient } from "@libsql/client";
import { schema } from "./schema";
import { drizzle } from "drizzle-orm/libsql";

export default () => {
  const sqlite = createClient({
    url: "http://db:8080",
  });
  const db = drizzle(sqlite, { schema });
  return db;
};
