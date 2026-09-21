
# -----------------------------------------------------------------------------
# GKE Node Service Account
# -----------------------------------------------------------------------------
# dedicated service account used by GKE node pools to access GCP resources.
# -----------------------------------------------------------------------------

resource "google_service_account" "gke_node_sa" {
  project = var.project_id

  account_id   = "kathputli-gke-node"
  display_name = "Kathputli GKE Node"

  description = "Dedicated service account for Kathputli GKE node pools"
}


# -----------------------------------------------------------------------------
# GKE Node Service Account Project Roles
# -----------------------------------------------------------------------------
resource "google_project_iam_member" "gke_node_sa_roles" {
  for_each = var.node_sa_roles

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.gke_node_sa.email}"
}


# -----------------------------------------------------------------------------
# GKE Node Service Account IAM Binding for Terraform Management SA
# -----------------------------------------------------------------------------
resource "google_service_account_iam_member" "terraform_node_sa_user" {
  service_account_id = google_service_account.gke_node_sa.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:kathputli-terraform@${var.project_id}.iam.gserviceaccount.com"
}