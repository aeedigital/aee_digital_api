import { BadRequestException } from '@nestjs/common';
import { CadastroInfoAppService } from '../application/cadastro-info/cadastro-info.service';
import { DashboardProjectionsController } from './dashboard-projections.controller';
import { DashboardProjectionsService } from './dashboard-projections.service';

describe('DashboardProjectionsController', () => {
  const projections = { query: jest.fn() };
  const cadastroInfo = { findActive: jest.fn() };
  let controller: DashboardProjectionsController;

  beforeEach(() => {
    jest.clearAllMocks();
    cadastroInfo.findActive.mockResolvedValue({ cycleId: 'cycle-1' });
    projections.query.mockResolvedValue({
      schemaVersion: 'projection.query.v1',
      scopeType: 'global',
      found: true,
      totals: { totalCenters: 1, respondingCenters: 1, finishedCenters: 1 },
    });
    controller = new DashboardProjectionsController(
      projections as unknown as DashboardProjectionsService,
      cadastroInfo as unknown as CadastroInfoAppService,
    );
  });

  it('queries the global projection for the active cycle', async () => {
    await controller.global({ from: '2026-08-01', to: '2026-08-12' });

    expect(projections.query).toHaveBeenCalledWith({
      scopeType: 'global',
      scopeId: undefined,
      cycleId: 'cycle-1',
      from: '2026-08-01',
      to: '2026-08-12',
    });
  });

  it('queries one regional projection for the active cycle', async () => {
    await controller.region('region-1', {});

    expect(projections.query).toHaveBeenCalledWith({
      scopeType: 'region',
      scopeId: 'region-1',
      cycleId: 'cycle-1',
      from: undefined,
      to: undefined,
    });
  });

  it('rejects incomplete or reversed ranges before invoking the Lambda', async () => {
    await expect(controller.global({ from: '2026-08-01' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      controller.global({ from: '2026-08-12', to: '2026-08-01' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(projections.query).not.toHaveBeenCalled();
  });
});
