# -----------------------------------------------------------------------------
# Bastion Outputs
# -----------------------------------------------------------------------------

output "bastion_name" {
  description = "Name of the Bastion VM."
  value       = google_compute_instance.bastion.name
}

output "bastion_internal_ip" {
  description = "Internal IP address of the Bastion VM."
  value       = google_compute_instance.bastion.network_interface[0].network_ip
}

output "bastion_service_account_email" {
  description = "Email address of the Bastion service account."
  value       = google_service_account.bastion.email
}