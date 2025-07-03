import { Request, Response, NextFunction } from "express";
import { RBACService } from "../services/rbac.service";

export const checkPermission = (resource: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const hasPermission = await RBACService.hasPermission(
        req.user.id,
        resource,
        action
      );

      if (!hasPermission) {
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};
