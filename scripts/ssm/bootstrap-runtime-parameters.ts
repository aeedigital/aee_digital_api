import { SSMClient } from '@aws-sdk/client-ssm';
import { ParameterStoreProvisioner } from '../../src/services/parameter-store.provisioner';

const runtimeParameterNames = [
  'MONGODB_URI',
  'LOCATION_UPDATE_TOKEN',
  'GEOAPIFY_API_KEY',
] as const;

async function main(): Promise<void> {
  if (process.argv.length > 2) {
    throw new Error('Pass runtime values through the approved secret manager, not command-line arguments');
  }

  const project = process.env.PARAMETER_PROJECT?.trim();
  const environment = process.env.PARAMETER_ENVIRONMENT?.trim();
  if (!project) throw new Error('PARAMETER_PROJECT is required');
  if (!environment) throw new Error('PARAMETER_ENVIRONMENT is required');

  const missing = runtimeParameterNames.filter(
    (name) => !process.env[name]?.trim(),
  );
  if (missing.length > 0) {
    throw new Error(`Missing runtime parameter values: ${missing.join(', ')}`);
  }

  const values = runtimeParameterNames.reduce<Record<string, string>>(
    (parameters, name) => {
      const value = process.env[name];
      if (value) parameters[name] = value;
      return parameters;
    },
    {},
  );
  const client = new SSMClient({
    region: process.env.AWS_REGION,
  });

  try {
    await new ParameterStoreProvisioner(client).putSecureStrings(
      environment,
      values,
    );
    console.info(
      `Provisioned ${runtimeParameterNames.length} runtime parameters for the selected environment.`,
    );
  } finally {
    client.destroy();
  }
}

main().catch((error: unknown) => {
  const errorType =
    error instanceof Error ? error.name : 'UnknownProvisioningError';
  console.error(`Runtime parameter provisioning failed: ${errorType}`);
  process.exitCode = 1;
});
