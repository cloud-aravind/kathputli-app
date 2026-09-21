# -----------------------------------------------------------------------------
# IAM Module Variables
# -----------------------------------------------------------------------------

variable "project_id" {
  description = "GCP project ID where the Kathputli IAM resources are managed."
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