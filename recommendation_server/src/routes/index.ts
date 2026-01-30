
import express from "express";
import authRouter from "@/routes/auth";
import productRouter from "@/routes/product";
import categoryRouter from "@/routes/category";
import cartRouter from "@/routes/cart";
import orderRouter from "@/routes/order";
import reviewRouter from "@/routes/review";

const router = express.Router();
const API_V1 = "/api/v1";

router.use(`${API_V1}/auth`, authRouter);
router.use(`${API_V1}/products`, productRouter);
router.use(`${API_V1}/categories`, categoryRouter);
router.use(`${API_V1}/cart`, cartRouter);
router.use(`${API_V1}/orders`, orderRouter);
router.use(`${API_V1}/reviews`, reviewRouter);

export default router;
