terraform {
  backend "s3" {
    bucket                      = "infra"
    key                         = "taskclearers/terraform.tfstate"
    region                      = "auto"
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    use_path_style             = true
  }

  required_providers {
    nomad = {
      source  = "hashicorp/nomad"
      version = "~> 2.0"
    }
    sops = {
      source = "carlpett/sops"
      version = "~> 1.0"
    }
  }
}

provider "nomad" {
  address = "http://${var.server_ip}:4646"
}

provider "sops" {}

data "sops_file" "secrets" {
  source_file = "${path.module}/../secrets.enc.yaml"
}

# Get app version from package.json
data "external" "app_version" {
  program = ["bash", "${path.module}/get_app_version.sh"]
}

# Build and push Docker image before deploying
resource "null_resource" "build_and_push" {
  triggers = {
    image_tag = data.external.app_version.result.version
  }

  provisioner "local-exec" {
    command = "${path.module}/build_and_push.sh ${var.server_ip} ${data.external.app_version.result.version} ${abspath("${path.module}/../..")}"
  }
}

resource "nomad_job" "taskclearers" {
  depends_on = [null_resource.build_and_push]
  
  jobspec = templatefile("${path.module}/job.nomad.tpl", {
    image_tag           = data.external.app_version.result.version
    jwt_secret          = data.sops_file.secrets.data["jwt_secret"]
    admin_email_domain  = var.admin_email_domain
    resend_api_key      = data.sops_file.secrets.data["resend_api_key"]
    notification_email  = var.notification_email
    azure_client_id     = data.sops_file.secrets.data["azure_client_id"]
    azure_tenant_id     = data.sops_file.secrets.data["azure_tenant_id"]
    azure_client_secret = data.sops_file.secrets.data["azure_client_secret"]
    o365_shared_mailbox = var.o365_shared_mailbox
    
    # R2 Variables
    aws_access_key_id     = var.aws_access_key_id
    aws_secret_access_key = var.aws_secret_access_key
    aws_endpoint_url_s3   = var.aws_endpoint_url_s3
    r2_bucket_name        = var.r2_bucket_name
  })
}