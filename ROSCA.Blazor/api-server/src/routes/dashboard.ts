import { Router, type IRouter } from "express";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  db,
  fundsTable,
  fundMembersTable,
  payoutsTable,
  walletTransactionsTable,
  usersTable,
} from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetRecentActivityResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function buildPayoutData(payoutId: string, currentUserId: string) {
  const [row] = await db
    .select({ p: payoutsTable, u: usersTable })
    .from(payoutsTable)
    .leftJoin(usersTable, eq(payoutsTable.userId, usersTable.id))
    .where(eq(payoutsTable.id, payoutId))
    .limit(1);
  if (!row) return null;
  const memberCount = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(fundMembersTable)
    .where(eq(fundMembersTable.fundId, row.p.fundId));
  const totalContributors = Number(memberCount[0]?.c ?? 0);
  const contribRows = await db
    .select({ userId: walletTransactionsTable.userId })
    .from(walletTransactionsTable)
    .where(
      and(
        eq(walletTransactionsTable.payoutId, payoutId),
        eq(walletTransactionsTable.type, "contribution"),
      ),
    );
  const contributedCount = new Set(contribRows.map((r) => r.userId)).size;
  const hasContributed = contribRows.some((r) => r.userId === currentUserId);
  return {
    id: row.p.id,
    fundId: row.p.fundId,
    userId: row.p.userId,
    roundNumber: row.p.roundNumber,
    payoutOrderInRound: row.p.payoutOrderInRound,
    amount: Number(row.p.amount),
    dueDate: row.p.dueDate,
    collectionDate: row.p.collectionDate,
    status: row.p.status as "upcoming" | "collecting" | "paid" | "overdue",
    recipientFullName: row.u?.fullName ?? null,
    recipientUsername: row.u?.username ?? null,
    contributedCount,
    totalContributors,
    hasContributed,
  };
}

router.get("/dashboard/summary", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;

  const [totalSavedRow] = await db
    .select({ s: sql<string>`coalesce(sum(${walletTransactionsTable.amount}), 0)` })
    .from(walletTransactionsTable)
    .where(
      and(
        eq(walletTransactionsTable.userId, userId),
        eq(walletTransactionsTable.type, "contribution"),
      ),
    );
  const totalSaved = Number(totalSavedRow?.s ?? 0);

  const memberships = await db
    .select({ fundId: fundMembersTable.fundId })
    .from(fundMembersTable)
    .where(eq(fundMembersTable.userId, userId));
  const fundIds = memberships.map((m) => m.fundId);

  let activeFunds = 0;
  if (fundIds.length > 0) {
    const [activeRow] = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(fundsTable)
      .where(and(inArray(fundsTable.id, fundIds), eq(fundsTable.status, "active")));
    activeFunds = Number(activeRow?.c ?? 0);
  }

  let nextPayout = null;
  let upcomingPayoutAmount = 0;
  if (fundIds.length > 0) {
    const upcoming = await db
      .select({ p: payoutsTable })
      .from(payoutsTable)
      .where(
        and(
          eq(payoutsTable.userId, userId),
          inArray(payoutsTable.status, ["upcoming", "collecting"]),
        ),
      )
      .orderBy(payoutsTable.dueDate)
      .limit(1);
    if (upcoming[0]) {
      nextPayout = await buildPayoutData(upcoming[0].p.id, userId);
      upcomingPayoutAmount = Number(upcoming[0].p.amount);
    }
  }

  const dueThisCycle: any[] = [];
  if (fundIds.length > 0) {
    const collecting = await db
      .select({ p: payoutsTable })
      .from(payoutsTable)
      .where(
        and(
          inArray(payoutsTable.fundId, fundIds),
          eq(payoutsTable.status, "collecting"),
        ),
      );
    for (const row of collecting) {
      if (row.p.userId === userId) continue;
      const existing = await db
        .select()
        .from(walletTransactionsTable)
        .where(
          and(
            eq(walletTransactionsTable.payoutId, row.p.id),
            eq(walletTransactionsTable.userId, userId),
            eq(walletTransactionsTable.type, "contribution"),
          ),
        )
        .limit(1);
      if (existing.length > 0) continue;
      const data = await buildPayoutData(row.p.id, userId);
      if (data) dueThisCycle.push(data);
    }
  }

  res.json(
    GetDashboardSummaryResponse.parse({
      totalSaved,
      activeFunds,
      upcomingPayoutAmount,
      nextPayout,
      dueThisCycle,
    }),
  );
});

router.get("/dashboard/activity", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const memberships = await db
    .select({ fundId: fundMembersTable.fundId })
    .from(fundMembersTable)
    .where(eq(fundMembersTable.userId, userId));
  const fundIds = memberships.map((m) => m.fundId);
  if (fundIds.length === 0) {
    res.json(GetRecentActivityResponse.parse({ activity: [] }));
    return;
  }

  const rows = await db
    .select({
      t: walletTransactionsTable,
      u: usersTable,
      f: fundsTable,
    })
    .from(walletTransactionsTable)
    .leftJoin(usersTable, eq(walletTransactionsTable.userId, usersTable.id))
    .leftJoin(payoutsTable, eq(walletTransactionsTable.payoutId, payoutsTable.id))
    .leftJoin(fundsTable, eq(payoutsTable.fundId, fundsTable.id))
    .where(inArray(payoutsTable.fundId, fundIds))
    .orderBy(desc(walletTransactionsTable.paymentDate))
    .limit(20);

  const activity = rows.map((row) => ({
    id: row.t.id,
    fundId: row.f?.id ?? "",
    fundTitle: row.f?.title ?? "",
    type: row.t.type as "contribution" | "payout",
    amount: Number(row.t.amount),
    userFullName: row.u?.fullName ?? null,
    paymentDate: row.t.paymentDate,
  }));
  res.json(GetRecentActivityResponse.parse({ activity }));
});

export default router;
