# ---------------------------------------------------------------------------
# Terraform Remote State
# ---------------------------------------------------------------------------
# GCS provides remote state storage and state locking.
terraform {
  backend "gcs" {
    bucket = "kathputli-dev-tf-state"
    prefix = "bootstrap"
  }
}

# ---------------------------------------------------------------------------
# Google Cloud Provider
# ---------------------------------------------------------------------------
# The bootstrap configuration uses the authenticated administrator's
# Application Default Credentials (ADC).
#
# Terraform Service Account impersonation is intentionally NOT configured here
# because this layer is responsible for creating that service account.
# ---------------------------------------------------------------------------

provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}