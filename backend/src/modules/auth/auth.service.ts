/** Authentication business logic. */
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  JwtPayload,
} from "../../utils/jwt";

const SALT_ROUNDS = 10;

function toPublicUser(user: { id: string; name: string; email: string; role: Role }) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

async function issueTokens(payload: JwtPayload) {
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  // Persist a hash of the refresh token so it can be revoked / rotated.
  const refreshHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: payload.sub },
    data: { refreshToken: refreshHash },
  });
  return { accessToken, refreshToken };
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
  role?: Role;
}) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw AppError.conflict("An account with this email already exists");

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role ?? Role.WAREHOUSE_STAFF,
    },
  });

  const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
  const tokens = await issueTokens(payload);
  return { user: toPublicUser(user), ...tokens };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) throw AppError.unauthorized("Invalid credentials");

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw AppError.unauthorized("Invalid credentials");

  const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
  const tokens = await issueTokens(payload);
  return { user: toPublicUser(user), ...tokens };
}

export async function refresh(refreshToken: string) {
  let payload: JwtPayload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw AppError.unauthorized("Invalid or expired refresh token");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.refreshToken) throw AppError.unauthorized("Session no longer valid");

  const matches = await bcrypt.compare(refreshToken, user.refreshToken);
  if (!matches) throw AppError.unauthorized("Refresh token has been revoked");

  const newPayload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
  const tokens = await issueTokens(newPayload); // rotation
  return { user: toPublicUser(user), ...tokens };
}

export async function logout(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.notFound("User not found");
  return toPublicUser(user);
}
