# =============================================================================
# Kathputli GCP Infrastructure
# =============================================================================
# Root module for composing the reusable infrastructure modules.
# =============================================================================


# -----------------------------------------------------------------------------
# Network Module
# -----------------------------------------------------------------------------

module "network" {
  source = "../../modules/network"

  project_id  = var.project_id
  region      = var.region
  environment = var.environment

  subnet_cidr_range            = var.subnet_cidr_range
  pod_secondary_cidr_range     = var.pod_secondary_cidr_range
  service_secondary_cidr_range = var.service_secondary_cidr_range
  management_subnet_cidr_range = var.management_subnet_cidr_range
}


module "iam" {
  source = "../../modules/iam"

  project_id    = var.project_id
  node_sa_roles = var.node_sa_roles
}


# -----------------------------------------------------------------------------
# GKE Module
# -----------------------------------------------------------------------------
module "gke" {
  source = "../../modules/gke"

  project_id = var.project_id
  region     = var.region

  cluster_name     = var.cluster_name
  cluster_location = var.cluster_location

  network_name    = module.network.vpc_name
  subnetwork_name = module.network.gke_subnet_name

  pod_secondary_range_name     = module.network.pod_secondary_range_name
  service_secondary_range_name = module.network.service_secondary_range_name

  master_ipv4_cidr_block       = var.master_ipv4_cidr_block
  management_subnet_cidr_range = var.management_subnet_cidr_range

  node_locations       = var.node_locations
  node_service_account = module.iam.gke_node_service_account_email
  node_pools           = var.node_pools

  depends_on = [
    module.network,
    module.iam,
  ]
}


# -----------------------------------------------------------------------------
# Bastion Host
# -----------------------------------------------------------------------------
# Secure administrative entry point for the private GKE control plane.
# The Bastion has no public IP and is accessed through IAP.
# -----------------------------------------------------------------------------

module "bastion" {
  source = "../../modules/bastion"

  project_id      = var.project_id
  environment     = var.environment
  zone            = var.cluster_location
  subnetwork_name = module.network.management_subnet_name
  machine_type    = var.bastion_machine_type
}


# ------------------------------------------------------------------------------
# Artifact Registry Module
# ------------------------------------------------------------------------------

module "artifact_registry" {
  source = "../../modules/artifact-registry"

  project_id           = var.project_id
  location             = var.region
  repository_id        = "kathputli"
  repository_format    = "DOCKER"
  environment          = var.environment
  node_service_account = module.iam.gke_node_service_account_email
}
