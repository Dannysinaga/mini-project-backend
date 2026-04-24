import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { generateReferralCode } from "../utils/referral";
import { MailService } from "./mail.service";
import { ERROR_MESSAGES, JWT_CONFIG } from "../constants/constants";
import { RegisterDTOType } from "../dtos/auth/register.dto";
import { LoginDTOType } from "../dtos/auth/login.dto";

const mailService = new MailService();

export class AuthService {
  async register(data: RegisterDTOType) {
    const { email, password, fullname, phone, referralCode } = data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error(ERROR_MESSAGES.EMAIL_EXISTS);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userReferralCode = generateReferralCode(fullname || "USER");

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        referralCode: userReferralCode,
        profile: {
          create: {
            fullName: fullname || null,
            phone: phone || null,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    if (referralCode) {
      await this.handleReferral(referralCode, user.id);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: JWT_CONFIG.EXPIRES_IN }
    );

    return { token, user };
  }

  async login(data: LoginDTOType) {
    const { email, password } = data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: JWT_CONFIG.EXPIRES_IN }
    );

    return { token, user };
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    await mailService.sendResetPasswordEmail(user.email, resetLink);

    return true;
  }

  async resetPassword(token: string, newPassword: string) {
    const passwordReset = await prisma.passwordReset.findUnique({
      where: { token },
    });

    if (!passwordReset) {
      throw new Error("Invalid reset token");
    }

    if (passwordReset.usedAt) {
      throw new Error("Reset token already used");
    }

    if (passwordReset.expiresAt < new Date()) {
      throw new Error("Reset token has expired");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: passwordReset.userId },
        data: { passwordHash: hashedPassword },
      });

      await tx.passwordReset.update({
        where: { id: passwordReset.id },
        data: { usedAt: new Date() },
      });
    });

    return true;
  }

  private async handleReferral(referralCode: string, newUserId: string) {
    const referrer = await prisma.user.findUnique({
      where: { referralCode },
    });

    if (!referrer) return;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: referrer.id },
        data: { points: { increment: 10000 } },
      });

      const validUntil = new Date();
      validUntil.setMonth(validUntil.getMonth() + 3);

      const coupon = await tx.coupon.create({
        data: {
          code: `WELCOME${Date.now()}`,
          discountAmount: 20000,
          validUntil,
          userId: newUserId,
        },
      });

      await tx.referralUsage.create({
        data: {
          referrerId: referrer.id,
          referredUserId: newUserId,
          couponId: coupon.id,
        },
      });

      await tx.pointsHistory.create({
        data: {
          userId: referrer.id,
          amount: 10000,
          type: "CREDIT",
          source: "REFERRAL_REWARD",
          referenceType: "REFERRAL_USAGE",
          referenceId: coupon.id,
          expiresAt: validUntil,
        },
      });
    });
  }
}