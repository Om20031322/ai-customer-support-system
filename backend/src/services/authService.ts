import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { AuthProvider, Role, User } from "@prisma/client";
import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import { prisma } from "../prisma/client";

type AuthPayload = {
  email?: unknown;
  password?: unknown;
};

type RegisterPayload = AuthPayload & {
  name?: unknown;
};

type GoogleLoginPayload = {
  credential?: unknown;
  idToken?: unknown;
};

type ForgotPasswordPayload = {
  email?: unknown;
};

type ResetPasswordPayload = {
  token?: unknown;
  newPassword?: unknown;
};

const RESET_TOKEN_EXPIRY_MINUTES = 15;

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true
} as const;

const googleClient = new OAuth2Client(env.googleClientId);

export async function registerUser(payload: RegisterPayload) {
  const data = validateRegisterPayload(payload);

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (existingUser) {
    throw new AppError("A user with this email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      provider: AuthProvider.LOCAL,
      role: Role.USER
    },
    select: publicUserSelect
  });

  return {
    user,
    token: signToken(user)
  };
}

export async function loginUser(payload: AuthPayload) {
  const data = validateLoginPayload(payload);

  const user = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (!user || user.provider !== AuthProvider.LOCAL || !user.passwordHash) {
    throw new AppError("Invalid email or password", 401);
  }

  const passwordMatches = await bcrypt.compare(data.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError("Invalid email or password", 401);
  }

  const publicUser = toPublicUser(user);

  return {
    user: publicUser,
    token: signToken(publicUser)
  };
}

export async function loginWithGoogle(payload: GoogleLoginPayload) {
  const idToken = validateGoogleLoginPayload(payload);
  const googleProfile = await verifyGoogleToken(idToken);

  const existingUser = await prisma.user.findUnique({
    where: { email: googleProfile.email }
  });

  let user;

  if (existingUser) {
    user = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        googleId: googleProfile.googleId,
        provider: existingUser.provider === AuthProvider.LOCAL ? AuthProvider.LOCAL : AuthProvider.GOOGLE
      },
      select: publicUserSelect
    });
  } else {
    user = await prisma.user.create({
      data: {
        name: googleProfile.name,
        email: googleProfile.email,
        googleId: googleProfile.googleId,
        provider: AuthProvider.GOOGLE,
        role: Role.USER
      },
      select: publicUserSelect
    });
  }

  return {
    user,
    token: signToken(user)
  };
}

export async function requestPasswordReset(payload: ForgotPasswordPayload) {
  const email = validateForgotPasswordPayload(payload);

  if (!email) {
    return {
      message: "If this email exists, reset instructions have been sent."
    };
  }

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (user?.provider === AuthProvider.LOCAL && user.passwordHash) {
    const plainToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = hashResetToken(plainToken);
    const expires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: expires
      }
    });

    const resetLink = `${env.frontendUrl}/reset-password?token=${encodeURIComponent(plainToken)}`;
    console.log(`[Auth] Password reset link for ${user.email}: ${resetLink}`);
  }

  return {
    message: "If this email exists, reset instructions have been sent."
  };
}

export async function resetPassword(payload: ResetPasswordPayload) {
  const data = validateResetPasswordPayload(payload);
  const hashedToken = hashResetToken(data.token);

  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: {
        gt: new Date()
      },
      provider: AuthProvider.LOCAL
    }
  });

  if (!user) {
    throw new AppError("Invalid or expired password reset token", 400);
  }

  const passwordHash = await bcrypt.hash(data.newPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordExpires: null
    }
  });

  return {
    message: "Password reset successfully."
  };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect
  });

  if (!user) {
    throw new AppError("Authenticated user no longer exists", 401);
  }

  return user;
}

function validateGoogleLoginPayload(payload: GoogleLoginPayload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new AppError("Request body must be a JSON object", 400);
  }

  const token = payload.credential ?? payload.idToken;

  if (!isNonEmptyString(token)) {
    throw new AppError("credential or idToken is required", 400);
  }

  return token.trim();
}

async function verifyGoogleToken(idToken: string) {
  if (!env.googleClientId) {
    throw new AppError("Google login is not configured", 503);
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.googleClientId
    });

    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      throw new AppError("Invalid Google account token", 401);
    }

    return {
      googleId: payload.sub,
      email: payload.email.trim().toLowerCase(),
      name: payload.name?.trim() || payload.email.split("@")[0]
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    console.error("[Google Auth] Token verification failed:", error);
    throw new AppError("Invalid Google account token", 401);
  }
}

function validateForgotPasswordPayload(payload: ForgotPasswordPayload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new AppError("Request body must be a JSON object", 400);
  }

  if (!isNonEmptyString(payload.email) || !isValidEmail(payload.email)) {
    return "";
  }

  return payload.email.trim().toLowerCase();
}

function validateResetPasswordPayload(payload: ResetPasswordPayload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new AppError("Request body must be a JSON object", 400);
  }

  if (!isNonEmptyString(payload.token)) {
    throw new AppError("token is required", 400);
  }

  if (!isNonEmptyString(payload.newPassword)) {
    throw new AppError("newPassword is required", 400);
  }

  if (payload.newPassword.trim().length < 8) {
    throw new AppError("newPassword must be at least 8 characters", 400);
  }

  return {
    token: payload.token.trim(),
    newPassword: payload.newPassword
  };
}

function hashResetToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function validateRegisterPayload(payload: RegisterPayload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new AppError("Request body must be a JSON object", 400);
  }

  if (!isNonEmptyString(payload.name)) {
    throw new AppError("name is required", 400);
  }

  const loginData = validateLoginPayload(payload);

  return {
    ...loginData,
    name: payload.name.trim()
  };
}

function validateLoginPayload(payload: AuthPayload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new AppError("Request body must be a JSON object", 400);
  }

  if (!isNonEmptyString(payload.email)) {
    throw new AppError("email is required", 400);
  }

  if (!isValidEmail(payload.email)) {
    throw new AppError("email must be a valid email address", 400);
  }

  if (!isNonEmptyString(payload.password)) {
    throw new AppError("password is required", 400);
  }

  if (payload.password.trim().length < 8) {
    throw new AppError("password must be at least 8 characters", 400);
  }

  return {
    email: payload.email.trim().toLowerCase(),
    password: payload.password
  };
}

function signToken(user: { id: string; email: string; name: string; role: Role }) {
  return jwt.sign(
    {
      email: user.email,
      name: user.name,
      role: user.role
    },
    env.jwtSecret,
    {
      subject: user.id,
      expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"]
    }
  );
}

function toPublicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}