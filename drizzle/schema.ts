// // This is your drizzle schema file.

// import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// export const users = pgTable("users", {
//   id: serial("id").primaryKey(),
//   name: text("name").default("not_provided"),
//   email: text("email").notNull(),
// });

// export const schema = {
//   users,
// };
import { v4 } from "uuid";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
export const users = sqliteTable("users", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name").default("not_provided"),
  email: text("email").notNull(),
  // Add these new fields
  queriesRemaining: integer("queries_remaining", { mode: "number" }).default(
    50,
  ),
  language: text("language").default("en"),
  queriesUsed: integer("queries_used", { mode: "number" }).default(0),
  totalQueries: integer("total_queries", { mode: "number" }).default(50),
  lastQueryReset: integer("last_query_reset", { mode: "timestamp" }).default(
    new Date(),
  ),
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(new Date())
    .$onUpdateFn(() => new Date()),
});

export const conversations = sqliteTable("conversations", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name"),
  type: text("type").default("human"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  uuid: text("uuid").notNull().default(v4()),
  createdBy: integer("created_by").references(() => users.id),
});

export const messages = sqliteTable("messages", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  conversationId: integer("conversation_id").references(() => conversations.id),
  senderId: integer("sender_id").references(() => users.id),
  type: text("type").default("human"),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const schema = {
  users,
  conversations,
  messages,
};
