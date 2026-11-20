import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { DashboardProjectionEventsService } from './dashboard-projection-events.service';

describe('DashboardProjectionEventsService', () => {
  const event = {
    schemaVersion: 'center.finished.v1' as const,
    eventId: 'summary-s1',
    centerId: 'c1',
    regionId: 'r1',
    cycleId: 'cycle-1',
    logicalVersion: 1786528801000,
    occurredAt: '2026-08-12T10:00:01.000Z',
    responded: true as const,
    finished: true as const,
    activityDate: '2026-08-12',
    activityCount: 1,
  };

  it('sends center.finished.v1 to the configured queue', async () => {
    const client = { send: jest.fn().mockResolvedValue({ MessageId: 'm1' }) };
    const service = new DashboardProjectionEventsService(
      client as any,
      'https://sqs.us-east-1.amazonaws.com/115186094843/dashboard-projections-queue',
    );

    await service.publishCenterFinished(event);

    expect(client.send).toHaveBeenCalledTimes(1);
    const command = client.send.mock.calls[0][0] as SendMessageCommand;
    expect(command.input).toEqual({
      QueueUrl:
        'https://sqs.us-east-1.amazonaws.com/115186094843/dashboard-projections-queue',
      MessageBody: JSON.stringify(event),
    });
  });

  it('rejects publishing when the queue is not configured', async () => {
    const service = new DashboardProjectionEventsService({ send: jest.fn() } as any, '');

    await expect(service.publishCenterFinished(event)).rejects.toThrow(
      'DASHBOARD_PROJECTIONS_QUEUE_URL is not configured',
    );
  });
});
