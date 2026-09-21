# =============================================================================
# Kathputli Network Module Outputs
# =============================================================================
# Outputs expose important network resource attributes to the root module and
# other Terraform modules.
#
# Consumers should use these outputs instead of directly referencing resources
# inside the network module.
# =============================================================================


# -----------------------------------------------------------------------------
# VPC
# -----------------------------------------------------------------------------

output "vpc_id" {
  description = "ID of the Kathputli VPC network."
  value       = google_compute_network.vpc_network.id
}

output "vpc_name" {
  description = "Name of the Kathputli VPC network."
  value       = google_compute_network.vpc_network.name
}


# -----------------------------------------------------------------------------
# GKE Subnet
# -----------------------------------------------------------------------------

output "gke_subnet_id" {
  description = "ID of the Kathputli GKE subnet."
  value       = google_compute_subnetwork.gke_subnet.id
}

output "gke_subnet_name" {
  description = "Name of the Kathputli GKE subnet."
  value       = google_compute_subnetwork.gke_subnet.name
}


# -----------------------------------------------------------------------------
# Management / Bastion Subnet
# -----------------------------------------------------------------------------

output "management_subnet_id" {
  description = "ID of the Kathputli management subnet used for Bastion and administrative resources."
  value       = google_compute_subnetwork.management_subnet.id
}

output "management_subnet_name" {
  description = "Name of the Kathputli management subnet."
  value       = google_compute_subnetwork.management_subnet.name
}


# -----------------------------------------------------------------------------
# Cloud Router
# -----------------------------------------------------------------------------

output "router_name" {
  description = "Name of the regional Cloud Router associated with the Kathputli VPC."
  value       = google_compute_router.vpc_router.name
}


# -----------------------------------------------------------------------------
# Cloud NAT
# -----------------------------------------------------------------------------

output "nat_name" {
  description = "Name of the Cloud NAT configuration associated with the Kathputli VPC."
  value       = google_compute_router_nat.vpc_nat.name
}


# -----------------------------------------------------------------------------
# GKE Secondary IP Ranges
# -----------------------------------------------------------------------------

output "pod_secondary_range_name" {
  description = "Name of the secondary IP range used for GKE Pods."
  value       = "kathputli-${var.environment}-gke-pods"
}

output "service_secondary_range_name" {
  description = "Name of the secondary IP range used for GKE Services."
  value       = "kathputli-${var.environment}-gke-services"
}