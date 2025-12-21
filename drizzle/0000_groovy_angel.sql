CREATE TABLE `admin_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`permissions` text,
	`created_at` integer,
	`last_login_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_email_unique` ON `admin_users` (`email`);--> statement-breakpoint
CREATE TABLE `analytics_events` (
	`id` text PRIMARY KEY NOT NULL,
	`event_type` text NOT NULL,
	`job_id` text,
	`metadata` text,
	`ip_hash` text,
	`created_at` integer,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `application_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`admin_user_id` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `applications` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`resume_path` text,
	`cover_letter` text,
	`good_at` text,
	`status` text DEFAULT 'new' NOT NULL,
	`source` text DEFAULT 'website',
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `email_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`trigger_status` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_templates_name_unique` ON `email_templates` (`name`);--> statement-breakpoint
CREATE TABLE `employee_activity_log` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text NOT NULL,
	`admin_user_id` text NOT NULL,
	`action` text NOT NULL,
	`field` text,
	`previous_value` text,
	`new_value` text,
	`metadata` text,
	`created_at` integer,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `employee_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`file_path` text NOT NULL,
	`file_size` integer,
	`mime_type` text,
	`description` text,
	`expires_at` integer,
	`uploaded_by` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploaded_by`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `employee_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text NOT NULL,
	`admin_user_id` text NOT NULL,
	`content` text NOT NULL,
	`category` text DEFAULT 'general',
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `employee_sent_emails` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text NOT NULL,
	`admin_user_id` text NOT NULL,
	`template_id` text,
	`recipient_email` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`message_id` text,
	`error_message` text,
	`sent_at` integer,
	`created_at` integer,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`template_id`) REFERENCES `email_templates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`department` text NOT NULL,
	`role` text NOT NULL,
	`job_id` text,
	`hire_date` integer NOT NULL,
	`salary` text,
	`benefits` text,
	`address` text,
	`emergency_contact` text,
	`status` text DEFAULT 'active' NOT NULL,
	`termination_date` integer,
	`termination_reason` text,
	`created_at` integer,
	`updated_at` integer,
	`created_by` text,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `employees_email_unique` ON `employees` (`email`);--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`location` text DEFAULT 'Remote' NOT NULL,
	`department` text NOT NULL,
	`description` text NOT NULL,
	`salary_range` text,
	`requirements` text,
	`responsibilities` text,
	`is_active` integer DEFAULT true NOT NULL,
	`view_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `magic_link_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `magic_link_tokens_token_unique` ON `magic_link_tokens` (`token`);--> statement-breakpoint
CREATE TABLE `received_emails` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text,
	`graph_message_id` text NOT NULL,
	`conversation_id` text,
	`from_email` text NOT NULL,
	`from_name` text,
	`subject` text NOT NULL,
	`body_preview` text,
	`body` text NOT NULL,
	`received_at` integer NOT NULL,
	`is_read` integer DEFAULT false NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `received_emails_graph_message_id_unique` ON `received_emails` (`graph_message_id`);--> statement-breakpoint
CREATE TABLE `sales_lead_activity_log` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`admin_user_id` text NOT NULL,
	`action` text NOT NULL,
	`field` text,
	`previous_value` text,
	`new_value` text,
	`metadata` text,
	`created_at` integer,
	FOREIGN KEY (`lead_id`) REFERENCES `sales_leads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sales_lead_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`admin_user_id` text NOT NULL,
	`content` text NOT NULL,
	`category` text DEFAULT 'general',
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`lead_id`) REFERENCES `sales_leads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sales_lead_sent_emails` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`admin_user_id` text NOT NULL,
	`template_id` text,
	`recipient_email` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`message_id` text,
	`error_message` text,
	`sent_at` integer,
	`created_at` integer,
	FOREIGN KEY (`lead_id`) REFERENCES `sales_leads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`template_id`) REFERENCES `email_templates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sales_leads` (
	`id` text PRIMARY KEY NOT NULL,
	`company_name` text NOT NULL,
	`contact_name` text NOT NULL,
	`contact_email` text NOT NULL,
	`contact_phone` text,
	`stage` text DEFAULT 'new' NOT NULL,
	`estimated_value` integer,
	`currency` text DEFAULT 'USD',
	`source` text,
	`assigned_to` text,
	`won_date` integer,
	`lost_date` integer,
	`lost_reason` text,
	`created_at` integer,
	`updated_at` integer,
	`created_by` text,
	FOREIGN KEY (`assigned_to`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sent_emails` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`admin_user_id` text NOT NULL,
	`template_id` text,
	`recipient_email` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`message_id` text,
	`error_message` text,
	`sent_at` integer,
	`created_at` integer,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`template_id`) REFERENCES `email_templates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE cascade
);
