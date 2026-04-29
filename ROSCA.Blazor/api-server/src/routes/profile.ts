import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  GetMyProfileResponse,
  UpdateMyProfileBody,
  UpdateMyProfileResponse,
  CompleteOnboardingResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function loadProfile(userId: string) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? null,
    fullName: user.fullName ?? null,
    username: user.username ?? null,
    nationalId: user.nationalId ?? null,
    bankAccount: user.bankAccount ?? null,
    profileImageUrl: user.profileImageUrl ?? null,
    onboardingComplete: user.onboardingComplete,
    createdAt: user.createdAt,
  };
}

router.get("/profile", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const profile = await loadProfile(req.user.id);
  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  res.json(GetMyProfileResponse.parse({ profile }));
});

router.put("/profile", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = UpdateMyProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const updates: Record<string, unknown> = {};
  if (parsed.data.fullName !== undefined) updates.fullName = parsed.data.fullName;
  if (parsed.data.username !== undefined) updates.username = parsed.data.username;
  if (parsed.data.nationalId !== undefined) updates.nationalId = parsed.data.nationalId;
  if (parsed.data.bankAccount !== undefined) updates.bankAccount = parsed.data.bankAccount;
  updates.updatedAt = new Date();

  await db.update(usersTable).set(updates).where(eq(usersTable.id, req.user.id));

  const profile = await loadProfile(req.user.id);
  res.json(UpdateMyProfileResponse.parse({ profile }));
});

router.post("/profile/onboarding-complete", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  await db
    .update(usersTable)
    .set({ onboardingComplete: true, updatedAt: new Date() })
    .where(eq(usersTable.id, req.user.id));
  const profile = await loadProfile(req.user.id);
  res.json(CompleteOnboardingResponse.parse({ profile }));
});

export default router;
