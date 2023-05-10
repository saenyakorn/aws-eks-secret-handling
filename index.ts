import * as awsx from '@pulumi/awsx'
import * as aws from '@pulumi/aws'
import * as eks from '@pulumi/eks'

// Create a VPC for our cluster.
const vpc = new awsx.ec2.Vpc('vpc', { numberOfAvailabilityZones: 2 })

// Create the EKS cluster itself and a deployment of the Kubernetes dashboard.
const cluster = new eks.Cluster('cluster', {
  vpcId: vpc.vpcId,
  subnetIds: vpc.publicSubnetIds,
  instanceType: 't2.small',
  desiredCapacity: 2,
  minSize: 1,
  maxSize: 2,
  createOidcProvider: true,
})

// Define the service account name
const saName = 'secret-manager-sa'

// Get the OIDC provider's URL for the cluster.
export const clusterOidcProvider = cluster?.core?.oidcProvider?.url

// Create a policy that allows the cluster to access the AWS Secret Manager.
const policy = new aws.iam.Policy('secret-manager-policy', {
  policy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: ['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret'],
        Resource: ['arn:*:secretsmanager:*'],
      },
    ],
  }),
})

// Create a new IAM role that assumes the AssumeRoleWebWebIdentity policy
const saRole = new aws.iam.Role(saName, {
  assumeRolePolicy: {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: {
          Service: 'eks.amazonaws.com',
        },
        Action: ['sts:AssumeRole'],
      },
    ],
  },
})

export const saRoleArn = saRole.arn

// Attach the IAM role to an AWS Secret Manager access policy.
new aws.iam.RolePolicyAttachment(saName, {
  policyArn: policy.arn,
  role: saRole,
})

// Export the cluster's kubeconfig.
export const kubeconfig = cluster.kubeconfig
