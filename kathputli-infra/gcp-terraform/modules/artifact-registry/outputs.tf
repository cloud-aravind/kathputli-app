output "repository_id" {
  description = "The ID of the Kathputli Artifact Registry repository."
  value       = google_artifact_registry_repository.kathputli.repository_id
}

output "repository_url" {
  description = "The Docker repository URL used to push and pull Kathputli container images."
  value       = "${var.location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.kathputli.repository_id}"
}

output "repository_name" {
  description = "The fully qualified resource name of the Kathputli Artifact Registry repository."
  value       = google_artifact_registry_repository.kathputli.name
}