import { sql } from "drizzle-orm";
import {
  date,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const currenciesTable = pgTable("currencies", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 8 }).notNull().unique(),
});

export const fundsTable = pgTable("funds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  adminId: varchar("admin_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  shareValue: numeric("share_value", { precision: 14, scale: 2 }).notNull(),
  periodType: varchar("period_type", { length: 20 }).notNull(), // weekly | biweekly | monthly
  startDate: date("start_date").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending | active | completed
  totalMembers: integer("total_members").notNull(),
  currencyId: integer("currency_id")
    .notNull()
    .references(() => currenciesTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const fundMembersTable = pgTable(
  "fund_members",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    fundId: varchar("fund_id")
      .notNull()
      .references(() => fundsTable.id, { onDelete: "cascade" }),
    payoutOrder: integer("payout_order"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("uniq_member_user_fund").on(table.userId, table.fundId)],
);

export type Fund = typeof fundsTable.$inferSelect;
export type FundMember = typeof fundMembersTable.$inferSelect;
export type Currency = typeof currenciesTable.$inferSelect;
