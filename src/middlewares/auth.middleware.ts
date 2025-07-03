import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { AppDataSource } from "../data-source";
import { User } from "../entities/user.entity";
import { RBACService } from "../services/rbac.service";

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
) => {
  try {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      return res.status(401).json({ message: "Access token missing" });
    }

    const decoded = verifyAccessToken(accessToken);
    const user = await userRepository.findOne({
      where: { id: decoded.userId },
      select: ["id", "firstName", "lastName", "email", "avatar"],
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Get user roles and permissions
    const userRoles = await RBACService.getUserRoles(user.id);
    const permissions = await RBACService.getUserPermissions(user.id);

    req.user = {
      ...user,
      roles: userRoles.map((ur) => ur.role),
      permissions: permissions,
    };

    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: "Invalid access token" });
  }
};
