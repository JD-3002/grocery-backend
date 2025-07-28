import express from "express";
import cookieParser from "cookie-parser";
import * as dotenv from "dotenv";
import { AppDataSource } from "./data-source";
import { AuthController } from "./controllers/auth.controller";
import { authenticate } from "./middlewares/auth.middleware";
import { RBACController } from "./controllers/rbac.controller";
import { checkPermission } from "./middlewares/rbac.middleware";
import { ProductController } from "./controllers/product.controller";

import multer from "multer";
import { CategoryController } from "./controllers/category.controller";

const upload = multer({ dest: "uploads/" });

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

//User-auth Routes
app.post("/api/auth/register", AuthController.register);
app.post("/api/auth/login", AuthController.login);
app.post("/api/auth/logout", AuthController.logout);
app.post("/api/auth/refresh-token", AuthController.refreshToken);
app.post(
  "/api/auth/request-password-reset",
  AuthController.requestPasswordReset
);
app.post("/api/auth/reset-password", AuthController.resetPassword);

// Add RBAC routes (protected by admin role)
app.post(
  "/api/rbac/roles",
  authenticate,
  checkPermission("role", "create"),
  RBACController.createRole
);
app.get(
  "/api/rbac/roles",
  authenticate,
  checkPermission("role", "read"),
  RBACController.getRoles
);
app.post(
  "/api/rbac/permissions",
  authenticate,
  checkPermission("permission", "create"),
  RBACController.createPermission
);
app.get(
  "/api/rbac/permissions",
  authenticate,
  checkPermission("permission", "read"),
  RBACController.getPermissions
);
app.post(
  "/api/rbac/assign-role",
  authenticate,
  checkPermission("user-role", "create"),
  RBACController.assignRoleToUser
);
app.get(
  "/api/rbac/users/:userId/roles",
  authenticate,
  checkPermission("user-role", "read"),
  RBACController.getUserRoles
);
app.post(
  "/api/rbac/assign-permission",
  authenticate,
  checkPermission("role-permission", "create"),
  RBACController.assignPermissionToRole
);
app.get(
  "/api/rbac/roles/:roleId/permissions",
  authenticate,
  checkPermission("role-permission", "read"),
  RBACController.getRolePermissions
);

// Protected route example
app.get("/api/auth/me", authenticate, (req, res) => {
  res.json({ user: req.user });
});

// Example protected route with RBAC
app.get(
  "/api/admin/dashboard",
  authenticate,
  checkPermission("dashboard", "read"),
  (req, res) => {
    res.json({ message: "Welcome to admin dashboard" });
  }
);

// Configure multer for file uploads

// Product Routes
app.post(
  "/api/products",
  authenticate,
  checkPermission("product", "create"),
  ProductController.createProduct
);

app.get("/api/products", ProductController.getProducts);
app.get("/api/products/:id", ProductController.getProductById);
app.get(
  "/api/categories/:slug/products",
  ProductController.getProductsByCategory
);

app.put(
  "/api/products/:id",
  authenticate,
  checkPermission("product", "update"),
  ProductController.updateProduct
);

app.delete(
  "/api/products/:id",
  authenticate,
  checkPermission("product", "delete"),
  ProductController.deleteProduct
);

// Image upload route
// app.post(
//   "/api/products/upload-image",
//   authenticate,
//   checkPermission("product", "update"),
//   upload.single("image"),
//   ProductController.uploadImage
// );

// Category Routes
app.post(
  "/api/categories",
  authenticate,
  checkPermission("category", "create"),
  CategoryController.createCategory
);

app.get("/api/categories", CategoryController.getCategories);
app.get("/api/categories/:slug", CategoryController.getCategoryBySlug);

app.put(
  "/api/categories/:id",
  authenticate,
  checkPermission("category", "update"),
  CategoryController.updateCategory
);

app.delete(
  "/api/categories/:id",
  authenticate,
  checkPermission("category", "delete"),
  CategoryController.deleteCategory
);

// Initialize database and start server
AppDataSource.initialize()
  .then(() => {
    console.log("Database connected");
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed", error);
  });

export default app;
