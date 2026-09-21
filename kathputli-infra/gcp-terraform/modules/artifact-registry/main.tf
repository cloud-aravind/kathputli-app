#------------------------------------------------------------------------------
# Terraform module to create a Google Artifact Registry repository
#------------------------------------------------------------------------------
# Creates the Docker Artifact Registry repository used to store
# Kathputli container images for the selected environment.

resource "google_artifact_registry_repository" "kathputli" {
  # GCP project in which the repository will be created.
  project = var.project_id

  # Regional location of the Artifact Registry repository.
  location = var.location

  # Unique repository ID within the selected project and location.
  repository_id = var.repository_id

  # Package format stored in the repository.
  # For Kathputli this will be DOCKER.
  format = var.repository_format

  # Human-readable description of the repository.
  description = "Kathputli container image repository"

  # Metadata used to identify the project, environment,
  # and infrastructure ownership.
  labels = {
    environment = var.environment
    project     = "kathputli"
    managed_by  = "terraform"
  }
}

# Grants the GKE node service account read-only access to the
# Kathputli Artifact Registry repository so GKE can pull
# private container images.
resource "google_artifact_registry_repository_iam_member" "kathputli_node_sa" {
  project    = var.project_id
  location   = var.location
  repository = google_artifact_registry_repository.kathputli.repository_id

  role   = "roles/artifactregistry.reader"
  member = "serviceAccount:${var.node_service_account}"
}