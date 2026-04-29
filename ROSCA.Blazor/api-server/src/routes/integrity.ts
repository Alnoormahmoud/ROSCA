import { Router, type IRouter, type Request, type Response } from "express";
import { and, eq, inArray, sql } from "drizzle-orm";
import {
  db,
  usersTable,
  fundsTable,
  fundMembersTable,
  payoutsTable,
  walletTransactionsTable,
} from "@workspace/db";

const router: IRouter = Router();

export interface IntegrityProfile {
  totalRequired: number;
  totalPaid: number;
  onTimePayments: number;
  latePaymentsCount: number;
  missingPayments: number;
  commitmentRate: number;
  rawScore: number;
  level: "ممتاز" | "جيد" | "متوسط" | "ضعيف" | "خطر";
}

/**
 * Compute the integrity profile for a single user.
 *
 * Rules:
 * - totalRequired = number of payouts in funds the user belongs to,
 *   excluding payouts where the user is the recipient AND
 *   excluding payouts whose round is still in the future (status === "upcoming").
 * - totalPaid = number of contributions the user actually made.
 * - onTimePayments = contributions made on or before the payout's due date.
 * - latePaymentsCount = contributions made after the payout's due date.
 * - missingPayments = totalRequired - totalPaid.
 * - commitmentRate = totalPaid / totalRequired (0..1).
 * - rawScore = (onTime * 1.0 + late * 0.5) / max(totalRequired, 1) * 100.
 * - level: 90+ ممتاز, 75+ جيد, 55+ متوسط, 30+ ضعيف, else خطر.
 */
export async function computeIntegrityProfile(
  userId: string,
): Promise<IntegrityProfile> {
  // Find all fund memberships
  const memberships = await db
    .select({ fundId: fundMembersTable.fundId })
    .from(fundMembersTable)
    .where(eq(fundMembersTable.userId, userId));
  const fundIds = memberships.map((m) => m.fundId);

  if (fundIds.length === 0) {
    return defaultProfile();
  }

  // All payouts in those funds that are NOT recipient-self and NOT still upcoming
  const requiredPayouts = await db
    .select({
      id: payoutsTable.id,
      dueDate: payoutsTable.dueDate,
      recipientId: payoutsTable.userId,
      status: payoutsTable.status,
    })
    .from(payoutsTable)
    .where(
      and(
        inArray(payoutsTable.fundId, fundIds),
        inArray(payoutsTable.status, ["collecting", "paid", "overdue"]),
      ),
    );

  const required = requiredPayouts.filter((p) => p.recipientId !== userId);
  const totalRequired = required.length;
  if (totalRequired === 0) {
    return defaultProfile();
  }

  const requiredIds = required.map((p) => p.id);
  const dueDateById = new Map<string, string>();
  for (const p of required) dueDateById.set(p.id, p.dueDate);

  // Find all contributions this user made for these payouts
  const contribs = await db
    .select({
      payoutId: walletTransactionsTable.payoutId,
      paymentDate: walletTransactionsTable.paymentDate,
    })
    .from(walletTransactionsTable)
    .where(
      and(
        eq(walletTransactionsTable.userId, userId),
        eq(walletTransactionsTable.type, "contribution"),
        inArray(walletTransactionsTable.payoutId, requiredIds),
      ),
    );

  const totalPaid = contribs.length;
  let onTimePayments = 0;
  let latePaymentsCount = 0;

  for (const c of contribs) {
    if (!c.payoutId) continue;
    const due = dueDateById.get(c.payoutId);
    if (!due) continue;
    const dueAt = new Date(due + "T23:59:59Z").getTime();
    const paidAt = new Date(c.paymentDate).getTime();
    if (paidAt <= dueAt) onTimePayments += 1;
    else latePaymentsCount += 1;
  }

  const missingPayments = Math.max(0, totalRequired - totalPaid);
  const commitmentRate = totalPaid / totalRequired;
  const rawScore =
    ((onTimePayments * 1.0 + latePaymentsCount * 0.5) /
      Math.max(totalRequired, 1)) *
    100;

  return {
    totalRequired,
    totalPaid,
    onTimePayments,
    latePaymentsCount,
    missingPayments,
    commitmentRate: Number(commitmentRate.toFixed(3)),
    rawScore: Number(rawScore.toFixed(1)),
    level: levelFor(rawScore),
  };
}

function defaultProfile(): IntegrityProfile {
  return {
    totalRequired: 0,
    totalPaid: 0,
    onTimePayments: 0,
    latePaymentsCount: 0,
    missingPayments: 0,
    commitmentRate: 1,
    rawScore: 100,
    level: "ممتاز",
  };
}

function levelFor(score: number): IntegrityProfile["level"] {
  if (score >= 90) return "ممتاز";
  if (score >= 75) return "جيد";
  if (score >= 55) return "متوسط";
  if (score >= 30) return "ضعيف";
  return "خطر";
}

router.get("/users/:userId/integrity", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "غير مصرح" });
    return;
  }
  const [user] = await db
    .select({
      id: usersTable.id,
      fullName: usersTable.fullName,
      username: usersTable.username,
      profileImageUrl: usersTable.profileImageUrl,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(eq(usersTable.id, req.params.userId))
    .limit(1);
  if (!user) {
    res
      .status(404)
      .json({ error: "USER_NOT_FOUND", message: "المستخدم غير موجود" });
    return;
  }
  const profile = await computeIntegrityProfile(user.id);
  res.json({
    user: {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      profileImageUrl: user.profileImageUrl,
      joinedAt: user.createdAt,
    },
    integrity: profile,
  });
});

router.get("/me/integrity", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "غير مصرح" });
    return;
  }
  const profile = await computeIntegrityProfile(req.user.id);
  res.json({ integrity: profile });
});

// Suppress unused warning for `sql` if eslint is strict.
void sql;

export default router;
