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
        "traefik.http.middlewares.taskclearers-www-redirect.redirectregex.replacement=https://taskclearers.com/$$$$1",
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
        image = "localhost:5000/taskclearers:${image_tag}"
        ports = ["http"]

        # Persistent volume for SQLite database and uploads
        volumes = [
          "/opt/taskclearers/data:/app/data"
        ]
      }

      env {
        NODE_ENV             = "production"
        DATABASE_PATH        = "/app/data/taskclearers.db"
        JWT_SECRET           = "${jwt_secret}"
        ADMIN_EMAIL_DOMAIN   = "${admin_email_domain}"
        RESEND_API_KEY       = "${resend_api_key}"
        NOTIFICATION_EMAIL   = "${notification_email}"
        AZURE_CLIENT_ID      = "${azure_client_id}"
        AZURE_TENANT_ID      = "${azure_tenant_id}"
        AZURE_CLIENT_SECRET  = "${azure_client_secret}"
        O365_SHARED_MAILBOX  = "${o365_shared_mailbox}"
        NEXT_PUBLIC_BASE_URL = "https://taskclearers.com"
        
        # R2 Storage Configuration
        AWS_ACCESS_KEY_ID     = "${aws_access_key_id}"
        AWS_SECRET_ACCESS_KEY = "${aws_secret_access_key}"
        AWS_ENDPOINT_URL_S3   = "${aws_endpoint_url_s3}"
        R2_BUCKET_NAME        = "${r2_bucket_name}"
        AWS_REGION            = "auto"
      }

      resources {
        cpu    = 500
        memory = 512
      }
    }
  }
}
