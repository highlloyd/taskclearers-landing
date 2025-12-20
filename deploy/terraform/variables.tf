variable "aws_access_key_id" {
  description = "AWS Access Key ID for R2"
  type        = string
  sensitive   = true
  default     = ""
}

variable "aws_secret_access_key" {
  description = "AWS Secret Access Key for R2"
  type        = string
  sensitive   = true
  default     = ""
}

variable "aws_endpoint_url_s3" {
  description = "R2 Endpoint URL"
  type        = string
  default     = ""
}

variable "server_ip" {
  description = "IP address of the Nomad server and Docker registry"
  type        = string
  default     = "nomad-01.tailf77078.ts.net"
}

variable "r2_bucket_name" {
  description = "R2 Bucket Name for uploads"
  type        = string
  default     = "taskclearers-uploads"
}

variable "image_tag" {
  description = "Docker image tag to deploy"
  type        = string
  default     = "latest"
}

variable "jwt_secret" {
  description = "JWT secret for authentication"
  type        = string
  sensitive   = true
  default     = ""
}

variable "admin_email_domain" {
  description = "Admin email domain"
  type        = string
  default     = ""
}

variable "resend_api_key" {
  description = "Resend API key for sending emails"
  type        = string
  default     = ""
  sensitive   = true
}

variable "notification_email" {
  description = "Email address for notifications"
  type        = string
  default     = ""
}

variable "azure_client_id" {
  description = "Azure AD client ID"
  type        = string
  default     = ""
}

variable "azure_tenant_id" {
  description = "Azure AD tenant ID"
  type        = string
  default     = ""
}

variable "azure_client_secret" {
  description = "Azure AD client secret"
  type        = string
  default     = ""
  sensitive   = true
}

variable "o365_shared_mailbox" {
  description = "Office 365 shared mailbox"
  type        = string
  default     = ""
}
