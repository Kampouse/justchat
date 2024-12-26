import Database from "better-sqlite3";
import { schema } from "./schema";

import { drizzle } from "drizzle-orm/better-sqlite3";
export const Drizzler = () => {
  const sqlite = new Database("./drizzle/db/db.sqlite");
  const db = drizzle(sqlite, { schema });
  return db;
};
