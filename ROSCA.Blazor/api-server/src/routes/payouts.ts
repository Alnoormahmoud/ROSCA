import { Router, type IRouter } from "express";
import { and, asc, eq, sql } from "drizzle-orm";
import {
  db,
  fundsTable,
  fundMembersTable,
  payoutsTable,
  walletsTable,
  walletTransactionsTable,
  usersTable,
} from "@workspace/db";
import {
  CollectPayoutResponse,
  ContributeToPayoutResponse,
  ListFundPayoutsResponse,
  GetFundWalletResponse,
  ListWalletTransactionsResponse,
} from "@workspace/api-zod";
import { currenciesTable } from "@workspace/db";

const router: IRouter = Router();

/**
 * Auto-collect any payouts in this fund whose due date has passed AND where
 * every non-recipient member has contributed. Mirrors the logic of POST
 * /payouts/:id/collect but runs on read so that "scheduled time ends → money
 * transfers automatically" works without a cron worker.
 */
async function autoCollectDuePayouts(fundId: string) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  // Look up the fund so we can gate auto-promotion on startDate.
  const [fund] = await db
    .select()
    .from(fundsTable)
    .where(eq(fundsTable.id, fundId))
    .limit(1);
  if (!fund) return;
  // Date-only comparison (ignores time): the fund is considered started as
  // soon as today's date matches or is past the start date.
  const startReached = fund.startDate <= today;

  // If the fund is still "pending" but the start date has now arrived,
  // automatically transition it to "active". This is the auto-start trigger
  // for funds that were created with a future start date.
  if (startReached && fund.status === "pending") {
    await db
      .update(fundsTable)
      .set({ status: "active" })
      .where(eq(fundsTable.id, fundId));
    fund.status = "active";
  }

  const candidates = await db
    .select()
    .from(payoutsTable)
    .where(
      and(
        eq(payoutsTable.fundId, fundId),
        sql`${payoutsTable.status} in ('upcoming','collecting','overdue')`,
        sql`${payoutsTable.dueDate} <= ${today}`,
      ),
    )
    .orderBy(asc(payoutsTable.roundNumber));

  // Even when there are no candidates whose due date has passed, we still
  // need to promote the FIRST upcoming round to "collecting" once the start
  // date has arrived. We only skip the per-payout collection loop in that
  // case.
  const [{ c: total }] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(fundMembersTable)
    .where(eq(fundMembersTable.fundId, fundId));
  const totalMembers = Number(total ?? 0);
  if (totalMembers === 0) return;

  const [wallet] = await db
    .select()
    .from(walletsTable)
    .where(eq(walletsTable.fundId, fundId))
    .limit(1);
  if (!wallet) return;

  let walletBalance = Number(wallet.balance);
  let walletDirty = false;

  for (const payout of candidates) {
    if (payout.status === "paid") continue;
    // Even if a row's dueDate has somehow passed, do nothing until the fund
    // has actually started (never collect before startDate).
    if (!startReached) continue;

    const contribRows = await db
      .select({ userId: walletTransactionsTable.userId })
      .from(walletTransactionsTable)
      .where(
        and(
          eq(walletTransactionsTable.payoutId, payout.id),
          eq(walletTransactionsTable.type, "contribution"),
        ),
      );
    const uniqueContribs = new Set(contribRows.map((r) => r.userId)).size;

    // Once the due date has passed, the transfer is processed automatically
    // even if not everyone contributed (and even if the wallet balance is 0).
    // Before the due date, still require everyone except the recipient to pay.
    const dueDatePassed = payout.dueDate <= today;
    if (!dueDatePassed && uniqueContribs < totalMembers - 1) continue;

    const amount = Number(payout.amount);

    // Insert the payout transaction (recipient receives funds → bank account)
    await db.insert(walletTransactionsTable).values({
      walletId: wallet.id,
      userId: payout.userId,
      payoutId: payout.id,
      amount: String(amount),
      type: "payout",
    });
    walletBalance = Math.max(0, walletBalance - amount);
    walletDirty = true;

    await db
      .update(payoutsTable)
      .set({ status: "paid", collectionDate: now })
      .where(eq(payoutsTable.id, payout.id));
  }

  if (walletDirty) {
    await db
      .update(walletsTable)
      .set({ balance: String(walletBalance) })
      .where(eq(walletsTable.id, wallet.id));
  }

  // Activate next "upcoming" round if any — but ONLY once the fund's start
  // date has arrived. Before startDate the entire schedule sits idle.
  if (!startReached) return;

  const all = await db
    .select()
    .from(payoutsTable)
    .where(eq(payoutsTable.fundId, fundId))
    .orderBy(asc(payoutsTable.roundNumber));
  const anyCollecting = all.some((p) => p.status === "collecting");
  if (!anyCollecting) {
    const next = all.find((p) => p.status === "upcoming");
    if (next) {
      await db
        .update(payoutsTable)
        .set({ status: "collecting" })
        .where(eq(payoutsTable.id, next.id));
    } else if (all.length > 0 && all.every((p) => p.status === "paid")) {
      await db
        .update(fundsTable)
        .set({ status: "completed" })
        .where(eq(fundsTable.id, fundId));
    }
  }
}

async function loadPayoutForUser(payoutId: string, currentUserId: string) {
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

router.get("/funds/:fundId/payouts", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const fundId = req.params.fundId;
  await autoCollectDuePayouts(fundId);
  const payoutRows = await db
    .select({ p: payoutsTable, u: usersTable })
    .from(payoutsTable)
    .leftJoin(usersTable, eq(payoutsTable.userId, usersTable.id))
    .where(eq(payoutsTable.fundId, fundId))
    .orderBy(asc(payoutsTable.roundNumber));

  const memberCount = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(fundMembersTable)
    .where(eq(fundMembersTable.fundId, fundId));
  const totalContributors = Number(memberCount[0]?.c ?? 0);

  const payouts = await Promise.all(
    payoutRows.map(async (row) => {
      const contribRows = await db
        .select({ userId: walletTransactionsTable.userId })
        .from(walletTransactionsTable)
        .where(
          and(
            eq(walletTransactionsTable.payoutId, row.p.id),
            eq(walletTransactionsTable.type, "contribution"),
          ),
        );
      const contributedCount = new Set(contribRows.map((r) => r.userId)).size;
      const hasContributed = contribRows.some((r) => r.userId === req.user!.id);
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
    }),
  );
  res.json(ListFundPayoutsResponse.parse({ payouts }));
});

router.post("/payouts/:payoutId/contribute", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const payoutId = req.params.payoutId;
  const [payout] = await db
    .select()
    .from(payoutsTable)
    .where(eq(payoutsTable.id, payoutId))
    .limit(1);
  if (!payout) {
    res.status(404).json({ error: "Payout not found" });
    return;
  }
  // (Restriction) Money can only be sent while the payout is in "collecting" state.
  if (payout.status !== "collecting") {
    res
      .status(400)
      .json({ error: "Payout is not in the collecting state", message: "يمكن الدفع فقط خلال فترة التحصيل" });
    return;
  }
  if (payout.userId === req.user.id) {
    res
      .status(400)
      .json({ error: "Recipient does not contribute to their own payout" });
    return;
  }

  // Check membership
  const isMember = await db
    .select()
    .from(fundMembersTable)
    .where(
      and(
        eq(fundMembersTable.fundId, payout.fundId),
        eq(fundMembersTable.userId, req.user.id),
      ),
    )
    .limit(1);
  if (isMember.length === 0) {
    res.status(403).json({ error: "Not a member of this fund" });
    return;
  }

  // Already contributed?
  const existing = await db
    .select()
    .from(walletTransactionsTable)
    .where(
      and(
        eq(walletTransactionsTable.payoutId, payoutId),
        eq(walletTransactionsTable.userId, req.user.id),
        eq(walletTransactionsTable.type, "contribution"),
      ),
    )
    .limit(1);
  if (existing.length > 0) {
    res.status(400).json({ error: "Already contributed for this payout" });
    return;
  }

  const [fund] = await db
    .select()
    .from(fundsTable)
    .where(eq(fundsTable.id, payout.fundId))
    .limit(1);
  const [wallet] = await db
    .select()
    .from(walletsTable)
    .where(eq(walletsTable.fundId, payout.fundId))
    .limit(1);
  if (!fund || !wallet) {
    res.status(500).json({ error: "Fund or wallet missing" });
    return;
  }

  const share = Number(fund.shareValue);
  await db.insert(walletTransactionsTable).values({
    walletId: wallet.id,
    userId: req.user.id,
    payoutId: payoutId,
    amount: String(share),
    type: "contribution",
  });
  await db
    .update(walletsTable)
    .set({ balance: String(Number(wallet.balance) + share) })
    .where(eq(walletsTable.id, wallet.id));

  // After the contribution, see if everyone except the recipient has now paid.
  // If so, and the due date has arrived, auto-collect immediately.
  await autoCollectDuePayouts(payout.fundId);

  const updated = await loadPayoutForUser(payoutId, req.user.id);
  res.json(ContributeToPayoutResponse.parse({ payout: updated }));
});

router.post("/payouts/:payoutId/collect", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const payoutId = req.params.payoutId;
  const [payout] = await db
    .select()
    .from(payoutsTable)
    .where(eq(payoutsTable.id, payoutId))
    .limit(1);
  if (!payout) {
    res.status(404).json({ error: "Payout not found" });
    return;
  }
  if (payout.userId !== req.user.id) {
    res
      .status(403)
      .json({ error: "Only the recipient can collect this payout" });
    return;
  }
  if (payout.status === "paid") {
    res.status(400).json({ error: "Already collected" });
    return;
  }

  // Confirm everyone except recipient has contributed
  const memberCount = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(fundMembersTable)
    .where(eq(fundMembersTable.fundId, payout.fundId));
  const total = Number(memberCount[0]?.c ?? 0);

  const contribs = await db
    .select({ userId: walletTransactionsTable.userId })
    .from(walletTransactionsTable)
    .where(
      and(
        eq(walletTransactionsTable.payoutId, payoutId),
        eq(walletTransactionsTable.type, "contribution"),
      ),
    );
  const uniqueContribs = new Set(contribs.map((c) => c.userId)).size;
  if (uniqueContribs < total - 1) {
    res
      .status(400)
      .json({ error: "Not all members have contributed yet" });
    return;
  }

  const [wallet] = await db
    .select()
    .from(walletsTable)
    .where(eq(walletsTable.fundId, payout.fundId))
    .limit(1);
  if (!wallet) {
    res.status(500).json({ error: "Wallet missing" });
    return;
  }

  const amount = Number(payout.amount);
  await db.insert(walletTransactionsTable).values({
    walletId: wallet.id,
    userId: req.user.id,
    payoutId: payoutId,
    amount: String(amount),
    type: "payout",
  });
  await db
    .update(walletsTable)
    .set({ balance: String(Math.max(0, Number(wallet.balance) - amount)) })
    .where(eq(walletsTable.id, wallet.id));

  await db
    .update(payoutsTable)
    .set({ status: "paid", collectionDate: new Date() })
    .where(eq(payoutsTable.id, payoutId));

  // Activate the next round if any
  const allPayouts = await db
    .select()
    .from(payoutsTable)
    .where(eq(payoutsTable.fundId, payout.fundId))
    .orderBy(asc(payoutsTable.roundNumber));
  const next = allPayouts.find((p) => p.status === "upcoming");
  if (next) {
    await db
      .update(payoutsTable)
      .set({ status: "collecting" })
      .where(eq(payoutsTable.id, next.id));
  } else {
    await db
      .update(fundsTable)
      .set({ status: "completed" })
      .where(eq(fundsTable.id, payout.fundId));
  }

  const updated = await loadPayoutForUser(payoutId, req.user.id);
  res.json(CollectPayoutResponse.parse({ payout: updated }));
});

router.get("/funds/:fundId/wallet", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  await autoCollectDuePayouts(req.params.fundId);
  const [walletRow] = await db
    .select({
      w: walletsTable,
      currencyCode: currenciesTable.code,
    })
    .from(walletsTable)
    .leftJoin(currenciesTable, eq(walletsTable.currencyId, currenciesTable.id))
    .where(eq(walletsTable.fundId, req.params.fundId))
    .limit(1);
  if (!walletRow) {
    res.status(404).json({ error: "Wallet not found" });
    return;
  }
  res.json(
    GetFundWalletResponse.parse({
      wallet: {
        id: walletRow.w.id,
        fundId: walletRow.w.fundId,
        balance: Number(walletRow.w.balance),
        currencyId: walletRow.w.currencyId,
        currencyCode: walletRow.currencyCode ?? "",
      },
    }),
  );
});

router.get("/funds/:fundId/wallet/transactions", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  await autoCollectDuePayouts(req.params.fundId);
  const [wallet] = await db
    .select()
    .from(walletsTable)
    .where(eq(walletsTable.fundId, req.params.fundId))
    .limit(1);
  if (!wallet) {
    res.status(404).json({ error: "Wallet not found" });
    return;
  }
  const txRows = await db
    .select({ t: walletTransactionsTable, u: usersTable })
    .from(walletTransactionsTable)
    .leftJoin(usersTable, eq(walletTransactionsTable.userId, usersTable.id))
    .where(eq(walletTransactionsTable.walletId, wallet.id))
    .orderBy(sql`${walletTransactionsTable.paymentDate} desc`);
  const transactions = txRows.map((row) => ({
    id: row.t.id,
    walletId: row.t.walletId,
    userId: row.t.userId,
    payoutId: row.t.payoutId,
    amount: Number(row.t.amount),
    type: row.t.type as "contribution" | "payout",
    paymentDate: row.t.paymentDate,
    userFullName: row.u?.fullName ?? null,
  }));
  res.json(ListWalletTransactionsResponse.parse({ transactions }));
});

export { autoCollectDuePayouts };
export default router;
