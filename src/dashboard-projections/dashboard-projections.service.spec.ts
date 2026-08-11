import { DashboardProjectionsService } from './dashboard-projections.service';

describe('DashboardProjectionsService', () => {
  const send = jest.fn();
  let service: DashboardProjectionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DashboardProjectionsService({ send } as any, 'dashboard-projections');
  });

  it('invokes and parses a regional projection', async () => {
    send.mockResolvedValue({
      StatusCode: 200,
      Payload: Buffer.from(JSON.stringify({
        schemaVersion: 'projection.query.v1',
        scopeType: 'region',
        scopeId: 'r1',
        found: true,
        totals: { totalCenters: 2, respondingCenters: 2, finishedCenters: 1 },
      })),
    });

    await expect(service.query({
      scopeType: 'region',
      scopeId: 'r1',
      cycleId: 'cycle-1',
      from: '2026-01-01',
      to: '2026-01-31',
    })).resolves.toEqual(expect.objectContaining({ found: true, scopeId: 'r1' }));

    const command = send.mock.calls[0][0];
    expect(JSON.parse(Buffer.from(command.input.Payload).toString('utf8'))).toEqual({
      schemaVersion: 'projection.query.v1',
      scopeType: 'region',
      scopeId: 'r1',
      cycleId: 'cycle-1',
      from: '2026-01-01',
      to: '2026-01-31',
    });
  });

  it.each([
    { StatusCode: 500, Payload: Buffer.from('{}') },
    { StatusCode: 200, FunctionError: 'Unhandled', Payload: Buffer.from('{}') },
    { StatusCode: 200, Payload: new Uint8Array() },
    { StatusCode: 200, Payload: Buffer.from('not-json') },
  ])('rejects invalid Lambda response %#', async (response) => {
    send.mockResolvedValue(response);
    await expect(service.query({ scopeType: 'global', cycleId: 'cycle-1' }))
      .rejects.toThrow('dashboard projection invocation failed');
  });

  it('validates scope and range before invoking', async () => {
    await expect(service.query({ scopeType: 'region', cycleId: 'cycle-1' }))
      .rejects.toThrow('scopeId is required');
    await expect(service.query({ scopeType: 'global', cycleId: 'cycle-1', from: '2026-01-01' }))
      .rejects.toThrow('from and to must be provided together');
    expect(send).not.toHaveBeenCalled();
  });

  it('deduplicates region ids in a batch invocation', async () => {
    send.mockResolvedValue({
      StatusCode: 200,
      Payload: Buffer.from(JSON.stringify({ schemaVersion: 'projection.query.batch.v1', items: [] })),
    });
    await service.queryRegions({ scopeIds: ['r1', 'r1', 'r2'], cycleId: 'cycle-1' });
    const command = send.mock.calls[0][0];
    expect(JSON.parse(Buffer.from(command.input.Payload).toString('utf8')).scopeIds).toEqual(['r1', 'r2']);
  });
});
