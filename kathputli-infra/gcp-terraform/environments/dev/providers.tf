# -----------------------------------------------------------------------------
# Terraform Remote State
# -----------------------------------------------------------------------------
# Terraform state for the Kathputli GCP development environment is stored
# remotely in Google Cloud Storage.
#
# The GCS backend also provides state locking, preventing concurrent Terraform
# operations from modifying the same state at the same time.
#
# The state is stored under a separate prefix from the bootstrap state:
#
#   gs://kathputli-dev-tf-state/environments/dev/
#
# The state bucket itself is created outside this Terraform state because the
# backend bucket must exist before Terraform can initialize the backend.
# -----------------------------------------------------------------------------

terraform {
  backend "gcs" {
    bucket = "kathputli-dev-tf-state"
    prefix = "environments/dev"
  }
}

# -----------------------------------------------------------------------------
# Google Cloud Provider Configuration
# -----------------------------------------------------------------------------
# Configures the Google provider for the Kathputli GCP development environment.
#
# Project, region, and zone are supplied through Terraform variables so that
# environment-specific values are not hardcoded in the provider configuration.
#
# Authentication is intentionally not defined using a service-account key.
# Terraform obtains credentials through the environment's authentication
# mechanism:
#
#   - Local development: Application Default Credentials (ADC)
#   - CI/CD: Workload Identity Federation (WIF)
#   - GCP-hosted administration: Attached service account
#
# For the dev environment, Terraform impersonates the dedicated
# kathputli-terraform service account.
# -----------------------------------------------------------------------------

provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone

  impersonate_service_account = "kathputli-terraform@kathputli-dev.iam.gserviceaccount.com"
}