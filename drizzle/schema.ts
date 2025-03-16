import { v4 } from "uuid";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
export const users = sqliteTable("users", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name").default("not_provided"),
  email: text("email").notNull(),
  // Subscription fields
  polarCustomerId: text("polar_customer_id"),
  subscription: text("subscription").default("free"),
  subscriptionId: text("subscription_id"),
  subscriptionStatus: text("subscription_status"),
  subscriptionPlan: text("subscription_plan"),
  subscriptionStartDate: integer("subscription_start_date", {
    mode: "timestamp",
  }),
  subscriptionEndDate: integer("subscription_end_date", { mode: "timestamp" }),

  lastSyncDate: integer("last_sync_date", { mode: "timestamp" }),
  lastPaymentDate: integer("last_payment_date", { mode: "timestamp" }),
  nextPaymentDate: integer("next_payment_date", { mode: "timestamp" }),
  // Usage tracking
  queriesRemaining: integer("queries_remaining", { mode: "number" }).default(
    50,
  ),
  queriesUsed: integer("queries_used", { mode: "number" }).default(0),
  totalQueries: integer("total_queries", { mode: "number" }).default(50),
  lastQueryReset: integer("last_query_reset", { mode: "timestamp" }).default(
    new Date(),
  ),
  // Features and settings
  language: text("language").default("en"),
  allowedFeatures: text("allowed_features"),
  accountStatus: text("account_status").default("active"),
  lastSubscriptionChange: integer("last_subscription_change", {
    mode: "timestamp",
  }),
  // Timestamps
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
