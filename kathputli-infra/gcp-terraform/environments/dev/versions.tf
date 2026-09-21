# -----------------------------------------------------------------------------
# Terraform and Provider Version Requirements
# -----------------------------------------------------------------------------
# Defines the supported Terraform CLI version and required providers
# for the Kathputli GCP infrastructure.
#
# Provider versions are intentionally constrained to ensure predictable
# and reproducible infrastructure deployments across local development
# and CI/CD environments.
#
# The provider lock file (.terraform.lock.hcl) records the selected
# provider version and verified package checksums.
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