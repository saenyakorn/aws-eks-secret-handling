# Getting Started

## Prepare your K8s cluster

## Install Sealed Secrets

```
helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
helm install sealed-secrets -n kube-system --set-string fullnameOverride=sealed-secrets-controller sealed-secrets/sealed-secrets
```

## Install Store Secret CSI Driver

```
helm repo add secrets-store-csi-driver https://kubernetes-sigs.github.io/secrets-store-csi-driver/charts
helm install -n kube-system csi-secrets-store secrets-store-csi-driver/secrets-store-csi-driver
```

## Install ArgoCD

```
kubectl create namespace argocd
helm repo add argo https://argoproj.github.io/argo-helm
helm install -n argocd argocd argo/argo-cd
```
