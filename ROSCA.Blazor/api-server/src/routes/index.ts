import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import localAuthRouter from "./local-auth";
import profileRouter from "./profile";
import currenciesRouter from "./currencies";
import fundsRouter from "./funds";
import payoutsRouter from "./payouts";
import dashboardRouter from "./dashboard";
import usersRouter from "./users";
import membersMgmtRouter from "./members-mgmt";
import integrityRouter from "./integrity";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(localAuthRouter);
router.use(profileRouter);
router.use(currenciesRouter);
router.use(fundsRouter);
router.use(payoutsRouter);
router.use(dashboardRouter);
// membersMgmtRouter must be mounted BEFORE usersRouter — the latter has a
// catch-all GET /users/:userId that would shadow GET /users/search.
router.use(membersMgmtRouter);
router.use(integrityRouter);
router.use(usersRouter);

export default router;
