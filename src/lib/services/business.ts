import { db } from "../db";

export const BusinessService = {
  // === ROYALTY MANAGEMENT ===
  async calculateRoyalty(artistId: string, period: string) {
    const [year, month] = period.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const contract = await db.contract.findFirst({
      where: { artistId, status: "active" },
      orderBy: { createdAt: "desc" },
    });

    const revenuePct = contract?.revenueSplit || 70;

    const [streams, downloads, revenueRecords] = await Promise.all([
      db.stream.count({ where: { song: { artistId }, revenueEligible: true, createdAt: { gte: startDate, lte: endDate } } }),
      db.download.count({ where: { song: { artistId }, createdAt: { gte: startDate, lte: endDate } } }),
      db.revenueRecord.findMany({ where: { artistId, createdAt: { gte: startDate, lte: endDate } } }),
    ]);

    const grossRevenue = revenueRecords.reduce((sum, r) => sum + r.grossAmount, 0);
    const artistShare = Math.floor((grossRevenue * revenuePct) / 100);
    const platformShare = grossRevenue - artistShare;

    const royalty = await db.royaltyRecord.create({
      data: {
        artistId,
        contractId: contract?.id,
        source: "streaming",
        period,
        streamCount: streams,
        downloadCount: downloads,
        grossRevenue,
        artistShare,
        platformShare,
        netPayout: artistShare,
        status: "pending",
      },
    });

    return royalty;
  },

  async getRoyaltyStatement(artistId: string, period?: string) {
    const where: any = { artistId };
    if (period) where.period = period;
    return db.royaltyRecord.findMany({ where, orderBy: { createdAt: "desc" }, take: 24 });
  },

  async runMonthlyRoyalties(period: string) {
    const artists = await db.artist.findMany({ select: { id: true } });
    const results = [];
    for (const a of artists) {
      const record = await this.calculateRoyalty(a.id, period);
      results.push(record);
    }
    return { processed: results.length, period };
  },

  // === CONTRACT MANAGEMENT ===
  async createContract(data: { artistId: string; title: string; type: string; revenueSplit: number; startDate: string; endDate?: string; fileUrl?: string; notes?: string }) {
    return db.contract.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: "active",
      },
    });
  },

  async getArtistContracts(artistId: string) {
    return db.contract.findMany({ where: { artistId }, orderBy: { createdAt: "desc" } });
  },

  async getAllContracts() {
    return db.contract.findMany({ include: { artist: { include: { user: { select: { name: true } } } } }, orderBy: { createdAt: "desc" }, take: 100 });
  },

  async updateContractStatus(id: string, status: string) {
    return db.contract.update({ where: { id }, data: { status } });
  },

  // === COPYRIGHT CENTER ===
  async createCopyrightClaim(data: { songId?: string; claimantId: string; type: string; description: string }) {
    return db.copyrightClaim.create({ data });
  },

  async getCopyrightClaims(status?: string) {
    const where: any = {};
    if (status) where.status = status;
    return db.copyrightClaim.findMany({ where, include: { song: { select: { title: true } }, claimant: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
  },

  async resolveCopyrightClaim(id: string, status: string, notes?: string) {
    return db.copyrightClaim.update({ where: { id }, data: { status, notes, resolvedAt: status === "resolved" ? new Date() : null } });
  },

  // === LABEL MANAGEMENT ===
  async createLabel(data: { name: string; email: string; phone?: string; address?: string }) {
    return db.label.create({ data });
  },

  async getLabels() {
    return db.label.findMany({ include: { artists: { include: { user: { select: { name: true } } } } }, orderBy: { createdAt: "desc" } });
  },

  async assignArtistToLabel(artistId: string, labelId: string) {
    return db.artist.update({ where: { id: artistId }, data: { labelId } });
  },

  // === FINANCE ===
  async getFinancialSummary(days: number) {
    const since = new Date(); since.setDate(since.getDate() - days);
    const [revenue, payouts, invoices, taxes] = await Promise.all([
      db.revenueRecord.aggregate({ where: { createdAt: { gte: since } }, _sum: { grossAmount: true } }),
      db.payout.aggregate({ where: { createdAt: { gte: since } }, _sum: { amount: true } }),
      db.invoice.count({ where: { createdAt: { gte: since } } }),
      db.revenueRecord.aggregate({ where: { createdAt: { gte: since } }, _sum: { platformShare: true } }),
    ]);

    return {
      totalRevenue: revenue._sum.grossAmount || 0,
      totalPayouts: payouts._sum.amount || 0,
      platformEarnings: taxes._sum.platformShare || 0,
      invoiceCount: invoices,
      period: days,
    };
  },

  async generateInvoice(data: { userId?: string; artistId?: string; type: string; amount: number; dueDate?: string }) {
    const taxRate = 0.18; // 18% VAT default
    const taxAmount = Math.floor(data.amount * taxRate);
    return db.invoice.create({
      data: {
        ...data,
        taxAmount,
        totalAmount: data.amount + taxAmount,
        dueDate: data.dueDate ? new Date(data.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        reference: `INV-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      },
    });
  },

  async getInvoices(status?: string) {
    const where: any = {};
    if (status) where.status = status;
    return db.invoice.findMany({ where, include: { user: { select: { name: true, email: true } }, artist: { include: { user: { select: { name: true } } } } }, orderBy: { createdAt: "desc" }, take: 100 });
  },

  // === TAX MANAGEMENT ===
  async getTaxRules() {
    return db.taxRule.findMany({ where: { active: true } });
  },

  async createTaxRule(data: { region: string; name: string; rate: number; appliesTo: string }) {
    return db.taxRule.create({ data });
  },

  // === PROMOTIONS ===
  async createPromotion(data: { artistId: string; type: string; title: string; amount: number; startDate: string; endDate?: string }) {
    return db.promotion.create({ data: { ...data, startDate: new Date(data.startDate), endDate: data.endDate ? new Date(data.endDate) : null } });
  },

  async getPromotions() {
    return db.promotion.findMany({ include: { artist: { include: { user: { select: { name: true } } } } }, orderBy: { createdAt: "desc" }, take: 100 });
  },

  // === SUPPORT ===
  async createSupportTicket(data: { userId: string; subject: string; category: string }) {
    return db.supportTicket.create({ data: { ...data, messages: JSON.stringify([{ author: "user", message: data.subject, timestamp: new Date().toISOString() }]) } });
  },

  async getSupportTickets(status?: string) {
    const where: any = {};
    if (status) where.status = status;
    return db.supportTicket.findMany({ where, include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
  },

  async updateTicketStatus(id: string, status: string) {
    return db.supportTicket.update({ where: { id }, data: { status } });
  },

  // === AUDIT LOGS ===
  async logAction(userId: string, action: string, details?: string, ipAddress?: string) {
    return db.auditLog.create({ data: { userId, action, details, ipAddress } });
  },

  async getAuditLogs(limit = 100) {
    return db.auditLog.findMany({ include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, take: limit });
  },
};
