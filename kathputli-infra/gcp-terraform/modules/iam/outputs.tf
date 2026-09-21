# -----------------------------------------------------------------------------
# IAM Module Outputs
# -----------------------------------------------------------------------------

output "gke_node_service_account_email" {
  description = "Email address of the Kathputli GKE Node service account."
  value       = google_service_account.gke_node_sa.email
}