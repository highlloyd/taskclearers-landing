# Terraform Deployment for TaskClearers

This directory contains the Terraform configuration to deploy the TaskClearers application to Nomad.

## Prerequisites

- Terraform installed (v1.0+)
- Access to the Nomad cluster

## Usage

1. Initialize Terraform (with R2 backend):
   ```bash
   # Ensure your R2 credentials and NOMAD_ADDR are set in the environment
   # (Terraform picks up AWS_* and NOMAD_ADDR automatically)
   terraform init -backend-config="endpoint=$AWS_ENDPOINT_URL_S3"
   ```

2. Create a variables file (e.g., `terraform.tfvars`) with your secrets and configuration.
   
   **Note on Environment Variables:**
   Terraform automatically picks up `AWS_*` variables for its *own* backend/provider configuration, but **not** for the input variables defined in `variables.tf`.
   
   To pass your existing shell exports to the Terraform variables, prefix them with `TF_VAR_`:

   ```bash
   # Add this alias to your shell configuration to map your R2 credentials automatically
   alias tf='TF_VAR_aws_access_key_id="$AWS_ACCESS_KEY_ID" \
             TF_VAR_aws_secret_access_key="$AWS_SECRET_ACCESS_KEY" \
             TF_VAR_aws_endpoint_url_s3="$AWS_ENDPOINT_URL_S3" \
             TF_VAR_jwt_secret="$JWT_SECRET" \
             terraform'
   ```
   
   Then run: `tf plan` / `tf apply`

3. Plan the deployment:
   ```bash
   terraform plan
   ```

4. Apply the deployment:
   ```bash
   terraform apply
   ```

## Variables

| Name | Description | Default |
|------|-------------|---------|
| `image_tag` | Docker image tag to deploy | `latest` |
| `jwt_secret` | JWT secret for authentication | (Required) |
| `admin_email_domain` | Admin email domain | `""` |
| `resend_api_key` | Resend API key | `""` |
| `notification_email` | Notification email | `""` |
| `azure_client_id` | Azure Client ID | `""` |
| `azure_tenant_id` | Azure Tenant ID | `""` |
| `azure_client_secret` | Azure Client Secret | `""` |
| `o365_shared_mailbox` | O365 Shared Mailbox | `""` |
