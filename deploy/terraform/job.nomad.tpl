job "taskclearers" {
  datacenters = ["dc1"]
  type        = "service"

  group "web" {
    count = 1

    # Graceful shutdown
    shutdown_delay = "5s"

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

  # Main router (non-www)
  "traefik.http.routers.taskclearers.rule=Host(`taskclearers.com`)",
  "traefik.http.routers.taskclearers.entrypoints=websecure",
  "traefik.http.routers.taskclearers.tls.certresolver=letsencrypt",

  # WWW router (redirects to non-www)
  "traefik.http.routers.taskclearers-www.rule=Host(`www.taskclearers.com`)",
  "traefik.http.routers.taskclearers-www.entrypoints=websecure",
  "traefik.http.routers.taskclearers-www.tls.certresolver=letsencrypt",
  "traefik.http.routers.taskclearers-www.priority=10",
  "traefik.http.routers.taskclearers-www.middlewares=www-to-nonwww",

  # Redirect middleware
  "traefik.http.middlewares.www-to-nonwww.redirectregex.regex=^https?://www\\.taskclearers\\.com/?(.*)",
  "traefik.http.middlewares.www-to-nonwww.redirectregex.replacement=https://taskclearers.com/$1",
  "traefik.http.middlewares.www-to-nonwww.redirectregex.permanent=true"
]



      # Health check using dedicated endpoint
      check {
        type     = "http"
        path     = "/api/health"
        interval = "30s"
        timeout  = "10s"

        check_restart {
          limit           = 3
          grace           = "60s"
          ignore_warnings = false
        }
      }
    }

    task "app" {
      driver = "docker"

      config {
        image   = "localhost:5000/taskclearers:${image_tag}"
        ports   = ["http"]
        volumes = ["/opt/data/taskclearers:/app/data"]
      }

      # Non-sensitive environment variables
      env {
        NODE_ENV             = "production"
        DATABASE_PATH        = "/app/data/taskclearers.db"
        ADMIN_EMAIL_DOMAIN   = "${admin_email_domain}"
        NOTIFICATION_EMAIL   = "${notification_email}"
        O365_SHARED_MAILBOX  = "${o365_shared_mailbox}"
        NEXT_PUBLIC_BASE_URL = "https://taskclearers.com"

        # R2 Storage (non-sensitive)
        AWS_ENDPOINT_URL_S3 = "${aws_endpoint_url_s3}"
        R2_BUCKET_NAME      = "${r2_bucket_name}"
        AWS_REGION          = "auto"

        # Email Identities
        EMAIL_ADMIN       = "${email_admin}"
        EMAIL_ADMIN_NAME  = "${email_admin_name}"
        EMAIL_SALES       = "${email_sales}"
        EMAIL_SALES_NAME  = "${email_sales_name}"
        EMAIL_HIRING      = "${email_hiring}"
        EMAIL_HIRING_NAME = "${email_hiring_name}"
      }

      # Secrets loaded from Nomad Variables (not visible in job spec)
      template {
        data        = <<-EOF
          {{ with nomadVar "nomad/jobs/taskclearers" }}
          JWT_SECRET={{ .jwt_secret }}
          AZURE_CLIENT_ID={{ .azure_client_id }}
          AZURE_TENANT_ID={{ .azure_tenant_id }}
          AZURE_CLIENT_SECRET={{ .azure_client_secret }}
          AWS_ACCESS_KEY_ID={{ .aws_access_key_id }}
          AWS_SECRET_ACCESS_KEY={{ .aws_secret_access_key }}
          {{ end }}
        EOF
        destination = "secrets/env.env"
        env         = true
      }

      resources {
        cpu    = 1000
        memory = 1024
      }
    }
  }
}
