# -----------------------------------------------------------------------------
# Terraform and Provider Version Requirements
# -----------------------------------------------------------------------------
# Defines the minimum Terraform version and the Google Cloud provider required
# by the Kathputli Terraform bootstrap configuration.
# -----------------------------------------------------------------------------

terraform {
  required_version = "~> 1.16"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 7.46"
    }
  }
}