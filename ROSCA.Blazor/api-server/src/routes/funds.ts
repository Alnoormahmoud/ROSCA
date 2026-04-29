import { Router, type IRouter } from "express";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  db,
  currenciesTable,
  fundsTable,
  fundMembersTable,
  payoutsTable,
  usersTable,
  walletsTable,
} from "@workspace/db";
import {
  CreateFundBody,
  DiscoverFundsResponse,
  GetFundResponse,
  JoinFundResponse,
  ListFundMembersResponse,
  ListMyFundsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function periodAdd(date: Date, periodType: string, n: number): Date {
  const d = new Date(date);
  if (periodType === "weekly") d.setDate(d.getDate() + 7 * n);
  else if (periodType === "biweekly") d.setDate(d.getDate() + 14 * n);
  else d.setMonth(d.getMonth() + n);
  return d;
}

async function loadFundSummary(fundId: string) {
  const [row] = await db
    .select({
      f: fundsTable,
      currencyCode: currenciesTable.code,
      memberCount: sql<number>`count(distinct ${fundMembersTable.id})::int`,
    })
    .from(fundsTable)
    .leftJoin(currenciesTable, eq(fundsTable.currencyId, currenciesTable.id))
    .leftJoin(fundMembersTable, eq(fundMembersTable.fundId, fundsTable.id))
    .where(eq(fundsTable.id, fundId))
    .groupBy(fundsTable.id, currenciesTable.code);
  if (!row) return null;
  return {
    id: row.f.id,
    title: row.f.title,
    description: row.f.description,
    adminId: row.f.adminId,
    shareValue: Number(row.f.shareValue),
    periodType: row.f.periodType as "weekly" | "biweekly" | "monthly",
    startDate: row.f.startDate,
    status: row.f.status as "pending" | "active" | "completed",
    totalMembers: row.f.totalMembers,
    currentMembers: Number(row.memberCount ?? 0),
    currencyCode: row.currencyCode ?? "",
    createdAt: row.f.createdAt,
  };
}

router.get("/funds", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const myMemberships = await db
    .select({ fundId: fundMembersTable.fundId })
    .from(fundMembersTable)
    .where(eq(fundMembersTable.userId, req.user.id));

  const fundIds = myMemberships.map((m) => m.fundId);
  if (fundIds.length === 0) {
    res.json(ListMyFundsResponse.parse({ funds: [] }));
    return;
  }

  const rows = await db
    .select({
      f: fundsTable,
      currencyCode: currenciesTable.code,
      memberCount: sql<number>`count(distinct ${fundMembersTable.id})::int`,
    })
    .from(fundsTable)
    .leftJoin(currenciesTable, eq(fundsTable.currencyId, currenciesTable.id))
    .leftJoin(fundMembersTable, eq(fundMembersTable.fundId, fundsTable.id))
    .where(inArray(fundsTable.id, fundIds))
    .groupBy(fundsTable.id, currenciesTable.code)
    .orderBy(desc(fundsTable.createdAt));

  const funds = rows.map((row) => ({
    id: row.f.id,
    title: row.f.title,
    description: row.f.description,
    adminId: row.f.adminId,
    shareValue: Number(row.f.shareValue),
    periodType: row.f.periodType as "weekly" | "biweekly" | "monthly",
    startDate: row.f.startDate,
    status: row.f.status as "pending" | "active" | "completed",
    totalMembers: row.f.totalMembers,
    currentMembers: Number(row.memberCount ?? 0),
    currencyCode: row.currencyCode ?? "",
    createdAt: row.f.createdAt,
  }));
  res.json(ListMyFundsResponse.parse({ funds }));
});

router.get("/funds/discover", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const myMemberships = await db
    .select({ fundId: fundMembersTable.fundId })
    .from(fundMembersTable)
    .where(eq(fundMembersTable.userId, req.user.id));
  const myFundIds = myMemberships.map((m) => m.fundId);

  const rows = await db
    .select({
      f: fundsTable,
      currencyCode: currenciesTable.code,
      memberCount: sql<number>`count(distinct ${fundMembersTable.id})::int`,
    })
    .from(fundsTable)
    .leftJoin(currenciesTable, eq(fundsTable.currencyId, currenciesTable.id))
    .leftJoin(fundMembersTable, eq(fundMembersTable.fundId, fundsTable.id))
    .where(eq(fundsTable.status, "pending"))
    .groupBy(fundsTable.id, currenciesTable.code)
    .orderBy(desc(fundsTable.createdAt));

  const funds = rows
    .filter((r) => !myFundIds.includes(r.f.id))
    .filter((r) => Number(r.memberCount ?? 0) < r.f.totalMembers)
    .map((row) => ({
      id: row.f.id,
      title: row.f.title,
      description: row.f.description,
      adminId: row.f.adminId,
      shareValue: Number(row.f.shareValue),
      periodType: row.f.periodType as "weekly" | "biweekly" | "monthly",
      startDate: row.f.startDate,
      status: row.f.status as "pending" | "active" | "completed",
      totalMembers: row.f.totalMembers,
      currentMembers: Number(row.memberCount ?? 0),
      currencyCode: row.currencyCode ?? "",
      createdAt: row.f.createdAt,
    }));
  res.json(DiscoverFundsResponse.parse({ funds }));
});

router.post("/funds", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = CreateFundBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const data = parsed.data;

  // Members and their order are FIXED at creation. The admin must appear in
  // the roster (anywhere — order is fully editable). After creation no one can
  // be added, removed, or reordered.
  const memberUserIds = data.memberUserIds;
  if (!memberUserIds.includes(req.user.id)) {
    res
      .status(400)
      .json({ error: "ADMIN_MUST_BE_MEMBER", message: "يجب أن يكون المنشئ ضمن الأعضاء" });
    return;
  }
  if (new Set(memberUserIds).size !== memberUserIds.length) {
    res
      .status(400)
      .json({ error: "DUPLICATE_MEMBERS", message: "تكرار في الأعضاء" });
    return;
  }
  const existingUsers = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(inArray(usersTable.id, memberUserIds));
  if (existingUsers.length !== memberUserIds.length) {
    res
      .status(400)
      .json({ error: "UNKNOWN_USER", message: "أحد المعرّفات غير صالح" });
    return;
  }

  const startDateStr =
    typeof data.startDate === "string"
      ? data.startDate
      : new Date(data.startDate).toISOString().slice(0, 10);

  // Date-only comparison (today vs startDate). The fund auto-starts only if
  // the start date is today or earlier; otherwise it stays "pending" (معلقة)
  // until the start date is reached.
  const todayStr = new Date().toISOString().slice(0, 10);
  const startReachedAtCreate = startDateStr <= todayStr;

  const [fund] = await db
    .insert(fundsTable)
    .values({
      title: data.title,
      description: data.description ?? null,
      adminId: req.user.id,
      shareValue: String(data.shareValue),
      periodType: data.periodType,
      startDate: startDateStr,
      currencyId: data.currencyId,
      totalMembers: memberUserIds.length,
      status: startReachedAtCreate ? "active" : "pending",
    })
    .returning();

  // Insert all members in the requested order. payoutOrder = position + 1.
  for (let i = 0; i < memberUserIds.length; i += 1) {
    await db.insert(fundMembersTable).values({
      userId: memberUserIds[i]!,
      fundId: fund.id,
      payoutOrder: i + 1,
    });
  }

  // Create wallet
  await db.insert(walletsTable).values({
    fundId: fund.id,
    balance: "0",
    currencyId: data.currencyId,
  });

  // Generate payouts. Each round's dueDate is one full period after the
  // previous (round 1 = startDate + 1 period). All rounds start as
  // "upcoming" — the FIRST round will be auto-promoted to "collecting" only
  // once today >= startDate (handled in autoCollectDuePayouts on the next
  // read of this fund).
  const startDate = new Date(startDateStr);
  const totalPot = Number(data.shareValue) * memberUserIds.length;
  for (let i = 0; i < memberUserIds.length; i += 1) {
    const dueDate = periodAdd(startDate, data.periodType, i + 1);
    await db.insert(payoutsTable).values({
      fundId: fund.id,
      userId: memberUserIds[i]!,
      roundNumber: i + 1,
      payoutOrderInRound: 1,
      amount: String(totalPot),
      dueDate: dueDate.toISOString().slice(0, 10),
      status: "upcoming",
    });
  }

  // Lazily promote round 1 if start date has already arrived.
  const { autoCollectDuePayouts } = await import("./payouts");
  await autoCollectDuePayouts(fund.id);

  const summary = await loadFundSummary(fund.id);
  res.status(201).json({ fund: summary });
});

async function loadFundDetail(fundId: string, currentUserId: string) {
  const summary = await loadFundSummary(fundId);
  if (!summary) return null;

  const memberRows = await db
    .select({
      m: fundMembersTable,
      u: usersTable,
    })
    .from(fundMembersTable)
    .leftJoin(usersTable, eq(fundMembersTable.userId, usersTable.id))
    .where(eq(fundMembersTable.fundId, fundId))
    .orderBy(fundMembersTable.payoutOrder, fundMembersTable.createdAt);

  const members = memberRows.map((row) => ({
    id: row.m.id,
    userId: row.m.userId,
    fundId: row.m.fundId,
    payoutOrder: row.m.payoutOrder,
    fullName: row.u?.fullName ?? null,
    username: row.u?.username ?? null,
    profileImageUrl: row.u?.profileImageUrl ?? null,
    createdAt: row.m.createdAt,
  }));

  const payoutRows = await db
    .select({
      p: payoutsTable,
      u: usersTable,
    })
    .from(payoutsTable)
    .leftJoin(usersTable, eq(payoutsTable.userId, usersTable.id))
    .where(eq(payoutsTable.fundId, fundId))
    .orderBy(payoutsTable.roundNumber, payoutsTable.payoutOrderInRound);

  const totalContributors = members.length;
  const payouts = await Promise.all(
    payoutRows.map(async (row) => {
      // Count contributions for this payout
      const { walletTransactionsTable } = await import("@workspace/db");
      const contribRows = await db
        .select({
          userId: walletTransactionsTable.userId,
        })
        .from(walletTransactionsTable)
        .where(
          and(
            eq(walletTransactionsTable.payoutId, row.p.id),
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
    }),
  );

  const [walletRow] = await db
    .select({
      w: walletsTable,
      currencyCode: currenciesTable.code,
    })
    .from(walletsTable)
    .leftJoin(currenciesTable, eq(walletsTable.currencyId, currenciesTable.id))
    .where(eq(walletsTable.fundId, fundId))
    .limit(1);

  const wallet = walletRow
    ? {
        id: walletRow.w.id,
        fundId: walletRow.w.fundId,
        balance: Number(walletRow.w.balance),
        currencyId: walletRow.w.currencyId,
        currencyCode: walletRow.currencyCode ?? "",
      }
    : null;

  const isMember = members.some((m) => m.userId === currentUserId);
  const isAdmin = summary.adminId === currentUserId;

  return {
    ...summary,
    members,
    payouts,
    wallet,
    isMember,
    isAdmin,
  };
}

router.get("/funds/:fundId", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  // Lazily auto-collect any past-due payouts where everyone has contributed.
  const { autoCollectDuePayouts } = await import("./payouts");
  await autoCollectDuePayouts(req.params.fundId);
  const detail = await loadFundDetail(req.params.fundId, req.user.id);
  if (!detail) {
    res.status(404).json({ error: "Fund not found" });
    return;
  }
  res.json(GetFundResponse.parse({ fund: detail }));
});

router.post("/funds/:fundId/join", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const fundId = req.params.fundId;
  const [fund] = await db.select().from(fundsTable).where(eq(fundsTable.id, fundId)).limit(1);
  if (!fund) {
    res.status(404).json({ error: "Fund not found" });
    return;
  }
  if (fund.status !== "pending") {
    res.status(400).json({ error: "Fund is not open for joining" });
    return;
  }
  const existing = await db
    .select()
    .from(fundMembersTable)
    .where(and(eq(fundMembersTable.fundId, fundId), eq(fundMembersTable.userId, req.user.id)))
    .limit(1);
  if (existing.length === 0) {
    const memberCount = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(fundMembersTable)
      .where(eq(fundMembersTable.fundId, fundId));
    if (Number(memberCount[0]?.c ?? 0) >= fund.totalMembers) {
      res.status(400).json({ error: "Fund is full" });
      return;
    }
    await db.insert(fundMembersTable).values({
      fundId,
      userId: req.user.id,
      payoutOrder: null,
    });
  }
  const detail = await loadFundDetail(fundId, req.user.id);
  res.json(JoinFundResponse.parse({ fund: detail }));
});

router.post("/funds/:fundId/leave", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const fundId = req.params.fundId;
  const [fund] = await db.select().from(fundsTable).where(eq(fundsTable.id, fundId)).limit(1);
  if (!fund) {
    res.status(404).json({ error: "Fund not found" });
    return;
  }
  if (fund.status !== "pending") {
    res.status(400).json({ error: "Cannot leave an active or completed fund" });
    return;
  }
  if (fund.adminId === req.user.id) {
    res.status(400).json({ error: "Admin cannot leave their own fund" });
    return;
  }
  await db
    .delete(fundMembersTable)
    .where(and(eq(fundMembersTable.fundId, fundId), eq(fundMembersTable.userId, req.user.id)));
  res.json({});
});

router.get("/funds/:fundId/members", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const memberRows = await db
    .select({
      m: fundMembersTable,
      u: usersTable,
    })
    .from(fundMembersTable)
    .leftJoin(usersTable, eq(fundMembersTable.userId, usersTable.id))
    .where(eq(fundMembersTable.fundId, req.params.fundId))
    .orderBy(fundMembersTable.payoutOrder, fundMembersTable.createdAt);

  const members = memberRows.map((row) => ({
    id: row.m.id,
    userId: row.m.userId,
    fundId: row.m.fundId,
    payoutOrder: row.m.payoutOrder,
    fullName: row.u?.fullName ?? null,
    username: row.u?.username ?? null,
    profileImageUrl: row.u?.profileImageUrl ?? null,
    createdAt: row.m.createdAt,
  }));
  res.json(ListFundMembersResponse.parse({ members }));
});

export default router;
export { loadFundDetail };
