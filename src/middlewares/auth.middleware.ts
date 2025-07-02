import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { AppDataSource } from "../data-source";
import { User } from "../entities/user.entity";

// Extend the Request interface
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const userRepository = AppDataSource.getRepository(User);

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      res.status(401).json({ message: "Access token missing" });
    }

    const decoded = verifyAccessToken(accessToken);
    const user = await userRepository.findOne({
      where: { id: decoded.userId },
      select: ["id", "firstName", "lastName", "email", "avatar"],
    });

    if (!user) {
      res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Invalid access token" });
  }
};
