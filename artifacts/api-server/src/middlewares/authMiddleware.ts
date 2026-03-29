import { type Request, type Response, type NextFunction } from "express";
import type { AuthUser } from "@workspace/api-zod";

declare global {
  namespace Express {
    interface User extends AuthUser {}

    interface Request {
      isAuthenticated(): this is AuthedRequest;
      user?: User | undefined;
    }

    export interface AuthedRequest {
      user: User;
    }
  }
}

const SALMAN: AuthUser = {
  id: "salman-001",
  email: "ss3000569@gmail.com",
  firstName: "Salman",
  lastName: "Zulfiqar",
  profileImageUrl: null,
};

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  req.isAuthenticated = function (this: Request) {
    return this.user != null;
  } as Request["isAuthenticated"];

  req.user = SALMAN;
  next();
}
