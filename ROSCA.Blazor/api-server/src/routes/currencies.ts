import { Router, type IRouter } from "express";
import { db, currenciesTable } from "@workspace/db";
import { ListCurrenciesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/currencies", async (_req, res) => {
  const rows = await db.select().from(currenciesTable).orderBy(currenciesTable.code);
  res.json(ListCurrenciesResponse.parse({ currencies: rows }));
});

export default router;
