# -----------------------------------------------------------------------------
# GKE Cluster Configuration
# -----------------------------------------------------------------------------

variable "project_id" {
  description = "The GCP project ID where the GKE cluster will be created."
  type        = string
}

variable "region" {
  description = "The GCP region where the GKE cluster will be created."
  type        = string
}

variable "cluster_location" {
  description = "The GKE cluster location. A zone creates a zonal cluster, while a region creates a regional cluster."
  type        = string
}

variable "cluster_name" {
  description = "The name of the GKE cluster."
  type        = string
}

# -----------------------------------------------------------------------------
# GKE Network Configuration
# -----------------------------------------------------------------------------

variable "network_name" {
  description = "The name of the VPC network where the GKE cluster will be created."
  type        = string
}

variable "subnetwork_name" {
  description = "The name of the subnetwork where the GKE cluster will be created."
  type        = string
}

variable "pod_secondary_range_name" {
  description = "The name of the secondary range for pods in the GKE cluster."
  type        = string
}

variable "service_secondary_range_name" {
  description = "The name of the secondary range for services in the GKE cluster."
  type        = string
}

# -----------------------------------------------------------------------------
# GKE Control Plane Configuration
# -----------------------------------------------------------------------------

variable "master_ipv4_cidr_block" {
  description = "The dedicated private CIDR block used by the GKE control plane."
  type        = string
}

variable "management_subnet_cidr_range" {
  description = "The CIDR range of the management subnet authorized to access the private GKE control plane."
  type        = string
}

# -----------------------------------------------------------------------------
# GKE Node Pool Configuration
# -----------------------------------------------------------------------------

variable "node_pools" {
  description = "A list of node pool configurations for the GKE cluster."
  type = list(object({
    name               = string
    machine_type       = string
    disk_size_gb       = number
    disk_type          = string
    min_node_count     = number
    max_node_count     = number
    preemptible        = bool
    auto_upgrade       = bool
    auto_repair        = bool
    initial_node_count = number
  }))
  default = []
}


# -----------------------------------------------------------------------------
# Node Service Account
# -----------------------------------------------------------------------------

variable "node_service_account" {
  description = "The email of the service account to be used by the GKE node pools."
  type        = string
}


# -----------------------------------------------------------------------------
# Node Locations
# -----------------------------------------------------------------------------

variable "node_locations" {
  description = "The zones where the GKE node pool will run."
  type        = list(string)
}



