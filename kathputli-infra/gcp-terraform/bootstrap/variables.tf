# -----------------------------------------------------------------------------
# GCP Project Configuration
# -----------------------------------------------------------------------------

variable "project_id" {
  description = "The GCP project ID where the Kathputli Terraform management identity will be created."
  type        = string
}

variable "region" {
  description = "The default GCP region used by the bootstrap provider configuration."
  type        = string
}

variable "zone" {
  description = "The default GCP zone used by the bootstrap provider configuration."
  type        = string
}

# -----------------------------------------------------------------------------
# Terraform Administrator Identity
# -----------------------------------------------------------------------------
# This identity receives permission to impersonate the Terraform service
# account.
# -----------------------------------------------------------------------------

variable "terraform_admin_email" {
  description = "The email address of the human or administrative identity permitted to impersonate the Terraform service account."
  type        = string
}

# -----------------------------------------------------------------------------
# Terraform Service Account Roles
# -----------------------------------------------------------------------------
# These are the project-level permissions required by the Terraform service
# account to provision and manage Kathputli infrastructure.
# -----------------------------------------------------------------------------

variable "terraform_sa_roles" {
  description = "Project-level IAM roles granted to the Kathputli Terraform management service account."
  type        = set(string)
  default     = []
}