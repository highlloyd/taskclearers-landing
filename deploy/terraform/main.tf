terraform {
  backend "s3" {
    bucket                      = "infra"
    key                         = "taskclearers/terraform.tfstate"
    region                      = "auto"
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_s3_checksum            = true
    use_path_style              = true
  }

  required_providers {
    nomad = {
      source  = "hashicorp/nomad"
      version = "~> 2.0"
    }
    sops = {
      source  = "carlpett/sops"
      version = "~> 1.0"
    }
  }
}

provider "nomad" {
  address = "http://${var.server_ip}:4646"
}

provider "sops" {}

# Load secrets from SOPS-encrypted file
data "sops_file" "secrets" {
  source_file = "${path.module}/../secrets.enc.yaml"
}

# Get app version from package.json
data "external" "app_version" {
  program = ["bash", "${path.module}/get_app_version.sh"]
}

# Ensure data directory exists with correct permissions
# Uses /opt/data/<job-name> convention per infrastructure standards
resource "null_resource" "setup_data_dir" {
  triggers = {
    server_ip = var.server_ip
  }

  provisioner "remote-exec" {
    inline = [
      "echo '[terraform] Setting up data directory for TaskClearers...'",
      "mkdir -p /opt/data/taskclearers",
      "chown 1001:1001 /opt/data/taskclearers",
      "chmod 755 /opt/data/taskclearers",
      "echo '[terraform] Data directory setup complete'"
    ]

    connection {
      type = "ssh"
      user = "root"
      host = var.server_ip
    }
  }
}

# Store secrets in Nomad Variables (secure - not visible in job spec)
resource "nomad_variable" "taskclearers_secrets" {
  depends_on = [null_resource.setup_data_dir]

  path      = "nomad/jobs/taskclearers"
  namespace = "default"

  items = {
    jwt_secret          = data.sops_file.secrets.data["jwt_secret"]
    azure_client_id     = data.sops_file.secrets.data["azure_client_id"]
    azure_tenant_id     = data.sops_file.secrets.data["azure_tenant_id"]
    azure_client_secret = data.sops_file.secrets.data["azure_client_secret"]
    aws_access_key_id     = data.sops_file.secrets.data["r2_access_key_id"]
    aws_secret_access_key = data.sops_file.secrets.data["r2_secret_access_key"]
  }
}

# Build and push Docker image
resource "null_resource" "build_and_push" {
  triggers = {
    image_tag = data.external.app_version.result.version
  }

  provisioner "local-exec" {
    command = "${path.module}/build_and_push.sh ${var.server_ip} ${data.external.app_version.result.version} ${abspath("${path.module}/../..")}"
  }
}

# Deploy the Nomad job
resource "nomad_job" "taskclearers" {
  depends_on = [
    null_resource.setup_data_dir,
    null_resource.build_and_push,
    nomad_variable.taskclearers_secrets
  ]

  jobspec = templatefile("${path.module}/job.nomad.tpl", {
    image_tag           = data.external.app_version.result.version
    admin_email_domain  = var.admin_email_domain
    notification_email  = var.notification_email
    o365_shared_mailbox = var.o365_shared_mailbox
    r2_account_id       = data.sops_file.secrets.data["r2_account_id"]
    r2_bucket_name      = var.r2_bucket_name
    email_admin         = var.email_admin
    email_admin_name    = var.email_admin_name
    email_sales         = var.email_sales
    email_sales_name    = var.email_sales_name
    email_hiring        = var.email_hiring
    email_hiring_name   = var.email_hiring_name
  })
}
