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
