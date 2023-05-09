import * as awsx from '@pulumi/awsx'
import * as eks from '@pulumi/eks'

// Create a VPC for our cluster.
const vpc = new awsx.ec2.Vpc('vpc', { numberOfAvailabilityZones: 1 })

// Create the EKS cluster itself and a deployment of the Kubernetes dashboard.
const cluster = new eks.Cluster('cluster', {
  vpcId: vpc.vpcId,
  subnetIds: vpc.publicSubnetIds,
  instanceType: 't2.small',
  desiredCapacity: 2,
  minSize: 1,
  maxSize: 2,
})

// Export the cluster's kubeconfig.
export const kubeconfig = cluster.kubeconfig

