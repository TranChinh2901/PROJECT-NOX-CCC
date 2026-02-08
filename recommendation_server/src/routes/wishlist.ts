import express from "express";
import { WishlistController } from "../modules/wishlist/presentation/controller/wishlist.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";

const router = express.Router();
const controller = new WishlistController();

router.use(authMiddleware());

router.get("/", controller.list);
router.post("/", controller.create);
router.get("/:id", controller.get);
router.delete("/:id", controller.delete);

router.post("/items", controller.add);
router.put("/items/:id", controller.updateItem);
router.delete("/items/:id", controller.remove);
router.get("/check/:variantId", controller.check);

export default router;
