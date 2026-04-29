import { sql } from "drizzle-orm";
import { db, pool } from "./index";
import {
  currenciesTable,
  fundsTable,
  fundMembersTable,
  payoutsTable,
  usersTable,
  walletsTable,
  walletTransactionsTable,
} from "./schema";

const SEED_PREFIX = "seed-";

const CURRENCIES = ["USD", "EUR", "EGP", "SAR", "AED", "GBP"];

// bcrypt hash of "password123" (cost 10). Every seed user shares this password
// so testers can log in with any seeded username. Display the password to the
// user in the seed log so it's discoverable.
const SEED_PASSWORD_PLAINTEXT = "password123";
const SEED_PASSWORD_HASH =
  "$2b$10$4rSeJMc/JJEP33cRSvaZweR3bl03jzNkS6rXaUuQdLYNTyEDVRYRi";

const SEED_USERS = [
  { id: SEED_PREFIX + "u01", first: "Layla", last: "Hassan", username: "layla.h", emailDomain: "example.com", img: "https://i.pravatar.cc/200?img=1" },
  { id: SEED_PREFIX + "u02", first: "Omar", last: "El Sayed", username: "omar.es", emailDomain: "example.com", img: "https://i.pravatar.cc/200?img=2" },
  { id: SEED_PREFIX + "u03", first: "Fatima", last: "Khalid", username: "fatima.k", emailDomain: "example.com", img: "https://i.pravatar.cc/200?img=3" },
  { id: SEED_PREFIX + "u04", first: "Yousef", last: "Ahmed", username: "yousef.a", emailDomain: "example.com", img: "https://i.pravatar.cc/200?img=4" },
  { id: SEED_PREFIX + "u05", first: "Noura", last: "Al Mansoori", username: "noura.m", emailDomain: "example.com", img: "https://i.pravatar.cc/200?img=5" },
  { id: SEED_PREFIX + "u06", first: "Ali", last: "Rahman", username: "ali.r", emailDomain: "example.com", img: "https://i.pravatar.cc/200?img=6" },
  { id: SEED_PREFIX + "u07", first: "Mariam", last: "Saeed", username: "mariam.s", emailDomain: "example.com", img: "https://i.pravatar.cc/200?img=7" },
  { id: SEED_PREFIX + "u08", first: "Hassan", last: "Mostafa", username: "hassan.m", emailDomain: "example.com", img: "https://i.pravatar.cc/200?img=8" },
  { id: SEED_PREFIX + "u09", first: "Aisha", last: "Bakr", username: "aisha.b", emailDomain: "example.com", img: "https://i.pravatar.cc/200?img=9" },
  { id: SEED_PREFIX + "u10", first: "Karim", last: "Naguib", username: "karim.n", emailDomain: "example.com", img: "https://i.pravatar.cc/200?img=10" },
  { id: SEED_PREFIX + "u11", first: "Salma", last: "Tarek", username: "salma.t", emailDomain: "example.com", img: "https://i.pravatar.cc/200?img=11" },
  { id: SEED_PREFIX + "u12", first: "Mohammed", last: "Aziz", username: "mohammed.a", emailDomain: "example.com", img: "https://i.pravatar.cc/200?img=12" },
];

function periodAdd(date: Date, periodType: string, n: number): Date {
  const d = new Date(date);
  if (periodType === "weekly") d.setDate(d.getDate() + 7 * n);
  else if (periodType === "biweekly") d.setDate(d.getDate() + 14 * n);
  else d.setMonth(d.getMonth() + n);
  return d;
}

async function clearSeed() {
  console.log("Clearing previous seed data…");
  // Delete funds whose admin is one of our seed users — cascade clears members/payouts/wallets/txns
  await db.execute(sql`DELETE FROM funds WHERE admin_id LIKE ${SEED_PREFIX + "%"}`);
  // Delete the seed users themselves (cascade on memberships)
  await db.execute(sql`DELETE FROM users WHERE id LIKE ${SEED_PREFIX + "%"}`);
}

async function seedCurrencies() {
  console.log("Seeding currencies…");
  for (const code of CURRENCIES) {
    await db
      .insert(currenciesTable)
      .values({ code })
      .onConflictDoNothing({ target: currenciesTable.code });
  }
  const rows = await db.select().from(currenciesTable);
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.code, r.id);
  return map;
}

async function seedUsers() {
  console.log(`Seeding ${SEED_USERS.length} users…`);
  for (let i = 0; i < SEED_USERS.length; i++) {
    const u = SEED_USERS[i];
    const nationalId = `1${String(1000000000 + i * 13).padStart(9, "0")}`;
    const bankAccount = `SA${String(2200000000 + i * 7).padStart(20, "0")}`;
    await db
      .insert(usersTable)
      .values({
        id: u.id,
        email: `${u.username}@${u.emailDomain}`,
        firstName: u.first,
        lastName: u.last,
        fullName: `${u.first} ${u.last}`,
        username: u.username,
        profileImageUrl: u.img,
        passwordHash: SEED_PASSWORD_HASH,
        nationalId,
        bankAccount,
        onboardingComplete: true,
      })
      .onConflictDoNothing({ target: usersTable.id });
  }
  console.log(
    `   → All seeded users share password: "${SEED_PASSWORD_PLAINTEXT}"`,
  );
}

interface FundSpec {
  title: string;
  description: string;
  shareValue: number;
  periodType: "weekly" | "biweekly" | "monthly";
  totalMembers: number;
  currencyCode: string;
  status: "pending" | "active" | "completed";
  adminIdx: number;
  memberIdxs: number[];
  startDateOffsetDays: number;
  contributedRoundsForActive?: number;
  paidRoundsForActive?: number;
}

async function seedFunds(currencyIds: Map<string, number>) {
  const specs: FundSpec[] = [
    {
      title: "Family Monthly Saver",
      description: "Our trusted family savings circle. We've been at it for years.",
      shareValue: 500,
      periodType: "monthly",
      totalMembers: 6,
      currencyCode: "USD",
      status: "active",
      adminIdx: 0,
      memberIdxs: [0, 1, 2, 3, 4, 5],
      startDateOffsetDays: -90,
      contributedRoundsForActive: 2,
      paidRoundsForActive: 1,
    },
    {
      title: "Office Coffee Club",
      description: "Coworkers saving together for that big year-end trip.",
      shareValue: 100,
      periodType: "weekly",
      totalMembers: 5,
      currencyCode: "USD",
      status: "active",
      adminIdx: 6,
      memberIdxs: [6, 7, 8, 9, 10],
      startDateOffsetDays: -28,
      contributedRoundsForActive: 3,
      paidRoundsForActive: 2,
    },
    {
      title: "Wedding Fund 2026",
      description: "Helping our friend save for the big day. 8 months, monthly contributions.",
      shareValue: 1000,
      periodType: "monthly",
      totalMembers: 8,
      currencyCode: "EGP",
      status: "active",
      adminIdx: 2,
      memberIdxs: [2, 0, 5, 7, 3, 8, 11, 1],
      startDateOffsetDays: -60,
      contributedRoundsForActive: 1,
      paidRoundsForActive: 1,
    },
    {
      title: "School Supplies Pool",
      description: "Quick biweekly group ahead of back-to-school season.",
      shareValue: 200,
      periodType: "biweekly",
      totalMembers: 4,
      currencyCode: "SAR",
      status: "completed",
      adminIdx: 4,
      memberIdxs: [4, 8, 11, 9],
      startDateOffsetDays: -120,
    },
    {
      title: "Neighborhood Savers",
      description: "Open group looking for two more trustworthy savers from our area.",
      shareValue: 250,
      periodType: "monthly",
      totalMembers: 6,
      currencyCode: "USD",
      status: "pending",
      adminIdx: 8,
      memberIdxs: [8, 10, 11, 0],
      startDateOffsetDays: 7,
    },
    {
      title: "Tech Bros Quarterly",
      description: "Engineers pooling for shared workspace gear. Open spots available.",
      shareValue: 750,
      periodType: "monthly",
      totalMembers: 5,
      currencyCode: "EUR",
      status: "pending",
      adminIdx: 9,
      memberIdxs: [9, 6],
      startDateOffsetDays: 14,
    },
    {
      title: "Ladies Saving Circle",
      description: "Closed group of close friends, biweekly rounds.",
      shareValue: 300,
      periodType: "biweekly",
      totalMembers: 5,
      currencyCode: "AED",
      status: "pending",
      adminIdx: 5,
      memberIdxs: [5, 2, 7],
      startDateOffsetDays: 3,
    },
  ];

  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i];
    const currencyId = currencyIds.get(spec.currencyCode)!;
    const fundId = SEED_PREFIX + "f" + String(i + 1).padStart(2, "0");
    const adminUserId = SEED_USERS[spec.adminIdx].id;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + spec.startDateOffsetDays);
    const startDateStr = startDate.toISOString().slice(0, 10);

    console.log(`  ✓ Fund ${i + 1}/${specs.length}: ${spec.title} (${spec.status})`);

    await db.insert(fundsTable).values({
      id: fundId,
      title: spec.title,
      description: spec.description,
      adminId: adminUserId,
      shareValue: String(spec.shareValue),
      periodType: spec.periodType,
      startDate: startDateStr,
      currencyId,
      totalMembers: spec.totalMembers,
      status: spec.status,
    });

    // Insert members
    const memberRows: { id: string; userId: string; payoutOrder: number | null }[] = [];
    for (let m = 0; m < spec.memberIdxs.length; m++) {
      const userId = SEED_USERS[spec.memberIdxs[m]].id;
      const memberId = SEED_PREFIX + "m" + String(i + 1).padStart(2, "0") + "-" + String(m + 1).padStart(2, "0");
      const payoutOrder = spec.status === "pending" ? null : m + 1;
      memberRows.push({ id: memberId, userId, payoutOrder });
      await db.insert(fundMembersTable).values({
        id: memberId,
        userId,
        fundId,
        payoutOrder,
      });
    }

    // Wallet
    const walletId = SEED_PREFIX + "w" + String(i + 1).padStart(2, "0");
    await db.insert(walletsTable).values({
      id: walletId,
      fundId,
      currencyId,
      balance: "0",
    });

    // Payouts + transactions for active/completed
    if (spec.status === "active" || spec.status === "completed") {
      const totalPot = spec.shareValue * spec.totalMembers;
      let walletBalance = 0;

      for (let r = 0; r < spec.memberIdxs.length; r++) {
        const recipientUserId = SEED_USERS[spec.memberIdxs[r]].id;
        const dueDate = periodAdd(startDate, spec.periodType, r);
        const payoutId = SEED_PREFIX + "p" + String(i + 1).padStart(2, "0") + "-" + String(r + 1).padStart(2, "0");

        let payoutStatus: "upcoming" | "collecting" | "paid" = "upcoming";
        let collectionDate: Date | null = null;

        if (spec.status === "completed") {
          payoutStatus = "paid";
          collectionDate = new Date(dueDate);
        } else {
          const paidRounds = spec.paidRoundsForActive ?? 0;
          const contribRounds = spec.contributedRoundsForActive ?? paidRounds;
          if (r < paidRounds) {
            payoutStatus = "paid";
            collectionDate = new Date(dueDate);
          } else if (r < contribRounds) {
            payoutStatus = "collecting";
          } else {
            payoutStatus = "upcoming";
          }
        }

        await db.insert(payoutsTable).values({
          id: payoutId,
          fundId,
          userId: recipientUserId,
          roundNumber: r + 1,
          payoutOrderInRound: 1,
          amount: String(totalPot),
          dueDate: dueDate.toISOString().slice(0, 10),
          collectionDate,
          status: payoutStatus,
        });

        // Generate contribution transactions for paid + collecting rounds
        if (payoutStatus === "paid" || payoutStatus === "collecting") {
          const contributors = spec.memberIdxs.filter((idx) => SEED_USERS[idx].id !== recipientUserId);

          // For collecting rounds (not yet paid), simulate partial contributions
          let actualContributors = contributors;
          if (payoutStatus === "collecting" && spec.status === "active") {
            // Make ~60-80% have contributed
            const cutoff = Math.max(1, Math.floor(contributors.length * 0.7));
            actualContributors = contributors.slice(0, cutoff);
          }

          for (let c = 0; c < actualContributors.length; c++) {
            const contribUserId = SEED_USERS[actualContributors[c]].id;
            const txId = SEED_PREFIX + "tx" + String(i + 1).padStart(2, "0") + "-" + String(r + 1).padStart(2, "0") + "-" + String(c + 1).padStart(2, "0");
            const paymentDate = new Date(dueDate);
            paymentDate.setDate(paymentDate.getDate() - 2 + c);
            await db.insert(walletTransactionsTable).values({
              id: txId,
              walletId,
              userId: contribUserId,
              payoutId,
              amount: String(spec.shareValue),
              type: "contribution",
              paymentDate,
            });
            walletBalance += spec.shareValue;
          }

          // If paid, add the payout transaction (recipient collects)
          if (payoutStatus === "paid") {
            const collectTxId = SEED_PREFIX + "tx" + String(i + 1).padStart(2, "0") + "-" + String(r + 1).padStart(2, "0") + "-collect";
            await db.insert(walletTransactionsTable).values({
              id: collectTxId,
              walletId,
              userId: recipientUserId,
              payoutId,
              amount: String(totalPot),
              type: "payout",
              paymentDate: collectionDate!,
            });
            walletBalance = Math.max(0, walletBalance - totalPot);
          }
        }
      }

      // Update wallet balance
      await db
        .update(walletsTable)
        .set({ balance: String(walletBalance) })
        .where(sql`${walletsTable.id} = ${walletId}`);
    }
  }
}

async function main() {
  console.log("=== Money Saver Seed ===");
  await clearSeed();
  const currencyIds = await seedCurrencies();
  await seedUsers();
  await seedFunds(currencyIds);
  console.log("✅ Seed complete.");
  console.log("\nLogin with any seeded username, e.g.:");
  for (const u of SEED_USERS.slice(0, 4)) {
    console.log(`  username: ${u.username}   password: ${SEED_PASSWORD_PLAINTEXT}`);
  }
  await pool.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
