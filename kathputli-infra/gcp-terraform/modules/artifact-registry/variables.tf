variable "project_id" {
  description = "The ID of the project in which to create the Artifact Registry repository"
  type        = string
}

variable "location" {
  description = "The location of the Artifact Registry repository"
  type        = string
}

variable "repository_id" {
  description = "The ID of the Artifact Registry repository"
  type        = string
}

variable "repository_format" {
  description = "The package format of the Artifact Registry repository."
  type        = string
}

variable "environment" {
  description = "The environment for the Artifact Registry repository (e.g., 'dev', 'staging', 'prod')"
  type        = string
}

variable "node_service_account" {
  description = "Email address of the GKE node service account that requires read access to the repository."
  type        = string
}
