import cron from 'node-cron';
import { prisma } from '../lib/prisma';

export const startExpiredPointsCron = () => {
  // Jalankan setiap hari jam 00:00
  cron.schedule('0 0 * * *', async () => {
    console.log('🔄 Running expired points check...');
    
    try {
      const now = new Date();
      
      // Cari poin yang sudah expired dan masih memiliki remainingAmount
      const expiredPoints = await prisma.pointsHistory.findMany({
        where: {
          expiresAt: { lt: now },
          remainingAmount: { gt: 0 },
          type: 'CREDIT',
        },
      });
      
      if (expiredPoints.length === 0) {
        console.log('✅ No expired points found');
        return;
      }
      
      // Proses setiap expired point
      for (const point of expiredPoints) {
        await prisma.$transaction(async (tx) => {
          // 1. Kurangi points user
          await tx.user.update({
            where: { id: point.userId },
            data: { points: { decrement: point.remainingAmount! } },
          });
          
          // 2. Update remainingAmount menjadi 0
          await tx.pointsHistory.update({
            where: { id: point.id },
            data: { remainingAmount: 0 },
          });
          
          // 3. Catat history debit (EXPIRED)
          await tx.pointsHistory.create({
            data: {
              userId: point.userId,
              amount: point.remainingAmount!,
              type: 'DEBIT',
              source: 'EXPIRED',
              referenceType: 'POINTS_EXPIRATION',
              referenceId: point.id,
            },
          });
        });
        
        console.log(`✅ Expired ${point.remainingAmount} points for user ${point.userId}`);
      }
    } catch (error) {
      console.error('❌ Error checking expired points:', error);
    }
  });
};