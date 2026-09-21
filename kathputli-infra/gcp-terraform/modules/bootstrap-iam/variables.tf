# -----------------------------------------------------------------------------
# GCP Project Configuration
# -----------------------------------------------------------------------------

variable "project_id" {
  description = "The GCP project ID where the Terraform management service account will be created."
  type        = string
}

# -----------------------------------------------------------------------------
# Terraform Administrator Identity
# -----------------------------------------------------------------------------
# This identity is granted permission to impersonate the Terraform service
# account using short-lived credentials.
# -----------------------------------------------------------------------------

variable "terraform_admin_email" {
  description = "The email address of the human or administrative identity permitted to impersonate the Terraform service account."
  type        = string
}

# -----------------------------------------------------------------------------
# Terraform Service Account Roles
# -----------------------------------------------------------------------------
# Project-level IAM roles required by the Terraform service account to manage
# Kathputli infrastructure.
# -----------------------------------------------------------------------------

variable "terraform_sa_roles" {
  description = "Project-level IAM roles granted to the Terraform management service account."
  type        = set(string)
  default     = []
}