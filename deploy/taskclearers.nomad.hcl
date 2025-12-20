# TaskClearers Landing Nomad Job
#
# Deploy with:
#   export NOMAD_ADDR="http://<server-ip>:4646"
#   nomad job run deploy/taskclearers.nomad.hcl

variable "image_tag" {
  description = "Docker image tag to deploy"
  type        = string
  default     = "latest"
}

variable "jwt_secret" {
  description = "JWT secret for authentication"
  type        = string
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
}

variable "o365_shared_mailbox" {
  description = "Office 365 shared mailbox"
  type        = string
  default     = ""
}

job "taskclearers" {
  datacenters = ["dc1"]
  type        = "service"

  group "web" {
    count = 1

    network {
      port "http" {
        to = 3000
      }
    }

    service {
      name     = "taskclearers"
      port     = "http"
      provider = "nomad"

      tags = [
        "traefik.enable=true",
        "traefik.http.routers.taskclearers.rule=Host(`taskclearers.com`) || Host(`www.taskclearers.com`)",
        "traefik.http.routers.taskclearers.entrypoints=websecure",
        "traefik.http.routers.taskclearers.tls.certresolver=letsencrypt",
        # Redirect www to non-www
        "traefik.http.middlewares.taskclearers-www-redirect.redirectregex.regex=^https://www\\.taskclearers\\.com/(.*)",
        "traefik.http.middlewares.taskclearers-www-redirect.redirectregex.replacement=https://taskclearers.com/$$1",
        "traefik.http.middlewares.taskclearers-www-redirect.redirectregex.permanent=true",
        "traefik.http.routers.taskclearers.middlewares=taskclearers-www-redirect",
      ]

      check {
        type     = "http"
        path     = "/"
        interval = "30s"
        timeout  = "5s"
      }
    }

    task "app" {
      driver = "docker"

      config {
        image = "localhost:5000/taskclearers:${var.image_tag}"
        ports = ["http"]

        # Persistent volume for SQLite database and uploads
        volumes = [
          "/opt/taskclearers/data:/app/data"
        ]
      }

      env {
        NODE_ENV             = "production"
        DATABASE_PATH        = "/app/data/taskclearers.db"
        JWT_SECRET           = var.jwt_secret
        ADMIN_EMAIL_DOMAIN   = var.admin_email_domain
        RESEND_API_KEY       = var.resend_api_key
        NOTIFICATION_EMAIL   = var.notification_email
        AZURE_CLIENT_ID      = var.azure_client_id
        AZURE_TENANT_ID      = var.azure_tenant_id
        AZURE_CLIENT_SECRET  = var.azure_client_secret
        O365_SHARED_MAILBOX  = var.o365_shared_mailbox
        NEXT_PUBLIC_BASE_URL = "https://taskclearers.com"
      }

      resources {
        cpu    = 500
        memory = 512
      }
    }
  }
}
