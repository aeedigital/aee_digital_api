import { Injectable } from '@nestjs/common';
import { PutParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

@Injectable()
export class ParameterStoreProvisioner {
  constructor(
    private readonly client: Pick<SSMClient, 'send'>,
    private readonly env: NodeJS.ProcessEnv = process.env,
  ) {}

  async putSecureStrings(
    environment: string,
    values: Readonly<Record<string, string>>,
  ): Promise<void> {
    const normalizedEnvironment = environment.trim();
    if (!normalizedEnvironment) {
      throw new Error('Parameter environment is required');
    }

    const project = this.env.PARAMETER_PROJECT?.trim();
    if (!project || !/^[a-zA-Z0-9_-]+$/.test(project)) {
      throw new Error('PARAMETER_PROJECT must be configured');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(normalizedEnvironment)) {
      throw new Error('Parameter environment contains an invalid path segment');
    }

    const entries = Object.entries(values);
    if (entries.length === 0) {
      throw new Error('At least one runtime parameter is required');
    }

    for (const [name, value] of entries) {
      if (!/^[A-Z][A-Z0-9_]*$/.test(name)) {
        throw new Error('Runtime parameter names must be uppercase identifiers');
      }
      if (!value?.trim()) {
        throw new Error(`Runtime parameter value is required: ${name}`);
      }
    }

    for (const [name, value] of entries) {
      await this.client.send(
        new PutParameterCommand({
          Name: `/${project}/${normalizedEnvironment}/${name}`,
          Value: value,
          Type: 'SecureString',
          Overwrite: true,
        }),
      );
    }
  }
}
