# -----------------------------------------------------------------------------
# Bastion Service Account
# -----------------------------------------------------------------------------
# Dedicated identity for the Bastion VM.
# Additional IAM permissions will only be granted if a specific
# administrative requirement needs them.
# -----------------------------------------------------------------------------

resource "google_service_account" "bastion" {
  project      = var.project_id
  account_id   = "kathputli-${var.environment}-bastion"
  display_name = "Kathputli ${var.environment} Bastion"
  description  = "Dedicated service account for the Kathputli Bastion host."
}


# -----------------------------------------------------------------------------
# Kathputli Bastion Host
# -----------------------------------------------------------------------------
# Small Linux VM used as a secure administrative entry point to the
# private GKE cluster.
#
# The Bastion is deployed in the management subnet and is accessed
# through Identity-Aware Proxy (IAP).
# -----------------------------------------------------------------------------

resource "google_compute_instance" "bastion" {

  name         = "kathputli-${var.environment}-bastion"
  project      = var.project_id
  zone         = var.zone
  machine_type = var.machine_type

  # ---------------------------------------------------------------------------
  # Bastion Service Account
  # ---------------------------------------------------------------------------
  service_account {
    email  = google_service_account.bastion.email
    scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  }

  # ---------------------------------------------------------------------------
  # OS Login
  # ---------------------------------------------------------------------------
  # Manage SSH access through Google Cloud IAM instead of storing
  # user-managed SSH keys on the Bastion VM.
  # ---------------------------------------------------------------------------

  metadata = {
    enable-oslogin = "TRUE"
    startup-script = file("${path.module}/startup.sh")
  }

  # ---------------------------------------------------------------------------
  # Network configuration
  # ---------------------------------------------------------------------------
  # The Bastion uses the dedicated management subnet and does not receive
  # a public IP address.
  # ---------------------------------------------------------------------------

  network_interface {
    subnetwork = var.subnetwork_name
  }

  # ---------------------------------------------------------------------------
  # Boot disk
  # ---------------------------------------------------------------------------
  # Use a small Linux boot disk suitable for administrative tasks.
  # ---------------------------------------------------------------------------

  boot_disk {
    initialize_params {
      image = "projects/ubuntu-os-cloud/global/images/family/ubuntu-2404-lts-amd64"
      size  = 20
      type  = "pd-standard"
    }
  }

  # ---------------------------------------------------------------------------
  # Network tag
  # ---------------------------------------------------------------------------
  # This tag is used by the existing IAP → Bastion firewall rule.
  # ---------------------------------------------------------------------------

  tags = [
    "kathputli-${var.environment}-bastion"
  ]
}


# -----------------------------------------------------------------------------
# Terraform Management Service Account Access
# -----------------------------------------------------------------------------
# Allow the Terraform management service account to attach the Bastion
# service account to the Bastion VM.
#
# This is intentionally scoped to the Bastion service account rather than
# granting serviceAccountUser at the project level.
# -----------------------------------------------------------------------------

resource "google_service_account_iam_member" "terraform_bastion_user" {
  service_account_id = google_service_account.bastion.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:kathputli-terraform@${var.project_id}.iam.gserviceaccount.com"
}


# -----------------------------------------------------------------------------
# Bastion Service Account Permissions
# -----------------------------------------------------------------------------
resource "google_project_iam_member" "bastion_gke_viewer" {
  project = var.project_id
  role    = "roles/container.developer"
  member  = "serviceAccount:${google_service_account.bastion.email}"
}