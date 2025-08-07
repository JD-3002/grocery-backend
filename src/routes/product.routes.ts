// routes/product.routes.ts
import { Router } from "express";
import { ProductController } from "../controllers/product.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/rbac.middleware";

const router = Router();

router.post(
  "/",
  authenticate,
  checkPermission("product", "create"),
  ProductController.createProduct
);

router.get("/", ProductController.getProducts);
router.get("/:id", ProductController.getProductById);
router.get(
  "/categories/:slug/products",
  ProductController.getProductsByCategory
);

router.patch(
  "/:id",
  authenticate,
  checkPermission("product", "update"),
  ProductController.updateProduct
);

router.delete(
  "/:id",
  authenticate,
  checkPermission("product", "delete"),
  ProductController.deleteProduct
);

export default router;
