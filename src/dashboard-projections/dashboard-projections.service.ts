import { Inject, Injectable } from '@nestjs/common';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import {
  DashboardProjectionBatchResponse,
  DashboardProjectionQuery,
  DashboardProjectionResponse,
} from './dashboard-projections.types';

export const DASHBOARD_LAMBDA_CLIENT = Symbol('DASHBOARD_LAMBDA_CLIENT');
export const DASHBOARD_PROJECTIONS_FUNCTION_NAME = Symbol(
  'DASHBOARD_PROJECTIONS_FUNCTION_NAME',
);

export class DashboardProjectionUnavailableError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'DashboardProjectionUnavailableError';
    (this as Error & { cause?: unknown }).cause = cause;
  }
}

@Injectable()
export class DashboardProjectionsService {
  constructor(
    @Inject(DASHBOARD_LAMBDA_CLIENT) private readonly client: LambdaClient,
    @Inject(DASHBOARD_PROJECTIONS_FUNCTION_NAME)
    private readonly functionName: string,
  ) {}

  async query(input: DashboardProjectionQuery): Promise<DashboardProjectionResponse> {
    this.validateQuery(input);
    const response = await this.invoke<DashboardProjectionResponse>({
      schemaVersion: 'projection.query.v1',
      ...input,
      ...(input.scopeType === 'global' ? { scopeId: undefined } : {}),
    });
    this.assertProjection(response);
    return response;
  }

  async queryRegions(input: {
    scopeIds: string[];
    cycleId: string;
    from?: string;
    to?: string;
  }): Promise<DashboardProjectionBatchResponse> {
    const scopeIds = [...new Set(input.scopeIds)];
    if (!scopeIds.length || scopeIds.some((id) => !id.trim())) {
      throw new TypeError('scopeIds must contain at least one non-empty region id');
    }
    this.validateRange(input.from, input.to);
    if (!input.cycleId?.trim()) throw new TypeError('cycleId is required');
    const response = await this.invoke<DashboardProjectionBatchResponse>({
      schemaVersion: 'projection.query.batch.v1',
      scopeType: 'region',
      scopeIds,
      cycleId: input.cycleId,
      ...(input.from ? { from: input.from, to: input.to } : {}),
    });
    if (response.schemaVersion !== 'projection.query.batch.v1' || !Array.isArray(response.items)) {
      throw new DashboardProjectionUnavailableError('target Lambda returned an invalid batch payload');
    }
    response.items.forEach((item) => this.assertProjection(item));
    return response;
  }

  private validateQuery(input: DashboardProjectionQuery): void {
    if (!['center', 'region', 'global'].includes(input.scopeType)) {
      throw new TypeError('unsupported scopeType');
    }
    if (!input.cycleId?.trim()) throw new TypeError('cycleId is required');
    if (input.scopeType === 'global' && input.scopeId) {
      throw new TypeError('scopeId must be omitted for global scope');
    }
    if (input.scopeType !== 'global' && !input.scopeId?.trim()) {
      throw new TypeError('scopeId is required for center and region scopes');
    }
    this.validateRange(input.from, input.to);
  }

  private validateRange(from?: string, to?: string): void {
    if (Boolean(from) !== Boolean(to)) throw new TypeError('from and to must be provided together');
    if (!from || !to) return;
    if (!this.isISODate(from) || !this.isISODate(to) || from > to) {
      throw new TypeError('from and to must be valid YYYY-MM-DD values');
    }
  }

  private isISODate(value: string): boolean {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }

  private assertProjection(value: DashboardProjectionResponse): void {
    if (
      value.schemaVersion !== 'projection.query.v1' ||
      !['center', 'region', 'global'].includes(value.scopeType) ||
      typeof value.found !== 'boolean' ||
      !value.totals ||
      typeof value.totals.finishedCenters !== 'number'
    ) {
      throw new DashboardProjectionUnavailableError('target Lambda returned an invalid projection payload');
    }
  }

  private async invoke<T>(payload: Record<string, unknown>): Promise<T> {
    if (!this.functionName) {
      throw new DashboardProjectionUnavailableError(
        'DASHBOARD_PROJECTIONS_FUNCTION_NAME is not configured',
      );
    }
    try {
      const response = await this.client.send(
        new InvokeCommand({
          FunctionName: this.functionName,
          InvocationType: 'RequestResponse',
          Payload: Buffer.from(JSON.stringify(payload)),
        }),
      );
      if (response.StatusCode !== 200) {
        throw new Error(`unexpected Lambda status ${response.StatusCode ?? 'empty'}`);
      }
      if (response.FunctionError) {
        throw new Error(`target Lambda returned ${response.FunctionError}`);
      }
      if (!response.Payload?.byteLength) throw new Error('target Lambda returned an empty payload');
      const parsed = JSON.parse(Buffer.from(response.Payload).toString('utf8')) as T;
      if (!parsed || typeof parsed !== 'object') throw new Error('target Lambda returned an invalid payload');
      return parsed;
    } catch (error) {
      throw new DashboardProjectionUnavailableError(
        'dashboard projection invocation failed',
        error,
      );
    }
  }
}
