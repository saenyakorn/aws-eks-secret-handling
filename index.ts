import * as awsx from '@pulumi/awsx'
import * as aws from '@pulumi/aws'
import * as eks from '@pulumi/eks'
import * as pulumi from '@pulumi/pulumi'

async function main() {
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

  // Get the OIDC provider's URL for the cluster.
  const clusterOidcProvider = cluster?.core?.oidcProvider

  // Create a policy that allows the cluster to access the AWS Secret Manager.
  const policy = new aws.iam.Policy('secret-manager-policy', {
    policy: {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: ['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret'],
          Resource: ['arn:aws:secretsmanager:*'],
        },
      ],
    },
  })

  // Declare the service account namespace and name
  const saNamespace = 'simple-services'
  const saName = 'secret-manager-sa'
  const clusterOidcProviderArn = clusterOidcProvider?.arn as pulumi.Output<string>
  const clusterOidcProviderUrl = cluster?.core?.oidcProvider?.url as pulumi.Output<string>

  // Create a new IAM role that assumes the AssumeRoleWebWebIdentity policy
  const saAssumeRolePolicy = pulumi
    .all([saName, saNamespace, clusterOidcProviderArn, clusterOidcProviderUrl])
    .apply(([saName, saNamespace, clusterOidcProviderArn, clusterOidcProviderUrl]) =>
      aws.iam.getPolicyDocument({
        statements: [
          {
            actions: ['sts:AssumeRoleWithWebIdentity'],
            effect: 'Allow',
            principals: [{ identifiers: [clusterOidcProviderArn], type: 'Federated' }],
            conditions: [
              {
                test: 'StringEquals',
                values: [`system:serviceaccount:${saNamespace}:${saName}`],
                variable: `${clusterOidcProviderUrl.replace('https://', '')}:sub`,
              },
            ],
          },
        ],
      })
    )

  const saRole = new aws.iam.Role(saName, {
    assumeRolePolicy: saAssumeRolePolicy.json,
  })

  // Attach the IAM role to an AWS Secret Manager access policy.
  new aws.iam.RolePolicyAttachment(saName, {
    policyArn: policy.arn,
    role: saRole,
  })

  // Return all of the outputs from the cluster.
  const saRoleArn = saRole.arn
  const kubeconfig = cluster.kubeconfig
  return {
    kubeconfig,
    clusterOidcProvider,
    saRoleArn,
  }
}

const result = main()

export default result
