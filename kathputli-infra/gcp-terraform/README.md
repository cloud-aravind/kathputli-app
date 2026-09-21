# Kathputli --- GCP Terraform Infrastructure

> Production-oriented Google Cloud infrastructure for the **Kathputli
> Art E-Commerce Platform**.

This directory contains the Terraform foundation for deploying Kathputli
on Google Cloud. It is designed for Platform Engineering, security,
reliability, maintainability, and multi-cloud portability.

Kathputli is designed to be deployable independently on AWS or GCP. AWS
and GCP do not need to run simultaneously.

------------------------------------------------------------------------

## Purpose

This Terraform layer provisions the GCP foundation required by
Kathputli:

-   Custom VPC networking
-   GKE networking and private cluster infrastructure
-   Cloud Router and Cloud NAT
-   Firewall rules
-   Dedicated Google Cloud service accounts
-   IAM permissions
-   Private GKE cluster and node pools
-   Workload Identity
-   GKE managed observability integration
-   Artifact Registry
-   Remote Terraform state and state locking

Application deployment, Kubernetes workloads, Helm, GitOps, CI/CD,
application secrets, and higher-level observability are handled by later
platform layers.

------------------------------------------------------------------------

## Design Principles

### --Infrastructure as Code

Infrastructure is defined in Terraform rather than created manually.

### --Least privilege

Dedicated service accounts are used instead of relying on the default
Compute Engine service account with broad permissions.

### --Separation of responsibilities

The Terraform bootstrap layer is separate from the platform environment.

### --Remote state

Terraform state is stored in Google Cloud Storage.

### --State locking

The GCS backend provides Terraform state locking.

### --No long-lived service-account keys

Local Terraform uses ADC and service-account impersonation. CI/CD will
use Workload Identity Federation.

### --Private-by-default infrastructure

GKE nodes and the Kubernetes API endpoint use private networking.

### --Reusable modules

Infrastructure is split into reusable Terraform modules.

### --Cloud portability

Higher-level application and platform design avoids unnecessary
cloud-specific coupling.

------------------------------------------------------------------------

## Architecture

``` text
Developer / CI
      │
      ▼
   Terraform
      │
      ├──────────────────────────────┐
      │                              │
      ▼                              ▼
 GCS Backend                  Terraform Service Account
      │                              │
      ├── Remote State               ▼
      └── State Locking        GCP Infrastructure
                                     │
                 ┌───────────────────┼──────────────────┐
                 │                   │                  │
                 ▼                   ▼                  ▼
               VPC                  GKE          Artifact Registry
                 │                   │
                 │                   ├── Private Nodes
                 │                   ├── Private Endpoint
                 │                   ├── Workload Identity
                 │                   └── Dedicated Node SA
                 │
                 ├── Cloud Router
                 ├── Cloud NAT
                 └── Firewall Rules
```

------------------------------------------------------------------------

# Terraform Root Responsibilities

## Bootstrap

`bootstrap/` creates and manages the Terraform management identity.

It owns:

-   Terraform service account
-   Administrator → Terraform service account impersonation
-   Terraform service account project-level roles

The bootstrap state is stored at:

``` text
gs://kathputli-dev-tf-state/bootstrap/
```

The bootstrap state is intentionally separate so destroying a platform
environment cannot destroy the identity Terraform depends on.

## Development Environment

`environments/dev/` composes the reusable modules and provisions the
actual GCP platform.

It manages:

-   Network
-   IAM
-   GKE
-   Artifact Registry

The development state is stored at:

``` text
gs://kathputli-dev-tf-state/environments/dev/
```

------------------------------------------------------------------------

# Terraform Modules

## bootstrap-iam

Creates the Terraform management service account and its IAM
relationships.

## network

Creates:

-   Custom VPC
-   GKE subnet
-   Pod secondary range
-   Service secondary range
-   Management subnet
-   Cloud Router
-   Cloud NAT
-   Firewall rules
-   Private Google Access
-   VPC Flow Logs

## iam

Creates the dedicated GKE node service account and its required
permissions, including the Terraform-to-node-service-account
relationship.

## gke

Creates the private GKE cluster and managed node pools.

The module configures:

-   VPC-native networking
-   Private nodes
-   Private endpoint
-   Dedicated control-plane CIDR
-   Workload Identity
-   Regular release channel
-   Cloud Logging
-   Managed Prometheus
-   Dedicated node service account
-   Shielded VMs
-   Secure Boot
-   Integrity monitoring
-   GKE metadata server
-   Node auto-repair
-   Node auto-upgrade
-   Node-pool autoscaling

## artifact-registry

Creates the private Docker Artifact Registry repository and grants the
GKE node service account read access.

------------------------------------------------------------------------

#  Network Design

The current development CIDR plan is:

  Component                     CIDR
  ----------------------------- ----------------
  GKE node subnet               `10.10.0.0/20`
  GKE Pod secondary range       `10.20.0.0/16`
  GKE Service secondary range   `10.30.0.0/20`
  Management subnet             `10.40.0.0/24`
  GKE control-plane CIDR        `10.50.0.0/28`

The control-plane `/28` is reserved for the private GKE control plane
and is separate from the node, Pod, Service, and management ranges.

## VPC

The VPC uses custom subnet mode so address ranges are explicitly
controlled.

``` text
kathputli-dev-vpc
```

## GKE subnet

The primary range is used by GKE nodes. Secondary ranges provide Pod and
Service IPs for VPC-native networking.

## Management subnet

A dedicated management subnet is reserved for controlled administration
components.

## Cloud Router and Cloud NAT

Private GKE nodes use Cloud NAT for outbound internet access without
requiring public node IPs.

## Private Google Access

Private Google Access is enabled on the required subnets so private
resources can reach supported Google APIs.

## VPC Flow Logs

VPC Flow Logs are enabled for network visibility and troubleshooting.

------------------------------------------------------------------------

#  Firewall Strategy

The current foundation includes:

### IAP → management SSH

SSH to management/bastion targets is restricted to Google's IAP source
range.

### Internal traffic

Required private traffic is allowed between the approved internal
network ranges.

### Health checks

Application/load-balancer health-check rules are handled by the future
GKE/load-balancing layer rather than being mixed into the base network
module.

------------------------------------------------------------------------

#  IAM Architecture

Kathputli uses separate identities for different responsibilities:

``` text
Human Administrator
       │
       │ Token Creator
       ▼
Terraform Service Account
       │
       │ Service Account User
       ▼
GKE Node Service Account
       │
       ▼
GCP APIs required by GKE
```

These relationships have different purposes and should not be confused.

## Terraform Service Account

Used by Terraform to manage infrastructure.

``` text
kathputli-terraform@kathputli-dev.iam.gserviceaccount.com
```

It is owned by the bootstrap layer, not by the dev platform state.

## GKE Node Service Account

A dedicated service account is used by GKE nodes instead of the default
Compute Engine service account.

## Workload Identity

Workload Identity is enabled at cluster level. Individual Kubernetes
workloads will receive Google Cloud identities only when they actually
require GCP API access.

------------------------------------------------------------------------

#  GKE Architecture

The GKE cluster is a private, production-oriented Kubernetes foundation.

Current characteristics:

-   Private nodes
-   Private Kubernetes API endpoint
-   Public API endpoint disabled
-   VPC-native networking
-   Dedicated `/28` control-plane range
-   Workload Identity
-   Regular release channel
-   Dedicated GKE node service account
-   Secure Boot
-   Integrity monitoring
-   GKE metadata server
-   Auto-repair
-   Auto-upgrade
-   Node-pool autoscaling
-   Cloud Logging
-   Managed Prometheus

## Private cluster

``` text
Private nodes       = Enabled
Private endpoint    = Enabled
Public endpoint     = Disabled
```

The control plane uses:

``` text
10.50.0.0/28
```

Public Google CIDR access is disabled and private endpoint enforcement
is enabled.

------------------------------------------------------------------------

# GKE Node Pool

Current development configuration:

  Setting         Value
  --------------- -----------------
  Machine type    `e2-small`
  Disk            `30 GB`
  Disk type       `pd-standard`
  Minimum nodes   `1`
  Maximum nodes   `3`
  Initial nodes   `1`
  Auto repair     Enabled
  Auto upgrade    Enabled
  Preemptible     Disabled
  Zone            `asia-south1-a`

These are development values and can be changed for other environments.

------------------------------------------------------------------------

#  Workload Identity

The cluster uses the project workload pool:

``` text
<project-id>.svc.id.goog
```

The intended model is:

``` text
Kubernetes ServiceAccount
        │
        ▼
Workload Identity
        │
        ▼
Google Service Account
        │
        ▼
Required IAM permissions
```

Workload Identity bindings will be introduced during the Kubernetes
platform layer for workloads that need Google Cloud APIs.

------------------------------------------------------------------------

#  Artifact Registry

The current private Docker repository is:

``` text
asia-south1-docker.pkg.dev/kathputli-dev/kathputli
```

The GKE node service account has:

``` text
roles/artifactregistry.reader
```

This allows nodes to pull private Kathputli images.

CI/CD will later receive the appropriate writer permissions through the
planned Workload Identity Federation model.

------------------------------------------------------------------------

#  Remote State and Locking

Terraform state is stored in:

``` text
gs://kathputli-dev-tf-state
```

Current layout:

``` text
kathputli-dev-tf-state/
│
├── bootstrap/
│   └── default.tfstate
│
└── environments/
    └── dev/
        └── default.tfstate
```

The bucket is outside the development Terraform state because the
backend bucket must exist before Terraform can initialize that backend.

## State locking

The GCS backend provides Terraform state locking. A separate lock
database is not required.

## State versioning

Object Versioning is enabled on the bucket to retain previous object
versions.

The bucket also uses:

-   Uniform bucket-level access
-   Public access prevention

Terraform state must be treated as sensitive infrastructure data.

------------------------------------------------------------------------

#  Authentication

## Local development

Use Google Application Default Credentials:

``` bash
gcloud auth application-default login
```

The dev environment impersonates:

``` text
kathputli-terraform@kathputli-dev.iam.gserviceaccount.com
```

No service-account JSON key is required.

## CI/CD

The planned authentication model is:

``` text
GitHub Actions
      │
      ▼
Workload Identity Federation
      │
      ▼
Google Cloud Service Account
```

Long-lived JSON service-account keys are intentionally avoided.

------------------------------------------------------------------------

# Terraform and Provider Versions

Terraform currently requires:

``` text
~> 1.16
```

The Google provider is standardized across the Terraform roots:

``` text
~> 7.46
```

Keeping the provider generation consistent reduces differences between
bootstrap and environment behavior.

------------------------------------------------------------------------

# Destroy Development Infrastructure

Development infrastructure can be destroyed when not required to reduce
cost.

Review first:

``` bash
terraform plan -destroy
```

Then:

``` bash
terraform destroy
```

Destroying the dev environment does **not** destroy the GCS state bucket
because that bucket is outside the dev Terraform state.

------------------------------------------------------------------------

# Repository Security

Do not commit:

-   `terraform.tfstate`
-   Terraform state backups
-   `.terraform/`
-   Terraform plan files
-   Debug/trace logs
-   Service-account JSON keys
-   Private keys
-   Environment secrets

The repository `.gitignore` excludes Terraform-generated and sensitive
local files.

Commit:

``` text
terraform.tfvars.example
.terraform.lock.hcl
*.tf
README.md
```

Do not commit a real environment-specific `terraform.tfvars` when it
contains private or environment-specific values.

------------------------------------------------------------------------

# Environment Strategy

The current environment is:

``` text
environments/dev/
```

The structure can later expand to:

``` text
environments/
├── dev/
├── staging/
└── prod/
```

Each environment should have its own Terraform state.

For example:

``` text
GCS
├── environments/dev/
├── environments/staging/
└── environments/prod/
```

Production should use stronger isolation and governance, potentially
including a dedicated state-management project.

------------------------------------------------------------------------

# Multi-Cloud Strategy

Kathputli is designed as a portable platform rather than an
active-active multi-cloud system.

``` text
                 Kathputli
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
       AWS Platform        GCP Platform
          │                     │
         EKS                   GKE
```

The application should be independently deployable on either cloud.

Cloud-specific Terraform implements each provider's infrastructure while
the higher-level platform design remains as portable as practical.

------------------------------------------------------------------------

# V1 Scope

## Included

-   Terraform bootstrap
-   Remote state
-   GCS state locking
-   State versioning
-   Dedicated Terraform identity
-   IAM foundation
-   Custom VPC
-   Subnets
-   GKE secondary ranges
-   Cloud Router
-   Cloud NAT
-   Firewall rules
-   Private GKE
-   Dedicated GKE node identity
-   Workload Identity
-   GKE node-pool autoscaling
-   GKE security hardening
-   Cloud Logging
-   Managed Prometheus integration
-   Artifact Registry

## Not included in V1

Higher-level Kubernetes and application platform components such as:

-   Kubernetes namespaces
-   Helm
-   Gateway/Ingress
-   Application workloads
-   Secrets management
-   Cloud SQL
-   Cloud Storage application services
-   Memorystore
-   KMS
-   DNS
-   Backup and disaster recovery
-   CI/CD
-   Argo CD / GitOps
-   Trivy
-   Prometheus/Grafana/Loki application configuration
-   DevOps-native AI capabilities

These are implemented in later platform layers.

------------------------------------------------------------------------

# Troubleshooting

## GCS backend cannot initialize

Verify:

``` bash
gcloud storage buckets describe gs://kathputli-dev-tf-state
```

Also verify that the Terraform identity has access to the state bucket.

## Terraform wants to create everything

If the environment was intentionally destroyed, this is expected.

A plan showing resources to add means Terraform is ready to recreate the
desired environment.

## Unexpected Terraform changes

Run:

``` bash
terraform plan
```

Review the affected resource addresses and do not apply an unexpected
plan until the cause is understood.

## GKE creation failure

Check:

-   GCP APIs
-   project quotas
-   VPC and secondary ranges
-   private cluster configuration
-   IAM permissions
-   GKE service account
-   regional/zonal capacity

Inspect a cluster with:

``` bash
gcloud container clusters describe <cluster-name> \
  --region <region> \
  --project <project-id>
```

## Artifact Registry image pull failure

Verify the GKE node service account has:

``` text
roles/artifactregistry.reader
```

and verify the image path:

``` text
<region>-docker.pkg.dev/<project-id>/<repository>/<image>:<tag>
```

------------------------------------------------------------------------

# Change Management Guidelines

When changing infrastructure:

1.  Understand the resource and dependency.
2.  Make the smallest required change.
3.  Run `terraform fmt`.
4.  Run `terraform validate`.
5.  Run `terraform plan`.
6.  Review IAM and networking changes carefully.
7.  Apply only after the plan is understood.
8.  Verify the resulting cloud resource.
9.  Update documentation when architecture changes.

Avoid using `terraform apply -target=...` as a normal deployment method.
Targeted operations should be reserved for controlled troubleshooting or
recovery.

------------------------------------------------------------------------

# Future Platform Flow

The GCP Terraform foundation is the first layer of the Kathputli
platform.

``` text
GCP Terraform
      │
      ▼
Kubernetes Foundation
      │
      ├── Namespaces
      ├── ServiceAccounts
      ├── Workload Identity
      ├── Secrets
      ├── Resource policies
      └── SecurityContext
      │
      ▼
Helm Platform
      │
      ▼
Kathputli Application
      │
      ▼
GitHub Actions
      │
      ▼
Argo CD / GitOps
      │
      ▼
Observability
      │
      ├── Prometheus
      ├── Grafana
      └── Loki
      │
      ▼
Security
      │
      ├── Trivy
      └── Cloud-native security controls
      │
      ▼
Reliability
      │
      ├── Backup
      ├── Disaster Recovery
      └── Operational Automation
```

------------------------------------------------------------------------

# Summary

The Kathputli GCP Terraform V1 foundation provides a secure and reusable
base for the platform.

The design separates:

-   Terraform management identity
-   Environment infrastructure
-   GKE node identity
-   Kubernetes workload identity

It uses:

-   Remote GCS state
-   State locking
-   State versioning
-   Private GKE
-   VPC-native networking
-   Dedicated service accounts
-   Workload Identity
-   Artifact Registry
-   Reusable Terraform modules
-   Provider version consistency
-   No long-lived service-account keys

The next implementation layer is the **Kubernetes platform foundation**,
which will build on this infrastructure without mixing Kubernetes
application configuration into the cloud Terraform layer.
