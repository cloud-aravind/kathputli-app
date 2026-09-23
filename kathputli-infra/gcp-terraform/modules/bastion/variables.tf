# -----------------------------------------------------------------------------
# Bastion Module Variables
# -----------------------------------------------------------------------------

variable "project_id" {
  description = "GCP project ID where the Bastion VM will be created."
  type        = string
}

variable "environment" {
  description = "Deployment environment name used for Bastion resource naming."
  type        = string
}

variable "zone" {
  description = "GCP zone where the Bastion VM will be deployed."
  type        = string
}

variable "subnetwork_name" {
  description = "Name of the management subnet where the Bastion VM will be deployed."
  type        = string
}

variable "machine_type" {
  description = "Compute Engine machine type used by the Bastion VM."
  type        = string
}