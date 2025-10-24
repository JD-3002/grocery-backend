// app.ts
import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import rbacRoutes from "./routes/rbac.routes";
import productRoutes from "./routes/product.routes";
import categoryRoutes from "./routes/category.routes";
import cartRoutes from "./routes/cart.routes";
import orderRoutes from "./routes/order.routes";
import paymentRoutes from "./routes/payment.routes";
import { authenticate } from "./middlewares/auth.middleware";
import { checkPermission } from "./middlewares/rbac.middleware";

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/rbac", rbacRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);

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

export default app;
