import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { GetUserPublicInfoResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/users/:userId", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.params.userId))
    .limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(
    GetUserPublicInfoResponse.parse({
      user: {
        id: user.id,
        fullName: user.fullName ?? null,
        username: user.username ?? null,
        profileImageUrl: user.profileImageUrl ?? null,
        joinedAt: user.createdAt,
      },
    }),
  );
});

export default router;
