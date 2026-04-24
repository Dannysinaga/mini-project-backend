import { prisma } from "../lib/prisma";

export class PointsService {
  async getPointsBalance(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        points: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async getPointsHistory(userId: string) {
    const pointsHistory = await prisma.pointsHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Hitung ringkasan
    const totalCredits = pointsHistory
      .filter(p => p.type === 'CREDIT')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const totalDebits = pointsHistory
      .filter(p => p.type === 'DEBIT')
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      history: pointsHistory,
      summary: {
        totalPoints: await this.getPointsBalance(userId).then(u => u.points),
        totalCredits,
        totalDebits,
        activeCredits: pointsHistory.filter(p => 
          p.type === 'CREDIT' && (!p.expiresAt || p.expiresAt > new Date())
        ).reduce((sum, p) => sum + (p.remainingAmount || p.amount), 0),
      },
    };
  }
}