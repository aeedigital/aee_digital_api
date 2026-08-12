export type ProjectionScopeType = 'center' | 'region' | 'global';

export interface DashboardProjectionQuery {
  scopeType: ProjectionScopeType;
  scopeId?: string;
  cycleId: string;
  from?: string;
  to?: string;
}

export interface ProjectionTotals {
  totalCenters: number;
  respondingCenters: number;
  finishedCenters: number;
}

export interface DashboardProjectionResponse {
  schemaVersion: 'projection.query.v1';
  scopeType: ProjectionScopeType;
  scopeId?: string;
  found: boolean;
  totals: ProjectionTotals;
  dailyActivity?: Record<string, number>;
  updatedAt?: string;
  logicalVersion?: number;
  projectionGeneration?: string;
}

export interface DashboardProjectionBatchResponse {
  schemaVersion: 'projection.query.batch.v1';
  items: DashboardProjectionResponse[];
}
