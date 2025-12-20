import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const adminUsers = sqliteTable('admin_users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  permissions: text('permissions'), // JSON array of permission strings
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
});

export const magicLinkTokens = sqliteTable('magic_link_tokens', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  usedAt: integer('used_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => adminUsers.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const jobs = sqliteTable('jobs', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  location: text('location').notNull().default('Remote'),
  department: text('department').notNull(),
  description: text('description').notNull(),
  salaryRange: text('salary_range'),
  requirements: text('requirements'), // JSON array
  responsibilities: text('responsibilities'), // JSON array
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  viewCount: integer('view_count').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const applications = sqliteTable('applications', {
  id: text('id').primaryKey(),
  jobId: text('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  resumePath: text('resume_path'),
  coverLetter: text('cover_letter'),
  goodAt: text('good_at'), // For general applications
  status: text('status').notNull().default('new'), // new, reviewing, interviewed, offered, rejected, hired
  source: text('source').default('website'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const applicationNotes = sqliteTable('application_notes', {
  id: text('id').primaryKey(),
  applicationId: text('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
  adminUserId: text('admin_user_id').notNull().references(() => adminUsers.id),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const analyticsEvents = sqliteTable('analytics_events', {
  id: text('id').primaryKey(),
  eventType: text('event_type').notNull(), // page_view, job_view, application_start, application_submit
  jobId: text('job_id').references(() => jobs.id),
  metadata: text('metadata'), // JSON
  ipHash: text('ip_hash'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Email templates for applicant communication
export const emailTemplates = sqliteTable('email_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(), // e.g., 'rejection', 'interview_invite'
  subject: text('subject').notNull(),
  body: text('body').notNull(), // HTML content with placeholders
  triggerStatus: text('trigger_status'), // Auto-suggest when status changes to this
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Sent email history for tracking
export const sentEmails = sqliteTable('sent_emails', {
  id: text('id').primaryKey(),
  applicationId: text('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
  adminUserId: text('admin_user_id').notNull().references(() => adminUsers.id),
  templateId: text('template_id').references(() => emailTemplates.id), // null if custom email
  recipientEmail: text('recipient_email').notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(), // Final rendered HTML
  status: text('status').notNull().default('pending'), // pending, sent, failed
  messageId: text('message_id'), // Microsoft Graph message ID
  errorMessage: text('error_message'), // Error details if failed
  sentAt: integer('sent_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Received emails from applicants (synced from mailbox)
export const receivedEmails = sqliteTable('received_emails', {
  id: text('id').primaryKey(),
  applicationId: text('application_id').references(() => applications.id, { onDelete: 'cascade' }), // null if not matched
  graphMessageId: text('graph_message_id').notNull().unique(), // Microsoft Graph message ID for deduplication
  conversationId: text('conversation_id'), // Graph conversation ID for threading
  fromEmail: text('from_email').notNull(),
  fromName: text('from_name'),
  subject: text('subject').notNull(),
  bodyPreview: text('body_preview'), // Short preview
  body: text('body').notNull(), // Full HTML body
  receivedAt: integer('received_at', { mode: 'timestamp' }).notNull(),
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false), // Read in admin panel
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// ==================== EMPLOYEE MANAGEMENT ====================

export const employees = sqliteTable('employees', {
  id: text('id').primaryKey(),
  // Link to original application (nullable - not all employees come from applications)
  applicationId: text('application_id').references(() => applications.id, { onDelete: 'set null' }),

  // Basic Info
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),

  // Employment Info
  department: text('department').notNull(),
  role: text('role').notNull(), // Job title
  jobId: text('job_id').references(() => jobs.id, { onDelete: 'set null' }), // Original job they were hired for
  hireDate: integer('hire_date', { mode: 'timestamp' }).notNull(),

  // Compensation (stored as JSON for flexibility)
  salary: text('salary'), // JSON: { amount: number, currency: string, frequency: 'hourly'|'annual' }
  benefits: text('benefits'), // JSON array of benefit objects

  // Contact Info
  address: text('address'), // JSON: { street, city, state, zip, country }
  emergencyContact: text('emergency_contact'), // JSON: { name, relationship, phone, email }

  // Status
  status: text('status').notNull().default('active'), // active, on_leave, terminated
  terminationDate: integer('termination_date', { mode: 'timestamp' }),
  terminationReason: text('termination_reason'),

  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  createdBy: text('created_by').references(() => adminUsers.id),
});

export const employeeDocuments = sqliteTable('employee_documents', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),

  // Document Info
  name: text('name').notNull(), // Display name
  type: text('type').notNull(), // contract, id_document, tax_form, certification, other
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size'), // bytes
  mimeType: text('mime_type'),

  // Metadata
  description: text('description'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }), // For certifications, IDs
  uploadedBy: text('uploaded_by').notNull().references(() => adminUsers.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const employeeNotes = sqliteTable('employee_notes', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  adminUserId: text('admin_user_id').notNull().references(() => adminUsers.id),

  content: text('content').notNull(),
  category: text('category').default('general'), // general, performance, feedback, hr

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

export const employeeActivityLog = sqliteTable('employee_activity_log', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  adminUserId: text('admin_user_id').notNull().references(() => adminUsers.id),

  action: text('action').notNull(), // created, updated, status_changed, document_uploaded, document_deleted, note_added, email_sent
  field: text('field'), // Which field was changed (for updates)
  previousValue: text('previous_value'), // JSON for complex values
  newValue: text('new_value'), // JSON for complex values
  metadata: text('metadata'), // Additional context as JSON

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const employeeSentEmails = sqliteTable('employee_sent_emails', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  adminUserId: text('admin_user_id').notNull().references(() => adminUsers.id),
  templateId: text('template_id').references(() => emailTemplates.id),

  recipientEmail: text('recipient_email').notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  status: text('status').notNull().default('pending'), // pending, sent, failed
  messageId: text('message_id'),
  errorMessage: text('error_message'),
  sentAt: integer('sent_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Type exports for use in the application
export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;
export type MagicLinkToken = typeof magicLinkTokens.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
export type ApplicationNote = typeof applicationNotes.$inferSelect;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type NewEmailTemplate = typeof emailTemplates.$inferInsert;
export type SentEmail = typeof sentEmails.$inferSelect;
export type NewSentEmail = typeof sentEmails.$inferInsert;
export type ReceivedEmail = typeof receivedEmails.$inferSelect;
export type NewReceivedEmail = typeof receivedEmails.$inferInsert;

// Employee Management Types
export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
export type EmployeeDocument = typeof employeeDocuments.$inferSelect;
export type NewEmployeeDocument = typeof employeeDocuments.$inferInsert;
export type EmployeeNote = typeof employeeNotes.$inferSelect;
export type NewEmployeeNote = typeof employeeNotes.$inferInsert;
export type EmployeeActivityLog = typeof employeeActivityLog.$inferSelect;
export type NewEmployeeActivityLog = typeof employeeActivityLog.$inferInsert;
export type EmployeeSentEmail = typeof employeeSentEmails.$inferSelect;
export type NewEmployeeSentEmail = typeof employeeSentEmails.$inferInsert;

// ==================== SALES LEAD CRM ====================

export const salesLeads = sqliteTable('sales_leads', {
  id: text('id').primaryKey(),

  // Company & Contact Info
  companyName: text('company_name').notNull(),
  contactName: text('contact_name').notNull(),
  contactEmail: text('contact_email').notNull(),
  contactPhone: text('contact_phone'),

  // Pipeline
  stage: text('stage').notNull().default('new'), // new, contacted, qualified, proposal, negotiation, won, lost
  estimatedValue: integer('estimated_value'), // in cents for precision
  currency: text('currency').default('USD'),

  // Source & Assignment
  source: text('source'), // website, referral, cold_call, linkedin, etc.
  assignedTo: text('assigned_to').references(() => adminUsers.id, { onDelete: 'set null' }),

  // Won/Lost tracking
  wonDate: integer('won_date', { mode: 'timestamp' }),
  lostDate: integer('lost_date', { mode: 'timestamp' }),
  lostReason: text('lost_reason'),

  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  createdBy: text('created_by').references(() => adminUsers.id),
});

export const salesLeadNotes = sqliteTable('sales_lead_notes', {
  id: text('id').primaryKey(),
  leadId: text('lead_id').notNull().references(() => salesLeads.id, { onDelete: 'cascade' }),
  adminUserId: text('admin_user_id').notNull().references(() => adminUsers.id),

  content: text('content').notNull(),
  category: text('category').default('general'), // general, call, meeting, email, follow_up

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

export const salesLeadActivityLog = sqliteTable('sales_lead_activity_log', {
  id: text('id').primaryKey(),
  leadId: text('lead_id').notNull().references(() => salesLeads.id, { onDelete: 'cascade' }),
  adminUserId: text('admin_user_id').notNull().references(() => adminUsers.id),

  action: text('action').notNull(), // created, updated, stage_changed, note_added, email_sent
  field: text('field'), // Which field was changed (for updates)
  previousValue: text('previous_value'), // JSON for complex values
  newValue: text('new_value'), // JSON for complex values
  metadata: text('metadata'), // Additional context as JSON

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const salesLeadSentEmails = sqliteTable('sales_lead_sent_emails', {
  id: text('id').primaryKey(),
  leadId: text('lead_id').notNull().references(() => salesLeads.id, { onDelete: 'cascade' }),
  adminUserId: text('admin_user_id').notNull().references(() => adminUsers.id),
  templateId: text('template_id').references(() => emailTemplates.id),

  recipientEmail: text('recipient_email').notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  status: text('status').notNull().default('pending'), // pending, sent, failed
  messageId: text('message_id'),
  errorMessage: text('error_message'),
  sentAt: integer('sent_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Sales Lead CRM Types
export type SalesLead = typeof salesLeads.$inferSelect;
export type NewSalesLead = typeof salesLeads.$inferInsert;
export type SalesLeadNote = typeof salesLeadNotes.$inferSelect;
export type NewSalesLeadNote = typeof salesLeadNotes.$inferInsert;
export type SalesLeadActivityLog = typeof salesLeadActivityLog.$inferSelect;
export type NewSalesLeadActivityLog = typeof salesLeadActivityLog.$inferInsert;
export type SalesLeadSentEmail = typeof salesLeadSentEmails.$inferSelect;
export type NewSalesLeadSentEmail = typeof salesLeadSentEmails.$inferInsert;
