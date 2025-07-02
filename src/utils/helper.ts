import { generateAccessToken, generateRefreshToken } from "./jwt";
import { Response } from "express";
import * as dotenv from "dotenv";

dotenv.config();

export const setTokens = (res: Response, userId: string, email: string) => {
  const accessToken = generateAccessToken({ userId, email });
  const refreshToken = generateRefreshToken({ userId, email });

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  return { accessToken, refreshToken };
};

export const cleartokens = (res: Response) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
};
