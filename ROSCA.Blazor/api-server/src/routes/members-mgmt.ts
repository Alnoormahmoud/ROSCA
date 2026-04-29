import { Router, type IRouter, type Request, type Response } from "express";
import { ilike } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

const router: IRouter = Router();

// Search users by username for the "add member" picker shown only during
// fund creation. Members and their payout order are LOCKED once the fund is
// created — there are no add/remove/reorder endpoints by design.
router.get("/users/search", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "غير مصرح" });
    return;
  }
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (q.length < 2) {
    res.json({ users: [] });
    return;
  }
  const rows = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      fullName: usersTable.fullName,
      profileImageUrl: usersTable.profileImageUrl,
    })
    .from(usersTable)
    .where(ilike(usersTable.username, `%${q.toLowerCase()}%`))
    .limit(10);
  res.json({
    users: rows.map((r) => ({
      id: r.id,
      username: r.username ?? "",
      fullName: r.fullName ?? "",
      profileImageUrl: r.profileImageUrl ?? null,
    })),
  });
});

// Defensive 410 stubs: any legacy client still calling these gets a clear,
// localized error so the lock-at-creation rule is enforced server-side.
function membersLockedHandler(_req: Request, res: Response) {
  res.status(410).json({
    error: "MEMBERS_LOCKED",
    message:
      "تم تثبيت الأعضاء وترتيبهم عند إنشاء الصندوق ولا يمكن تعديلهم لاحقًا.",
  });
}

router.post("/funds/:fundId/add-member", membersLockedHandler);
router.post("/funds/:fundId/reorder-members", membersLockedHandler);

export default router;
