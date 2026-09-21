# =============================================================================
# Kathputli Root Module Outputs
# =============================================================================
# Important infrastructure outputs exposed by the root Terraform configuration.
# =============================================================================


# -----------------------------------------------------------------------------
# VPC
# -----------------------------------------------------------------------------

output "vpc_id" {
  description = "ID of the Kathputli VPC network."
  value       = module.network.vpc_id
}

output "vpc_name" {
  description = "Name of the Kathputli VPC network."
  value       = module.network.vpc_name
}


# -----------------------------------------------------------------------------
# GKE Subnet
# -----------------------------------------------------------------------------

output "gke_subnet_id" {
  description = "ID of the Kathputli GKE subnet."
  value       = module.network.gke_subnet_id
}

output "gke_subnet_name" {
  description = "Name of the Kathputli GKE subnet."
  value       = module.network.gke_subnet_name
}


# -----------------------------------------------------------------------------
# Management Subnet
# -----------------------------------------------------------------------------

output "management_subnet_id" {
  description = "ID of the Kathputli management subnet."
  value       = module.network.management_subnet_id
}

output "management_subnet_name" {
  description = "Name of the Kathputli management subnet."
  value       = module.network.management_subnet_name
}