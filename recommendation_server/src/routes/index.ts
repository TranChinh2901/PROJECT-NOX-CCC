
import express from "express";

// import userRouter from "@/routes/user";
import authRouter from "@/routes/auth";


const router = express.Router();
const API_V1 = "/api/v1";

router.use(`${API_V1}/auth`, authRouter);


export default router;
