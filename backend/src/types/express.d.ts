/** Augment Express Request with the authenticated user. */
import { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface UserPrincipal {
      id: string;
      email: string;
      role: Role;
    }
    interface Request {
      user?: UserPrincipal;
    }
  }
}

export {};
