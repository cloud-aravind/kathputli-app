# =============================================================================
# Kathputli Network Module Variables
# =============================================================================
# Input variables used to configure the Kathputli VPC and its associated
# networking resources.
#
# Environment-specific values are supplied by the root module rather than
# hardcoded inside the network module.
# =============================================================================


# -----------------------------------------------------------------------------
# GCP Project
# -----------------------------------------------------------------------------

variable "project_id" {
  description = "GCP project ID where the Kathputli network resources are created."
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
  description = "GCP region where the regional Kathputli network resources are deployed."
  type        = string
}


# -----------------------------------------------------------------------------
# GKE Primary Subnet CIDR
# -----------------------------------------------------------------------------

variable "subnet_cidr_range" {
  description = "Primary IPv4 CIDR range for the Kathputli GKE subnet."
  type        = string
}


# -----------------------------------------------------------------------------
# GKE Pod Secondary Range
# -----------------------------------------------------------------------------

variable "pod_secondary_cidr_range" {
  description = "Secondary IPv4 CIDR range reserved for GKE Pod IP addresses."
  type        = string
}


# -----------------------------------------------------------------------------
# GKE Service Secondary Range
# -----------------------------------------------------------------------------

variable "service_secondary_cidr_range" {
  description = "Secondary IPv4 CIDR range reserved for GKE Service IP addresses."
  type        = string
}


# -----------------------------------------------------------------------------
# Management / Bastion Subnet CIDR
# -----------------------------------------------------------------------------

variable "management_subnet_cidr_range" {
  description = "Primary IPv4 CIDR range for the Kathputli management and Bastion subnet."
  type        = string
}