import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  clearSession,
  createSession,
  getSessionId,
  SESSION_COOKIE,
  SESSION_TTL,
} from "../lib/auth";

const router: IRouter = Router();

const USERNAME_RE = /^[a-zA-Z0-9_.\-]{3,32}$/;

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

router.post("/auth/local/register", async (req: Request, res: Response) => {
  const body = req.body ?? {};
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const username =
    typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const nationalId =
    typeof body.nationalId === "string" ? body.nationalId.trim() : "";
  const bankAccount =
    typeof body.bankAccount === "string" ? body.bankAccount.trim() : "";

  if (!fullName || fullName.length < 2) {
    res
      .status(400)
      .json({ error: "INVALID_NAME", message: "الاسم الكامل مطلوب" });
    return;
  }
  if (!username || !USERNAME_RE.test(username)) {
    res.status(400).json({
      error: "INVALID_USERNAME",
      message:
        "اسم المستخدم يجب أن يكون من 3 إلى 32 حرفًا (أحرف، أرقام، _ . -)",
    });
    return;
  }
  if (!password || password.length < 6) {
    res.status(400).json({
      error: "INVALID_PASSWORD",
      message: "كلمة المرور يجب أن تكون 6 أحرف أو أكثر",
    });
    return;
  }
  if (!nationalId || nationalId.length < 4) {
    res.status(400).json({
      error: "INVALID_NATIONAL_ID",
      message: "رقم الهوية الوطنية مطلوب",
    });
    return;
  }
  if (!bankAccount || bankAccount.length < 4) {
    res.status(400).json({
      error: "INVALID_BANK_ACCOUNT",
      message: "رقم الحساب البنكي مطلوب",
    });
    return;
  }

  const existing = await db
    .select({ id: usersTable.id, username: usersTable.username })
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);

  if (existing.length > 0) {
    res
      .status(409)
      .json({ error: "USERNAME_TAKEN", message: "اسم المستخدم مستخدم بالفعل" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(usersTable)
    .values({
      username,
      fullName,
      firstName: fullName.split(" ")[0] ?? null,
      lastName: fullName.split(" ").slice(1).join(" ") || null,
      nationalId,
      bankAccount,
      passwordHash,
      // user already provided KYC info, mark onboarding as complete
      onboardingComplete: true,
    })
    .returning();

  const sid = await createSession({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
    },
    access_token: "local",
  });
  setSessionCookie(res, sid);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      username: user.username,
      profileImageUrl: user.profileImageUrl,
      onboardingComplete: user.onboardingComplete,
    },
  });
});

router.post("/auth/local/login", async (req: Request, res: Response) => {
  const body = req.body ?? {};
  const username =
    typeof body.username === "string"
      ? body.username.trim().toLowerCase()
      : typeof body.identifier === "string"
        ? body.identifier.trim().toLowerCase()
        : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!username || !password) {
    res.status(400).json({
      error: "MISSING_CREDENTIALS",
      message: "أدخل اسم المستخدم وكلمة المرور",
    });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);

  if (!user || !user.passwordHash) {
    res.status(401).json({
      error: "INVALID_CREDENTIALS",
      message: "اسم المستخدم أو كلمة المرور غير صحيحة",
    });
    return;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({
      error: "INVALID_CREDENTIALS",
      message: "اسم المستخدم أو كلمة المرور غير صحيحة",
    });
    return;
  }

  const sid = await createSession({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
    },
    access_token: "local",
  });
  setSessionCookie(res, sid);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      username: user.username,
      profileImageUrl: user.profileImageUrl,
      onboardingComplete: user.onboardingComplete,
    },
  });
});

router.post("/auth/local/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.json({ success: true });
});

export default router;
