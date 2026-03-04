import { z } from "zod/v4";

export const createClientSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  sector: z.string().optional(),
  contact_name: z.string().optional(),
  contact_email: z.email("Invalid email").optional().or(z.literal("")),
  country: z.string().optional(),
  monthly_value: z.number().min(0, "Monthly value must be positive"),
  contract_start: z.string().min(1, "Contract start date is required"),
  contract_end: z.string().min(1, "Contract end date is required"),
  health_status: z.enum(["healthy", "at_risk", "critical"]).default("healthy"),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;

export const createProposalSchema = z.object({
  lead_id: z.string().uuid("Invalid lead ID"),
  value: z.number().min(0, "Value must be positive").optional(),
  monthly_value: z.number().min(0, "Monthly value must be positive").optional(),
  scope_summary: z.string().optional(),
  payment_terms: z.string().optional(),
  status: z.enum(["drafting", "pending_approval", "sent", "accepted", "rejected"]).default("drafting"),
});

export type CreateProposalInput = z.infer<typeof createProposalSchema>;

export const createInvoiceSchema = z.object({
  client_id: z.string().uuid("Invalid client ID"),
  amount: z.number().min(0.01, "Amount must be greater than zero"),
  due_date: z.string().min(1, "Due date is required"),
  invoice_reference: z.string().optional(),
  status: z.enum(["pending", "paid", "overdue", "disputed"]).default("pending"),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
