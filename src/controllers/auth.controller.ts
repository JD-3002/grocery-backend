import { NextFunction, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/user.entity";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import * as bcrypt from "bcryptjs";
import { sendPasswordResetOtp } from "../utils/email";
import { clearTokens, setTokens } from "../utils/helper";
import { validate } from "class-validator";

const userRepository = AppDataSource.getRepository(User);

export const AuthController = {
  register: async (req: Request, res: Response) => {
    try {
      const { username, firstname, lastname, email, phone, password } =
        req.body;

      // Check if username or email already exists
      const existingUser = await userRepository.findOne({
        where: [{ username }, { email }, { phone }],
      });

      if (existingUser) {
        res.status(400).json({
          message: "Username, email or phone number already in use",
        });
      }

      // Create a plain object for validation
      const userData = {
        username,
        firstname,
        lastname,
        email,
        phone,
        password,
      };

      // Validate only the input data
      const errors = await validate(userData, {
        skipMissingProperties: false,
        validationError: { target: false },
      });

      if (errors.length > 0) {
        res.status(400).json({ errors });
      }

      // Create user entity after validation
      const user = new User();
      user.userRole = "user";
      user.avatar = "";
      user.username = username;
      user.firstname = firstname;
      user.lastname = lastname;
      user.email = email;
      user.phone = phone;
      user.setPassword(password);

      await userRepository.save(user);

      // Return user data without sensitive information
      const { password: _, refreshToken, ...userResponse } = user;

      res.status(201).json(userResponse);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      const user = await userRepository.findOne({
        where: { email },
        select: [
          "id",
          "firstname",
          "lastname",
          "email",
          "password",
          "refreshToken",
          "avatar",
          "userRole",
        ],
      });

      if (!user) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }

      const { accessToken, refreshToken } = setTokens(res, user.id, user.email);

      user.refreshToken = refreshToken;
      await userRepository.save(user);

      res.status(200).json({
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        avatar: user.avatar,
        userRole: user.userRole,
      });
    } catch (error) {
      next(error); // Pass errors to Express error handler
    }
  },

  logout: async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.cookies;
      if (refreshToken) {
        const decoded = verifyRefreshToken(refreshToken);
        const user = await userRepository.findOne({
          where: { id: decoded.userId },
        });

        if (user) {
          user.refreshToken = null;
          await userRepository.save(user);
        }
      }

      clearTokens(res);
      res.status(200).json({
        message: "Logged out successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  },

  refreshToken: async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.cookies;
      if (!refreshToken) {
        res.status(400).json({
          message: "Refresh token missing",
        });
      }

      const decoded = verifyRefreshToken(refreshToken);
      const user = await userRepository.findOne({
        where: { id: decoded.userId },
      });

      if (!user || user.refreshToken !== refreshToken) {
        res.status(400).json({
          message: "Invalid refresh token",
        });
      }

      const { accessToken, refreshToken: newRefreshToken } = setTokens(
        res,
        user.id,
        user.email
      );

      user.refreshToken = newRefreshToken;
      await userRepository.save(user);

      res.status(200).json({
        accessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  },

  requestPasswordReset: async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      const user = await userRepository.findOne({ where: { email } });
      if (!user) {
        res.status(400).json({
          message: "If this email exists, we've sent a reset link",
        });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      user.resetPasswordOtp = otp;
      user.resetPasswordOtpExpiry = otpExpiry;
      await userRepository.save(user);

      await sendPasswordResetOtp(email, otp);

      res.status(200).json({
        message: "Password reset OTP sent to your email",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  },

  resetPassword: async (req: Request, res: Response) => {
    try {
      const { email, otp, newPassword } = req.body;
      const user = await userRepository.findOne({
        where: { email },
      });

      if (!user) {
        res.status(404).json({
          message: "User not found",
        });
      }

      if (
        !user.resetPasswordOtp ||
        user.resetPasswordOtp !== otp ||
        !user.resetPasswordOtpExpiry ||
        user.resetPasswordOtpExpiry < new Date()
      ) {
        res.status(400).json({
          message: "Invalid or expired OTP",
        });
      }

      user.setPassword(newPassword);
      user.resetPasswordOtp = null;
      user.resetPasswordOtpExpiry = null;
      user.refreshToken = null;

      await userRepository.save(user);

      res.status(200).json({
        message: "Password reset successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  },

  getAllUsers: async (req: Request, res: Response) => {
    try {
      const users = await userRepository.find({
        select: [
          "id",
          "firstname",
          "lastname",
          "email",
          "avatar",
          "userRole",
          "createdAt",
          "updatedAt",
        ],
        order: {
          createdAt: "DESC",
        },
      });

      res.status(200).json(users);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  },

  getUserById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      //  Input validation: Check if ID is provided
      if (!id) {
        res.status(400).json({
          message: "User ID is required",
        });
      }

      // Input validation: Check if ID is valid UUID format (if using UUID)
      // Uncomment the following lines if using UUID:
      // const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      // if (!uuidRegex.test(id)) {
      //   return res.status(400).json({
      //     message: "Invalid user ID format",
      //   });
      // }

      //  Find user by ID with selected fields only (excluding sensitive data)
      const user = await userRepository.findOne({
        where: { id },
        select: [
          "id",
          "username",
          "firstname",
          "lastname",
          "email",
          "phone",
          "avatar",
          "userRole",
          "createdAt",
          "updatedAt",
        ],
      });

      // 🔥 Handle user not found
      if (!user) {
        res.status(404).json({
          message: "User not found",
        });
      }

      // 🔥 Return user data (already filtered through select clause)
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  },
};
