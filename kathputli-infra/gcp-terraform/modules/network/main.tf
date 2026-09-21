# -----------------------------------------------------------------------------
# Kathputli GCP VPC Network
# -----------------------------------------------------------------------------
# Creates the custom VPC network used by the Kathputli platform.
#
# The network uses custom subnet mode so that all subnet CIDRs are explicitly
# managed through Terraform. This avoids GCP automatically creating subnets
# that are not required by the platform.
#
# Dynamic routing is kept regional because the current Kathputli GCP design
# uses a regional GKE deployment. This can be revisited if a future
# multi-region GCP architecture is introduced.
# -----------------------------------------------------------------------------

resource "google_compute_network" "vpc_network" {
  project = var.project_id

  name = "kathputli-${var.environment}-vpc"

  description = "Custom VPC network for the Kathputli GCP platform"

  # Disable automatic subnet creation. All required subnets and CIDR ranges
  # will be explicitly defined and managed by Terraform.
  auto_create_subnetworks = false

  # Use regional dynamic routing for the current regional GKE architecture.
  routing_mode = "REGIONAL"
}



# -----------------------------------------------------------------------------
# Kathputli GKE Regional Subnet
# -----------------------------------------------------------------------------
# Regional subnet used by the Kathputli GKE cluster.
#
# The subnet contains:
#
# 1. Primary IP range
#    - Used by GKE nodes and other resources attached to the subnet.
#
# 2. Secondary IP range for GKE Pods
#    - Dedicated IP range for Pod IP addresses.
#
# 3. Secondary IP range for GKE Services
#    - Dedicated IP range for Kubernetes Service IP addresses.
#
# Private Google Access is enabled so resources without external IP addresses
# can access Google APIs and services using Google's private network path.
#
# Pod and Service secondary ranges are explicitly defined to support GKE
# VPC-native (Alias IP) networking.
# -----------------------------------------------------------------------------

resource "google_compute_subnetwork" "gke_subnet" {
  project = var.project_id

  name = "kathputli-${var.environment}-gke-subnet"

  ip_cidr_range = var.subnet_cidr_range

  region = var.region

  network = google_compute_network.vpc_network.id

  private_ip_google_access = true

  description = "Regional GKE subnet with dedicated primary, Pod, and Service IP ranges for the Kathputli platform"

  secondary_ip_range {
    range_name    = "kathputli-${var.environment}-gke-pods"
    ip_cidr_range = var.pod_secondary_cidr_range
  }

  secondary_ip_range {
    range_name    = "kathputli-${var.environment}-gke-services"
    ip_cidr_range = var.service_secondary_cidr_range
  }

  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}



# -----------------------------------------------------------------------------
# Kathputli Management / Bastion Subnet
# -----------------------------------------------------------------------------
# Dedicated regional subnet for management resources such as the Kathputli
# Bastion host.

# The Bastion is intended to be accessed through Identity-Aware Proxy (IAP)
# rather than exposing SSH directly to the public internet. Therefore, the
# management subnet itself does not require a public IP range.
#
# Private Google Access is enabled so resources without external IP addresses
# can access Google APIs and services using Google's private network path.
# -----------------------------------------------------------------------------

resource "google_compute_subnetwork" "management_subnet" {
  project = var.project_id

  name = "kathputli-${var.environment}-management-subnet"

  ip_cidr_range = var.management_subnet_cidr_range

  region = var.region

  network = google_compute_network.vpc_network.id

  private_ip_google_access = true

  description = "Regional management subnet for Bastion and administrative resources in the Kathputli platform"

  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}



# -----------------------------------------------------------------------------
# Kathputli Cloud Router
# -----------------------------------------------------------------------------
# Regional Cloud Router associated with the Kathputli VPC.
#
# Cloud Router provides the routing control plane required by services such as
# Cloud NAT. It does not perform NAT itself.
#
# The router is regional and will be used by the Cloud NAT configuration to
# provide outbound internet access for private workloads without assigning
# public IP addresses to GKE nodes or other private resources.
# -----------------------------------------------------------------------------

resource "google_compute_router" "vpc_router" {
  project = var.project_id

  name = "kathputli-${var.environment}-vpc-router"

  region = var.region

  network = google_compute_network.vpc_network.id

  description = "Regional Cloud Router for the Kathputli VPC and Cloud NAT"
}



# -----------------------------------------------------------------------------
# Kathputli Cloud NAT
# -----------------------------------------------------------------------------
# Provides outbound internet access for private workloads in the Kathputli VPC
# without requiring external IP addresses on GKE nodes, Pods, or management
# resources.
#
# Cloud NAT is associated with the regional Cloud Router created for the VPC.
# NAT is explicitly limited to the Kathputli GKE and management subnetworks
# rather than being enabled automatically for every subnet in the region.
#
# Google-managed NAT IP addresses are used through AUTO_ONLY.
#
# NAT error logging is enabled to support troubleshooting and security
# investigation while avoiding unnecessary logging of every NAT translation.
# -----------------------------------------------------------------------------

resource "google_compute_router_nat" "vpc_nat" {
  project = var.project_id

  name = "kathputli-${var.environment}-vpc-nat"

  region = var.region

  router = google_compute_router.vpc_router.name

  nat_ip_allocate_option = "AUTO_ONLY"

  source_subnetwork_ip_ranges_to_nat = "LIST_OF_SUBNETWORKS"

  subnetwork {
    name                    = google_compute_subnetwork.gke_subnet.id
    source_ip_ranges_to_nat = ["ALL_IP_RANGES"]
  }

  subnetwork {
    name                    = google_compute_subnetwork.management_subnet.id
    source_ip_ranges_to_nat = ["ALL_IP_RANGES"]
  }

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }

}



# -----------------------------------------------------------------------------
# IAP → Bastion SSH Access
# -----------------------------------------------------------------------------
# Allows SSH access to the Kathputli Bastion host through Identity-Aware Proxy
# (IAP) TCP forwarding.
#
# SSH is restricted to Google's IAP TCP forwarding range instead of allowing
# direct SSH access from the public internet.
#
# The rule targets only Bastion instances using the environment-specific
# network tag.
# -----------------------------------------------------------------------------

resource "google_compute_firewall" "allow_iap_to_bastion" {
  project = var.project_id

  name = "kathputli-${var.environment}-allow-iap-to-bastion"

  network = google_compute_network.vpc_network.id

  description = "Allow IAP TCP forwarding to the Kathputli Bastion host"

  direction = "INGRESS"
  priority  = 1000

  source_ranges = ["35.235.240.0/20"]

  target_tags = [
    "kathputli-${var.environment}-bastion"
  ]

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
}



# -----------------------------------------------------------------------------
# Internal VPC Traffic
# -----------------------------------------------------------------------------
# Allows internal communication between trusted Kathputli workloads within
# the VPC.
#
# Traffic is allowed from:
#   - GKE primary subnet range (GKE nodes)
#   - GKE Pod secondary range (GKE Pods)
#   - Management subnet range (Bastion and management resources)
#
# The GKE Service secondary range is intentionally not included as a source
# range because it represents virtual service IP addresses rather than the
# originating workload network.
#
# This rule applies only to traffic originating from the explicitly defined
# Kathputli internal CIDR ranges. Public internet traffic is not permitted
# by this rule.
# -----------------------------------------------------------------------------

resource "google_compute_firewall" "allow_internal_traffic" {
  project = var.project_id

  name = "kathputli-${var.environment}-allow-internal-traffic"

  network = google_compute_network.vpc_network.id

  description = "Allow internal traffic between trusted Kathputli workloads in the VPC"

  direction = "INGRESS"
  priority  = 1000

  source_ranges = [
    var.subnet_cidr_range,
    var.pod_secondary_cidr_range,
    var.management_subnet_cidr_range
  ]

  allow {
    protocol = "all"
  }
}
