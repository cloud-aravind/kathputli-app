# =============================================================================
# Kathputli GCP Terraform Bootstrap
# =============================================================================
# Root configuration for the Terraform management identity.
#
# This configuration is intentionally separated from the environment
# configurations so that destroying a platform environment cannot destroy the
# service account Terraform itself depends on.
#
# The bootstrap configuration delegates the actual IAM resource creation to
# the reusable bootstrap-iam module.
# =============================================================================

module "bootstrap_iam" {
  source = "../modules/bootstrap-iam"

  project_id            = var.project_id
  terraform_admin_email = var.terraform_admin_email
  terraform_sa_roles    = var.terraform_sa_roles
}