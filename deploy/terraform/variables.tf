# Server Configuration
variable "server_ip" {
  description = "IP address of the Nomad server and Docker registry"
  type        = string
  default     = "nomad-01.tailf77078.ts.net"
}

# Application Configuration (non-sensitive)
variable "admin_email_domain" {
  description = "Allowed domain for admin logins"
  type        = string
  default     = "taskclearers.com"
}

variable "notification_email" {
  description = "Email address for new application notifications"
  type        = string
  default     = "admin@taskclearers.com"
}

variable "o365_shared_mailbox" {
  description = "Office 365 shared mailbox for sending emails"
  type        = string
  default     = ""
}

# R2/S3 Storage Configuration
# Note: aws_access_key_id and aws_secret_access_key are used for Terraform S3 backend
# The application's R2 credentials are loaded from SOPS secrets (r2_access_key_id, r2_secret_access_key)
variable "aws_access_key_id" {
  description = "AWS/R2 Access Key ID (for Terraform S3 backend)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "aws_secret_access_key" {
  description = "AWS/R2 Secret Access Key (for Terraform S3 backend)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "r2_bucket_name" {
  description = "R2/S3 Bucket Name for uploads"
  type        = string
  default     = "taskclearers-uploads"
}

# Email Identity Configuration
variable "email_admin" {
  description = "Admin email address for magic links and system notifications"
  type        = string
  default     = "admin@taskclearers.com"
}

variable "email_admin_name" {
  description = "Display name for admin email"
  type        = string
  default     = "TaskClearers Admin"
}

variable "email_sales" {
  description = "Sales email address for lead communication"
  type        = string
  default     = "sales@taskclearers.com"
}

variable "email_sales_name" {
  description = "Display name for sales email"
  type        = string
  default     = "TaskClearers Sales"
}

variable "email_hiring" {
  description = "Hiring email address for applicant communication"
  type        = string
  default     = "careers@taskclearers.com"
}

variable "email_hiring_name" {
  description = "Display name for hiring email"
  type        = string
  default     = "TaskClearers Careers"
}
