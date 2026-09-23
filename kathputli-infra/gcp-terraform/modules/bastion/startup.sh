#!/bin/bash

set -e

# -----------------------------------------------------------------------------
# Kathputli Bastion Startup Script
# -----------------------------------------------------------------------------
# Purpose:
#   Prepare the Bastion host for GKE administration.
#
# Installed:
#   - Google Cloud CLI
#   - kubectl
#   - GKE gcloud authentication plugin
#   - Helm
# -----------------------------------------------------------------------------

export DEBIAN_FRONTEND=noninteractive

apt-get update

apt-get install -y \
  apt-transport-https \
  ca-certificates \
  gnupg \
  curl \
  snapd

# -----------------------------------------------------------------------------
# Google Cloud APT Repository
# -----------------------------------------------------------------------------

if [ ! -f /etc/apt/sources.list.d/google-cloud-sdk.list ]; then

  curl -fsSL https://packages.cloud.google.com/apt/doc/apt-key.gpg \
    | gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg

  echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" \
    > /etc/apt/sources.list.d/google-cloud-sdk.list

fi

apt-get update

# -----------------------------------------------------------------------------
# GKE Administration Tools
# -----------------------------------------------------------------------------

apt-get install -y \
  google-cloud-cli \
  kubectl \
  google-cloud-cli-gke-gcloud-auth-plugin

# -----------------------------------------------------------------------------
# Helm
# -----------------------------------------------------------------------------

HELM_VERSION="v4.3.0"
HELM_ARCHIVE="helm-${HELM_VERSION}-linux-amd64.tar.gz"
HELM_URL="https://get.helm.sh/${HELM_ARCHIVE}"

if ! command -v helm >/dev/null 2>&1; then

  curl -fsSL "${HELM_URL}" -o "/tmp/${HELM_ARCHIVE}"

  tar -xzf "/tmp/${HELM_ARCHIVE}" -C /tmp

  install -m 0755 /tmp/linux-amd64/helm /usr/local/bin/helm

  rm -rf "/tmp/${HELM_ARCHIVE}" /tmp/linux-amd64

fi

# -----------------------------------------------------------------------------
# Verification
# -----------------------------------------------------------------------------

echo "---- Kathputli Bastion Tooling ----"

command -v gcloud
command -v kubectl
command -v gke-gcloud-auth-plugin
command -v helm
helm version

echo "------------------------------------"
echo "Kathputli Bastion initialization completed successfully."