# -----------------------------------------------------------------------------
# Kathputli Terraform Management Service Account
# -----------------------------------------------------------------------------
# Dedicated service account used by Terraform to manage Kathputli GCP
# infrastructure.
#
# The service account is intentionally managed in the separate bootstrap
# layer so that platform infrastructure can be destroyed without deleting
# the identity required to manage Terraform itself.
# -----------------------------------------------------------------------------

resource "google_service_account" "terraform" {
  project = var.project_id

  account_id   = "kathputli-terraform"
  display_name = "Kathputli Terraform Service Account"

  description = "Dedicated service account for Kathputli Terraform infrastructure automation"
}

# -----------------------------------------------------------------------------
# Terraform Service Account Impersonation
# -----------------------------------------------------------------------------
# Allows the designated human/admin identity to impersonate the Terraform
# service account using short-lived credentials.
#
# No service-account JSON key is required.
# -----------------------------------------------------------------------------

resource "google_service_account_iam_member" "terraform_impersonation" {
  service_account_id = google_service_account.terraform.name

  role = "roles/iam.serviceAccountTokenCreator"

  member = "user:${var.terraform_admin_email}"
}


# -----------------------------------------------------------------------------
# Terraform Service Account Project IAM Roles
# -----------------------------------------------------------------------------
# Grants the Terraform management service account the project-level IAM roles
# required to provision and manage Kathputli infrastructure.
#
# The roles are supplied through var.terraform_sa_roles and are created
# individually using for_each.
#
# Using google_project_iam_member ensures that Terraform manages only the
# specific IAM membership represented by each resource without replacing the
# project's complete IAM policy.
# -----------------------------------------------------------------------------
resource "google_project_iam_member" "terraform_sa_roles" {
  for_each = var.terraform_sa_roles
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.terraform.email}"
}