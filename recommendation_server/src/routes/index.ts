
import express from "express";
import authRouter from "@/routes/auth";
import productRouter from "@/routes/product";
import categoryRouter from "@/routes/category";
import cartRouter from "@/routes/cart";
import orderRouter from "@/routes/order";
import reviewRouter from "@/routes/review";
import adminRouter from "@/routes/admin";
import recommendationRouter from "@/routes/recommendation";
import notificationRouter from "@/routes/notification";
import wishlistRouter from "@/routes/wishlist";
import navigationRouter from "@/routes/navigation";

const router = express.Router();
const API_V1 = "/api/v1";

router.use(`${API_V1}/auth`, authRouter);
router.use(`${API_V1}/products`, productRouter);
router.use(`${API_V1}/categories`, categoryRouter);
router.use(`${API_V1}/cart`, cartRouter);
router.use(`${API_V1}/orders`, orderRouter);
router.use(`${API_V1}/reviews`, reviewRouter);
router.use(`${API_V1}/admin`, adminRouter);
router.use(`${API_V1}/recommendations`, recommendationRouter);
router.use(`${API_V1}/notifications`, notificationRouter);
router.use(`${API_V1}/wishlists`, wishlistRouter);
router.use(`${API_V1}/navigation`, navigationRouter);

export default router;
