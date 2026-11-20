import { Injectable } from '@nestjs/common';
import {
  GetParametersCommand,
  SSMClient,
} from '@aws-sdk/client-ssm';

@Injectable()
export class ParameterStoreService {
  private readonly cache = new Map<string, string>();

  constructor(
    private readonly client: Pick<SSMClient, 'send'>,
    private readonly env: NodeJS.ProcessEnv = process.env,
  ) {}

  async load(names: readonly string[]): Promise<Record<string, string>> {
    const uniqueNames = [...new Set(names)];
    if (uniqueNames.length === 0) return {};

    const environment = this.env.PARAMETER_ENVIRONMENT?.trim();
    if (!environment) {
      return uniqueNames.reduce<Record<string, string>>((values, name) => {
        const value = this.env[name];
        if (value?.trim()) values[name] = value;
        return values;
      }, {});
    }

    const project = this.env.PARAMETER_PROJECT?.trim();
    if (!project || !/^[a-zA-Z0-9_-]+$/.test(project)) {
      throw new Error('PARAMETER_PROJECT must be configured when PARAMETER_ENVIRONMENT is set');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(environment)) {
      throw new Error('PARAMETER_ENVIRONMENT contains an invalid path segment');
    }
    if (uniqueNames.some((name) => !/^[A-Z][A-Z0-9_]*$/.test(name))) {
      throw new Error('Runtime parameter names must be uppercase identifiers');
    }

    const paths = new Map(
      uniqueNames.map((name) => [name, `/${project}/${environment}/${name}`]),
    );
    const uncached = [...paths.values()].filter((path) => !this.cache.has(path));

    for (let index = 0; index < uncached.length; index += 10) {
      const batch = uncached.slice(index, index + 10);
      const response = await this.client.send(
        new GetParametersCommand({
          Names: batch,
          WithDecryption: true,
        }),
      );

      for (const parameter of response.Parameters ?? []) {
        if (parameter.Name && parameter.Value?.trim()) {
          this.cache.set(parameter.Name, parameter.Value);
        }
      }

      const missing = batch.filter((path) => !this.cache.has(path));
      if (missing.length > 0) {
        const missingNames = missing
          .map((path) => [...paths.entries()].find(([, parameterPath]) => parameterPath === path)?.[0])
          .filter((name): name is string => Boolean(name));
        throw new Error(
          `Required runtime parameter is missing: ${missingNames.join(', ')}`,
        );
      }
    }

    return uniqueNames.reduce<Record<string, string>>((values, name) => {
      const value = this.cache.get(`/${project}/${environment}/${name}`);
      if (value !== undefined) values[name] = value;
      return values;
    }, {});
  }
}
