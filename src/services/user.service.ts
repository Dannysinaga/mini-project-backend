import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import { UpdateProfileDTOType } from "../dtos/user/profile.dto";
import { ChangePasswordDTOType } from "../dtos/user/change-password.dto";

export class UserService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async updateProfile(userId: string, data: UpdateProfileDTOType) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const profile = await prisma.profile.upsert({
      where: { userId },
      update: {
        fullName: data.fullname,
        phone: data.phone,
        bio: data.bio,
        photoUrl: data.photoUrl,
      },
      create: {
        userId,
        fullName: data.fullname,
        phone: data.phone,
        bio: data.bio,
        photoUrl: data.photoUrl,
      },
    });

    return profile;
  }

  async changePassword(userId: string, data: ChangePasswordDTOType) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const isMatch = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new Error("Current password is incorrect");
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword,
      },
    });

    return true;
  }
}