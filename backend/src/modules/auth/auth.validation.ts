import { z } from "zod";
import { Role } from "@prisma/client";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("A valid email is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128),
    // Only Admins may set a role at registration (enforced in the route).
    role: z.nativeEnum(Role).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("A valid email is required"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10, "refreshToken is required"),
  }),
});
