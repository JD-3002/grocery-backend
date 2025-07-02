import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/user.entity";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";

import * as bcrypt from "bcryptjs";
import { sendPasswordResetOtp } from "../utils/email";
import { cleartokens, setTokens } from "../utils/helper";

//accessing user entity in our database
const userRepository = AppDataSource.getRepository(User);

//Auth controllers

export const AuthController = {
  //object function for registering User
  register: async (req: Request, res: Response): Promise<void> => {
    try {
      const { firstName, lastName, email, password } = req.body;

      //finding of email in the database
      const existingUser = await userRepository.findOne({ where: { email } });
      if (existingUser) {
        res.status(400).json({
          message: "Email already exist",
        });
        return;
      }

      // defining the data to be added in user entity of the database
      const user = new User();
      user.firstName = firstName;
      user.lastName = lastName;
      user.email = email;
      user.password = password; // This will be hashed by @BeforeInsert

      const userData = await userRepository.save(user);

      const { accessToken, refreshToken } = setTokens(res, user.id, user.email);

      res.status(201).json({
        user: userData,
        accessToken: accessToken,
        refreshToken: refreshToken,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  },

  //object function for Login User
  login: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      // Find user without explicitly selecting fields to ensure password is included
      const user = await userRepository.findOne({
        where: { email },
        select: [
          "id",
          "firstName",
          "lastName",
          "email",
          "password",
          "refreshToken",
          "avatar",
        ], // Include all needed fields
      });

      if (!user) {
        res.status(401).json({
          message: "Invalid Credentials",
        });
        return;
      }

      // Use the comparePassword method from the entity
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        res.status(401).json({
          message: "Invalid Credentials",
        });
        return;
      }

      const { accessToken, refreshToken } = setTokens(res, user.id, user.email);

      user.refreshToken = refreshToken;
      await userRepository.save(user);

      // Return user data without sensitive information
      const userResponse = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar,
      };

      res.status(200).json({
        user: userResponse,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        message: "Internal Server Error",
      });
    }
  },

  //object function for logout User
  logout: async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.cookies;
      if (refreshToken) {
        const decoded = verifyRefreshToken(refreshToken);
        const user = await userRepository.findOne({
          where: {
            id: decoded.userId,
          },
        });

        if (user) {
          user.refreshToken = null;
          await userRepository.save(user);
        }
      }

      cleartokens(res);
      res.status(200).json({
        // Changed from 201 to 200 for logout
        message: "Logout successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal Server Error",
      });
    }
  },

  //object function for refreshToken
  refreshToken: async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.cookies;
      if (!refreshToken) {
        res.status(400).json({
          message: "Refresh token missing",
        });
        return;
      }

      const decoded = verifyRefreshToken(refreshToken);
      const user = await userRepository.findOne({
        where: {
          id: decoded.userId,
        },
      });
      if (!user || user.refreshToken !== refreshToken) {
        res.status(400).json({
          message: "Invalid Refresh token",
        });
        return;
      }

      const { accessToken, refreshToken: newRefreshToken } = setTokens(
        res,
        user.id,
        user.email
      );

      //updating of refreshing token in database
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

  requestPasswordReset: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      const user = await userRepository.findOne({ where: { email } });
      if (!user) {
        res.status(400).json({
          message: "User not found or email is invalid",
        });
        return;
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit OTP
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

      user.resetPasswordOtp = otp;
      user.resetPasswordOtpExpiry = otpExpiry;
      await userRepository.save(user);

      await sendPasswordResetOtp(email, otp);

      res.status(200).json({
        message: "Password reset otp sent to your registered email",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal Server Error",
      });
    }
  },

  resetPassword: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, otp, newPassword } = req.body;
      const user = await userRepository.findOne({
        where: { email },
        select: [
          "id",
          "email",
          "password",
          "resetPasswordOtp",
          "resetPasswordOtpExpiry",
        ],
      });
      if (!user) {
        res.status(404).json({
          message: "User not found",
        });
        return;
      }

      if (
        !user.resetPasswordOtp ||
        user.resetPasswordOtp !== otp ||
        !user.resetPasswordOtpExpiry ||
        user.resetPasswordOtpExpiry < new Date()
      ) {
        res.status(400).json({ message: "Invalid or expired OTP" });
        return;
      }

      // Use setPassword method to ensure proper hashing
      user.setPassword(newPassword);
      user.resetPasswordOtp = null;
      user.resetPasswordOtpExpiry = null;
      await userRepository.save(user);

      res.status(200).json({
        message: "Password Reset Successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  },
};
