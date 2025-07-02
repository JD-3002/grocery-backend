import express from "express";
import cookieParser from "cookie-parser";
import * as dotenv from "dotenv";
import { AppDataSource } from "./data-source";
import { AuthController } from "./controllers/auth.controller";
import { authenticate } from "./middlewares/auth.middleware";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
app.post("/api/auth/register", AuthController.register);
app.post("/api/auth/login", AuthController.login);
app.post("/api/auth/logout", AuthController.logout);
app.post("/api/auth/refresh-token", AuthController.refreshToken);
app.post(
  "/api/auth/request-password-reset",
  AuthController.requestPasswordReset
);
app.post("/api/auth/reset-password", AuthController.resetPassword);

// Protected route example
app.get("/api/auth/me", authenticate, (req, res) => {
  res.json({ user: req.user });
});

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
