import { eq } from "drizzle-orm";
import { users } from "../../drizzle/schema";
import Drizzler from "../../drizzle";
import type { Session } from "./types";
import { SyncCustomer } from "./index";
const TRIAL_MONTHLY_QUERIES = 50;
const PREMIUM_MONTHLY_QUERIES = 500;

export const createUser = async (session: Session) => {
  if (!session) return;

  const db = Drizzler();
  try {
    const base = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email));

    if (base.length === 0) {
      return await db
        .insert(users)
        .values({
          email: session.user.email,
          name: session.user.name,
          queriesRemaining: TRIAL_MONTHLY_QUERIES,
          lastQueryReset: new Date(),
          subscriptionStatus: 'none'
        })
        .execute();
    }
    return base;
  } catch (error) {
    console.error("Error creating/fetching user:", error);
    throw error;
  }
};

export const getUser = async (ctx: Session | null) => {
  if (!ctx) return null;

  const db = Drizzler();
  return await db
    .select()
    .from(users)
    .where(eq(users.email, ctx.user.email))
    .execute();
};

export const updateUserLanguage = async (ctx: Session, language: string): Promise<boolean> => {
  if (!ctx) throw new Error("No session provided");

  const userId = await getUser(ctx);
  if (!userId?.[0]) throw new Error("Invalid user");

  const db = Drizzler();
  const updated = await db
    .update(users)
    .set({ language })
    .where(eq(users.id, userId[0].id))
    .returning();

  return !!updated[0];
};

export const getRemainingQueries = async (ctx: Session): Promise<number | null> => {
  if (!ctx) return null;

  const userId = await getUser(ctx);
  if (!userId?.[0]) return null;

  const db = Drizzler();
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId[0].id)
  });

  return user?.queriesRemaining ?? 0;
};

export const updateUserQueries = async (ctx: Session): Promise<boolean> => {
  if (!ctx) throw new Error("No session provided");
  const userId = await getUser(ctx);
  if (!userId || !userId[0]) throw new Error("Invalid user");

  const database = Drizzler();
  const user = await database.query.users.findFirst({
    where: eq(users.id, userId[0].id),
  });

  if (!user) throw new Error("User not found");

  // Check if queries are exhausted
  if (user.queriesRemaining != null && user.queriesRemaining <= 0) {
    throw new Error("Query limit exceeded");
  }

  // Update user's query counts
  const updatedUser = await database
    .update(users)
    .set({
      queriesRemaining: (user.queriesRemaining || 0) - 1,
      queriesUsed: (user.queriesUsed || 0) + 1,
    })
    .where(eq(users.id, userId[0].id))
    .returning();
  return updatedUser && updatedUser[0] && typeof updatedUser[0].queriesRemaining === 'number' && updatedUser[0].queriesRemaining >= 0;
};
export const GetRemainingQueries = async (ctx: Session): Promise<number | null> => {
  if (!ctx) return null;

  const userId = await getUser(ctx);
  if (!userId || !userId[0]) return null;

  const database = Drizzler();
  const user = await database.query.users.findFirst({
    where: eq(users.id, userId[0].id)
  });

  if (!user) return null;
  if (!user.lastSyncDate || (new Date().getTime() - new Date(user.lastSyncDate).getTime() > 24 * 60 * 60 * 1000)) {
    await database.update(users)
      .set({ lastSyncDate: new Date() })
      .where(eq(users.id, userId[0].id)).execute();

    await SyncCustomer(ctx.user.email);
  }

  // Handle query reset logic
  if (user.lastQueryReset) {
    const currentTime = new Date().getTime();
    const lastResetTime = new Date(user.lastQueryReset).getTime();
    const timeDiff = currentTime - lastResetTime;
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    if (timeDiff > thirtyDays) {

      const queryLimit = user.subscriptionStatus === 'active' ? PREMIUM_MONTHLY_QUERIES : TRIAL_MONTHLY_QUERIES;
      await database.update(users)
        .set({
          queriesRemaining: queryLimit,
        queriesUsed: 0,
          lastQueryReset: new Date()
        })
        .where(eq(users.id, userId[0].id));

      return queryLimit;
    }
  }

  return user.queriesRemaining || 0;
};
