import { z } from "zod";
import { adminProcedure, router } from "../trpc";
import { BusinessService } from "@/lib/services/business";
import { db } from "@/lib/db";

export const businessRouter = router({
  // Royalty
  calculateRoyalty: adminProcedure.input(z.object({ artistId: z.string(), period: z.string() })).mutation(async ({ input }) => BusinessService.calculateRoyalty(input.artistId, input.period)),
  getRoyaltyStatements: adminProcedure.input(z.object({ artistId: z.string(), period: z.string().optional() })).query(async ({ input }) => BusinessService.getRoyaltyStatement(input.artistId, input.period)),
  runMonthlyRoyalties: adminProcedure.input(z.object({ period: z.string() })).mutation(async ({ input }) => BusinessService.runMonthlyRoyalties(input.period)),
  getRoyaltyLedger: adminProcedure.query(async () => db.royaltyRecord.findMany({ include: { artist: { include: { user: { select: { name: true } } } } }, orderBy: { createdAt: "desc" }, take: 200 })),

  // Contracts
  createContract: adminProcedure.input(z.object({ artistId: z.string(), title: z.string(), type: z.string(), revenueSplit: z.number().min(0).max(100), startDate: z.string(), endDate: z.string().optional(), fileUrl: z.string().optional(), notes: z.string().optional() })).mutation(async ({ input }) => BusinessService.createContract(input)),
  getContracts: adminProcedure.query(async () => BusinessService.getAllContracts()),
  getArtistContracts: adminProcedure.input(z.string()).query(async ({ input }) => BusinessService.getArtistContracts(input)),
  updateContract: adminProcedure.input(z.object({ id: z.string(), status: z.string() })).mutation(async ({ input }) => BusinessService.updateContractStatus(input.id, input.status)),

  // Copyright
  createClaim: adminProcedure.input(z.object({ songId: z.string().optional(), claimantId: z.string(), type: z.string(), description: z.string() })).mutation(async ({ input }) => BusinessService.createCopyrightClaim(input)),
  getClaims: adminProcedure.input(z.object({ status: z.string().optional() })).query(async ({ input }) => BusinessService.getCopyrightClaims(input.status)),
  resolveClaim: adminProcedure.input(z.object({ id: z.string(), status: z.string(), notes: z.string().optional() })).mutation(async ({ input }) => BusinessService.resolveCopyrightClaim(input.id, input.status, input.notes)),

  // Labels
  createLabel: adminProcedure.input(z.object({ name: z.string(), email: z.string().email(), phone: z.string().optional(), address: z.string().optional() })).mutation(async ({ input }) => BusinessService.createLabel(input)),
  getLabels: adminProcedure.query(async () => BusinessService.getLabels()),
  assignArtistToLabel: adminProcedure.input(z.object({ artistId: z.string(), labelId: z.string() })).mutation(async ({ input }) => BusinessService.assignArtistToLabel(input.artistId, input.labelId)),

  // Finance
  getFinancialSummary: adminProcedure.input(z.object({ days: z.number().default(30) })).query(async ({ input }) => BusinessService.getFinancialSummary(input.days)),
  generateInvoice: adminProcedure.input(z.object({ userId: z.string().optional(), artistId: z.string().optional(), type: z.string(), amount: z.number(), dueDate: z.string().optional() })).mutation(async ({ input }) => BusinessService.generateInvoice(input)),
  getInvoices: adminProcedure.input(z.object({ status: z.string().optional() })).query(async ({ input }) => BusinessService.getInvoices(input.status)),

  // Tax
  getTaxRules: adminProcedure.query(async () => BusinessService.getTaxRules()),
  createTaxRule: adminProcedure.input(z.object({ region: z.string(), name: z.string(), rate: z.number(), appliesTo: z.string() })).mutation(async ({ input }) => BusinessService.createTaxRule(input)),

  // Promotions
  createPromotion: adminProcedure.input(z.object({ artistId: z.string(), type: z.string(), title: z.string(), amount: z.number(), startDate: z.string(), endDate: z.string().optional() })).mutation(async ({ input }) => BusinessService.createPromotion(input)),
  getPromotions: adminProcedure.query(async () => BusinessService.getPromotions()),

  // Support
  createTicket: adminProcedure.input(z.object({ userId: z.string(), subject: z.string(), category: z.string() })).mutation(async ({ input }) => BusinessService.createSupportTicket(input)),
  getTickets: adminProcedure.input(z.object({ status: z.string().optional() })).query(async ({ input }) => BusinessService.getSupportTickets(input.status)),
  updateTicket: adminProcedure.input(z.object({ id: z.string(), status: z.string() })).mutation(async ({ input }) => BusinessService.updateTicketStatus(input.id, input.status)),

  // Audit
  getAuditLogs: adminProcedure.query(async () => BusinessService.getAuditLogs()),
});
