import { prisma } from '../lib/prisma';

export class DashboardService {
  async getStats(organizerId: string) {
    // Total events
    const totalEvents = await prisma.event.count({
      where: { organizerId, deletedAt: null },
    });

    // Total transactions (done)
    const transactions = await prisma.transaction.findMany({
      where: {
        event: { organizerId },
        status: 'DONE',
      },
      select: { finalAmount: true },
    });

    const totalRevenue = transactions.reduce((sum, t) => sum + t.finalAmount, 0);
    const totalTransactions = transactions.length;

    // Total attendees (dari transaction items)
    const attendees = await prisma.transactionItem.findMany({
      where: {
        transaction: {
          event: { organizerId },
          status: 'DONE',
        },
      },
      select: { quantity: true },
    });

    const totalAttendees = attendees.reduce((sum, a) => sum + a.quantity, 0);

    return {
      totalEvents,
      totalTransactions,
      totalRevenue,
      totalAttendees,
    };
  }

  async getChartData(organizerId: string, year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const transactions = await prisma.transaction.findMany({
      where: {
        event: { organizerId },
        status: 'DONE',
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { finalAmount: true, createdAt: true },
    });

    // Group by month
    const monthlyData = Array(12).fill(0);
    for (const transaction of transactions) {
      const month = new Date(transaction.createdAt).getMonth();
      monthlyData[month] += transaction.finalAmount;
    }

    return monthlyData.map((revenue, index) => ({
      month: index + 1,
      revenue,
    }));
  }

  async getAttendees(organizerId: string, eventId: string) {
    // Verify event belongs to organizer
    const event = await prisma.event.findFirst({
      where: { id: eventId, organizerId, deletedAt: null },
    });

    if (!event) {
      throw new Error('Event not found or unauthorized');
    }

    const attendees = await prisma.transactionItem.findMany({
      where: {
        transaction: {
          eventId,
          status: 'DONE',
        },
      },
      include: {
        transaction: {
          include: {
            user: {
              include: { profile: true },
            },
          },
        },
        ticketType: true,
      },
    });

    return attendees.map((item) => ({
      name: item.transaction.user.profile?.fullName || item.transaction.user.email,
      email: item.transaction.user.email,
      ticketType: item.ticketType.name,
      ticketPrice: item.ticketType.price,
      quantity: item.quantity,
      totalPrice: item.subtotal,
      purchasedAt: item.transaction.createdAt,
    }));
  }

  async getMyEvents(organizerId: string) {
    const events = await prisma.event.findMany({
      where: { organizerId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        ticketTypes: true,
        _count: {
          select: {
            transactions: {
              where: { status: 'DONE' },
            },
          },
        },
      },
    });

    return events.map((event) => {
      // Hitung range harga dari ticket types
      const prices = event.ticketTypes.map(t => t.price);
      const minPrice = prices.length ? Math.min(...prices) : 0;
      const maxPrice = prices.length ? Math.max(...prices) : 0;
      
      return {
        id: event.id,
        name: event.name,
        category: event.category,
        location: event.location,
        startDate: event.startDate,
        endDate: event.endDate,
        status: event.status,
        bannerUrl: event.bannerUrl,
        priceRange: prices.length === 1 ? `Rp ${minPrice.toLocaleString()}` : `Rp ${minPrice.toLocaleString()} - Rp ${maxPrice.toLocaleString()}`,
        ticketTypes: event.ticketTypes,
        totalSold: event._count.transactions,
      };
    });
  }

  async updateEvent(organizerId: string, eventId: string, data: any) {
    const event = await prisma.event.findFirst({
      where: { id: eventId, organizerId, deletedAt: null },
    });

    if (!event) {
      throw new Error('Event not found or unauthorized');
    }

    return prisma.event.update({
      where: { id: eventId },
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        location: data.location,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        status: data.status,
        bannerUrl: data.bannerUrl,
      },
    });
  }

  async deleteEvent(organizerId: string, eventId: string) {
    const event = await prisma.event.findFirst({
      where: { id: eventId, organizerId, deletedAt: null },
    });

    if (!event) {
      throw new Error('Event not found or unauthorized');
    }

    return prisma.event.update({
      where: { id: eventId },
      data: { deletedAt: new Date() },
    });
  }
}