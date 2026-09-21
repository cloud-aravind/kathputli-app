# -----------------------------------------------------------------------------
# Terraform Service Account Outputs
# -----------------------------------------------------------------------------

output "terraform_service_account_id" {
  description = "Fully qualified resource ID of the Kathputli Terraform management service account."
  value       = google_service_account.terraform.id
}

output "terraform_service_account_email" {
  description = "Email address of the Kathputli Terraform management service account."
  value       = google_service_account.terraform.email
}

output "terraform_service_account_name" {
  description = "Fully qualified resource name of the Kathputli Terraform management service account."
  value       = google_service_account.terraform.name
}