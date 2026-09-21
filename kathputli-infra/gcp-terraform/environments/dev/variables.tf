# =============================================================================
# Kathputli Root Module Variables
# =============================================================================
# Environment-specific inputs used by the root Terraform configuration.
#
# These values are passed from the root module to the individual infrastructure
# modules, such as the network module.
# =============================================================================


# -----------------------------------------------------------------------------
# GCP Project
# -----------------------------------------------------------------------------

variable "project_id" {
  description = "GCP project ID where the Kathputli infrastructure is deployed."
  type        = string
}


# -----------------------------------------------------------------------------
# Deployment Environment
# -----------------------------------------------------------------------------

variable "environment" {
  description = "Deployment environment for the Kathputli infrastructure, such as dev, staging, or prod."
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, or prod."
  }
}


# -----------------------------------------------------------------------------
# GCP Region
# -----------------------------------------------------------------------------

variable "region" {
  description = "GCP region where regional Kathputli infrastructure resources are deployed."
  type        = string
}


# -----------------------------------------------------------------------------
# GCP Zone
# -----------------------------------------------------------------------------

variable "zone" {
  description = "Default GCP zone for zonal Kathputli resources."
  type        = string
}


# -----------------------------------------------------------------------------
# GKE Primary Subnet CIDR
# -----------------------------------------------------------------------------

variable "subnet_cidr_range" {
  description = "Primary IPv4 CIDR range allocated to the Kathputli GKE subnet."
  type        = string
}


# -----------------------------------------------------------------------------
# GKE Pod Secondary Range
# -----------------------------------------------------------------------------

variable "pod_secondary_cidr_range" {
  description = "Secondary IPv4 CIDR range allocated for GKE Pod IP addresses."
  type        = string
}


# -----------------------------------------------------------------------------
# GKE Service Secondary Range
# -----------------------------------------------------------------------------

variable "service_secondary_cidr_range" {
  description = "Secondary IPv4 CIDR range allocated for GKE Service IP addresses."
  type        = string
}


# -----------------------------------------------------------------------------
# Management / Bastion Subnet CIDR
# -----------------------------------------------------------------------------

variable "management_subnet_cidr_range" {
  description = "Primary IPv4 CIDR range allocated to the Kathputli management and Bastion subnet."
  type        = string
}


# -----------------------------------------------------------------------------
# GKE Node Service Account Roles
# -----------------------------------------------------------------------------

variable "node_sa_roles" {
  description = "IAM roles granted to the GKE node service account."
  type        = set(string)
  default     = []
}


# -----------------------------------------------------------------------------
# GKE Cluster Configuration
# -----------------------------------------------------------------------------

variable "cluster_name" {
  description = "Name of the GKE cluster."
  type        = string
}

variable "master_ipv4_cidr_block" {
  description = "Dedicated private CIDR block used by the GKE control plane."
  type        = string
}

variable "node_locations" {
  description = "Zones where the GKE node pool will run."
  type        = list(string)
}


# -----------------------------------------------------------------------------
# GKE Node Pool Configuration
# -----------------------------------------------------------------------------

variable "node_pools" {
  description = "Configuration for the GKE node pools."
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