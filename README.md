# Getting Started

## Prepare your K8s cluster

### Setup all required k8s namespaces

```
kubectl apply -k kustomize/namespaces
```

### Install Sealed Secrets

```
helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
helm install sealed-secrets -n kube-system --set-string fullnameOverride=sealed-secrets-controller sealed-secrets/sealed-secrets
```

### Install Store Secret CSI Driver

```
helm repo add secrets-store-csi-driver https://kubernetes-sigs.github.io/secrets-store-csi-driver/charts
helm install -n kube-system csi-secrets-store secrets-store-csi-driver/secrets-store-csi-driver

helm repo add aws-secrets-manager https://aws.github.io/secrets-store-csi-driver-provider-aws
helm install -n kube-system secrets-provider-aws aws-secrets-manager/secrets-store-csi-driver-provider-aws
```

### Install ArgoCD

```
helm repo add argo https://argoproj.github.io/argo-helm
helm install -n argocd argocd argo/argo-cd
```

## Setup ArgoCD applications

### Prepare Sealed SSH private key for accessing private git repositories

### Add applications to ArgoCD

```
kubectl apply -k kustomize/argo
```
