import { sql } from 'drizzle-orm';
import { integer, text, sqliteTable, real } from 'drizzle-orm/sqlite-core';

export const invoices = sqliteTable('invoices', {
  id: text('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull(),
  status: text('status', { enum: ['draft', 'open', 'paid', 'overdue', 'canceled'] }).notNull().default('draft'),
  issueDate: text('issue_date').notNull(),
  dueDate: text('due_date'),
  subtotal: real('subtotal').notNull().default(0),
  tax: real('tax').notNull().default(0),
  total: real('total').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  
  // JSON fields for complex data
  customer: text('customer').notNull(), // JSON string
  company: text('company').notNull(), // JSON string
  lineItems: text('line_items').notNull(), // JSON string
  notes: text('notes'),
  invoiceTitle: text('invoice_title').notNull().default('Invoice'),
  footerMessage: text('footer_message'),
  template: text('template').notNull().default('default'),
  
  // Tiptap editor content
  noteBlocks: text('note_blocks'), // JSON string for Tiptap content
  
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const customers = sqliteTable('customers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  postalCode: text('postal_code'),
  country: text('country'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const companyProfiles = sqliteTable('company_profiles', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  postalCode: text('postal_code'),
  country: text('country'),
  logo: text('logo'), // Base64 encoded logo
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type CompanyProfile = typeof companyProfiles.$inferSelect;
export type NewCompanyProfile = typeof companyProfiles.$inferInsert;
