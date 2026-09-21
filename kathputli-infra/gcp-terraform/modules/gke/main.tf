# -----------------------------------------------------------------------------
# Kathputli - GKE Cluster
# -----------------------------------------------------------------------------
# Creates the production-oriented GKE cluster for the Kathputli platform.
#
# Design principles:
# - Private GKE nodes
# - Private Kubernetes control-plane endpoint
# - VPC-native networking using existing secondary IP ranges
# - Workload Identity enabled
# - Dedicated GKE node service account
# - Regular GKE release channel
# - Cloud Logging and Managed Prometheus enabled
# - Default node pool removed
# - Custom node pool managed separately below
#
# The cluster is intentionally implemented using the native
# google_container_cluster resource rather than an external Terraform module.
# This gives Kathputli direct control over the GKE configuration.
# -----------------------------------------------------------------------------


# -----------------------------------------------------------------------------
# GKE Cluster
# -----------------------------------------------------------------------------
resource "google_container_cluster" "gke_cluster" {

  # ---------------------------------------------------------------------------
  # Basic cluster configuration
  # ---------------------------------------------------------------------------
  project  = var.project_id
  name     = var.cluster_name
  location = var.region

  # Attach the cluster to the Kathputli VPC and GKE subnet.
  network    = var.network_name
  subnetwork = var.subnetwork_name

  # Use VPC-native / alias IP networking.
  networking_mode = "VPC_NATIVE"

  # GKE requires an initial node configuration during cluster creation.
  # The default node pool is removed immediately and a separately managed
  # node pool is created below.
  initial_node_count       = 1
  remove_default_node_pool = true

  # Restrict node placement to the locations defined by the environment.
  node_locations = var.node_locations

  # Allow Terraform to destroy the cluster when the environment is destroyed.
  # Production environments can enable deletion protection separately.
  deletion_protection = false


  # ---------------------------------------------------------------------------
  # VPC-native IP allocation
  # ---------------------------------------------------------------------------
  # Pods and Services use dedicated secondary ranges from the GKE subnet.
  ip_allocation_policy {
    cluster_secondary_range_name  = var.pod_secondary_range_name
    services_secondary_range_name = var.service_secondary_range_name
  }


  # ---------------------------------------------------------------------------
  # Private GKE cluster
  # ---------------------------------------------------------------------------
  # Nodes do not receive public IP addresses and the Kubernetes API server
  # is accessible only through its private endpoint.
  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = true

    # Dedicated RFC1918 /28 range for the GKE control plane.
    master_ipv4_cidr_block = var.master_ipv4_cidr_block

    # Do not allow the private control-plane endpoint to be accessed globally.
    master_global_access_config {
      enabled = false
    }
  }


  # ---------------------------------------------------------------------------
  # Control-plane access restrictions
  # ---------------------------------------------------------------------------
  # Public Google CIDRs are not authorized.
  # Access is enforced through the private endpoint.
  master_authorized_networks_config {
    gcp_public_cidrs_access_enabled      = false
    private_endpoint_enforcement_enabled = true
  }


  # ---------------------------------------------------------------------------
  # Workload Identity
  # ---------------------------------------------------------------------------
  # Allows Kubernetes workloads to authenticate to Google Cloud services
  # using Kubernetes Service Accounts mapped to Google Cloud IAM identities.
  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }


  # ---------------------------------------------------------------------------
  # GKE release channel
  # ---------------------------------------------------------------------------
  # Regular channel provides a balance between stability and access to
  # supported GKE features and updates.
  release_channel {
    channel = "REGULAR"
  }


  # ---------------------------------------------------------------------------
  # Logging
  # ---------------------------------------------------------------------------
  # Send system and workload logs to Google Cloud Logging.
  logging_config {
    enable_components = [
      "SYSTEM_COMPONENTS",
      "WORKLOADS",
    ]
  }


  # ---------------------------------------------------------------------------
  # Monitoring
  # ---------------------------------------------------------------------------
  # Enable GKE metrics collection and Managed Service for Prometheus.
  monitoring_config {
    enable_components = [
      "SYSTEM_COMPONENTS",
      "STORAGE",
      "HPA",
      "POD",
      "DAEMONSET",
      "DEPLOYMENT",
      "STATEFULSET",
      "CADVISOR",
      "KUBELET",
      "DCGM",
      "JOBSET",
    ]

    managed_prometheus {
      enabled = true
    }
  }


  # ---------------------------------------------------------------------------
  # Initial node configuration
  # ---------------------------------------------------------------------------
  # GKE needs a node configuration during cluster creation even though the
  # default node pool is removed. Explicitly specifying the dedicated
  # Kathputli node service account prevents GKE from falling back to the
  # project-level default Compute Engine service account.
  node_config {
    service_account = var.node_service_account

    disk_type    = "pd-standard"
    disk_size_gb = 30

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]

    metadata = {
      disable-legacy-endpoints = "true"
    }

    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }

    workload_metadata_config {
      mode = "GKE_METADATA"
    }
  }
}


# -----------------------------------------------------------------------------
# GKE Node Pool
# -----------------------------------------------------------------------------
# The default GKE node pool is removed by the cluster configuration above.
# This separately managed node pool provides explicit control over:
#
# - Machine type
# - Disk configuration
# - Autoscaling
# - Auto repair
# - Auto upgrade
# - Node service account
# - Shielded VM configuration
# - Workload Identity metadata
# -----------------------------------------------------------------------------

resource "google_container_node_pool" "kathputli_node_pool" {

  # Support multiple node pools through the node_pools variable.
  for_each = {
    for np in var.node_pools : np.name => np
  }

  name     = each.value.name
  cluster  = google_container_cluster.gke_cluster.name
  location = var.region
  project  = var.project_id

  initial_node_count = each.value.initial_node_count
  node_locations     = var.node_locations


  # ---------------------------------------------------------------------------
  # Node autoscaling
  # ---------------------------------------------------------------------------
  autoscaling {
    min_node_count = each.value.min_node_count
    max_node_count = each.value.max_node_count
  }


  # ---------------------------------------------------------------------------
  # Node management
  # ---------------------------------------------------------------------------
  management {
    auto_repair  = each.value.auto_repair
    auto_upgrade = each.value.auto_upgrade
  }


  # ---------------------------------------------------------------------------
  # Node configuration
  # ---------------------------------------------------------------------------
  node_config {
    machine_type = each.value.machine_type
    disk_type    = each.value.disk_type
    disk_size_gb = each.value.disk_size_gb
    preemptible  = each.value.preemptible

    # Use the dedicated Kathputli GKE node service account.
    service_account = var.node_service_account

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]

    # Disable legacy metadata endpoints.
    metadata = {
      disable-legacy-endpoints = "true"
    }

    # Harden worker nodes using Shielded VM features.
    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }

    # Enable GKE Workload Identity metadata integration.
    workload_metadata_config {
      mode = "GKE_METADATA"
    }
  }
}