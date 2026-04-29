import { sql } from "drizzle-orm";
import {
  integer,
  numeric,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "./auth";
import { currenciesTable, fundsTable } from "./funds";
import { payoutsTable } from "./payouts";

export const walletsTable = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fundId: varchar("fund_id")
    .notNull()
    .references(() => fundsTable.id, { onDelete: "cascade" })
    .unique(),
  balance: numeric("balance", { precision: 14, scale: 2 }).notNull().default("0"),
  currencyId: integer("currency_id")
    .notNull()
    .references(() => currenciesTable.id),
});

export const walletTransactionsTable = pgTable("wallet_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id")
    .notNull()
    .references(() => walletsTable.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  payoutId: varchar("payout_id").references(() => payoutsTable.id, {
    onDelete: "set null",
  }),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // contribution | payout
  paymentDate: timestamp("payment_date", { withTimezone: true }).notNull().defaultNow(),
});

export type Wallet = typeof walletsTable.$inferSelect;
export type WalletTransaction = typeof walletTransactionsTable.$inferSelect;
