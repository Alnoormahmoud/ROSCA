import { sql } from "drizzle-orm";
import {
  date,
  integer,
  numeric,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "./auth";
import { fundsTable } from "./funds";

export const payoutsTable = pgTable("payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fundId: varchar("fund_id")
    .notNull()
    .references(() => fundsTable.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  roundNumber: integer("round_number").notNull(),
  payoutOrderInRound: integer("payout_order_in_round").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  dueDate: date("due_date").notNull(),
  collectionDate: timestamp("collection_date", { withTimezone: true }),
  status: varchar("status", { length: 20 }).notNull().default("upcoming"), // upcoming | collecting | paid | overdue
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Payout = typeof payoutsTable.$inferSelect;
