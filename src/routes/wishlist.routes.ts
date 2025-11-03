import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { WishlistController } from "../controllers/wishlist.controller";

const router = Router();

// Wishlist routes
router.get("/", authenticate, WishlistController.getWishlist);
router.post("/:item", authenticate, WishlistController.addItemByParam);
router.delete("/items/:itemId", authenticate, WishlistController.removeItem);
router.delete("/", authenticate, WishlistController.clearWishlist);

export default router;
