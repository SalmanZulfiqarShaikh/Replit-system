import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import checkinRouter from "./checkin";
import pomodoroRouter from "./pomodoro";
import progressRouter from "./progress";
import aiRouter from "./ai";
import userRouter from "./user";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(checkinRouter);
router.use(pomodoroRouter);
router.use(progressRouter);
router.use(aiRouter);
router.use(userRouter);

export default router;
