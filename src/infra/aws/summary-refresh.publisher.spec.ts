import { PublishCommand } from '@aws-sdk/client-sns';
import { SummaryRefreshPublisher } from './summary-refresh.publisher';

describe('SummaryRefreshPublisher', () => {
  const event = {
    schemaVersion: 'center.summary-refresh.v1' as const,
    eventId: 'center-summary-refresh-s1',
    summaryId: 's1',
    centroId: 'c1',
    sourceVersion: {
      updatedAt: '2026-03-02T10:00:00.000Z',
      createdAt: '2026-03-01T10:00:00.000Z',
      summaryId: 's1',
    },
  };

  it('publishes the event unchanged to the configured topic', async () => {
    const client = { send: jest.fn().mockResolvedValue({ MessageId: 'm1' }) };
    const publisher = new SummaryRefreshPublisher(
      client as never,
      'arn:aws:sns:us-east-1:123456789012:center-summary-refresh',
    );

    await publisher.publish(event);

    expect(client.send).toHaveBeenCalledTimes(1);
    const command = client.send.mock.calls[0]![0] as PublishCommand;
    expect(command.input).toEqual({
      TopicArn:
        'arn:aws:sns:us-east-1:123456789012:center-summary-refresh',
      Message: JSON.stringify(event),
    });
  });

  it('rejects publishing when the topic is not configured', async () => {
    const publisher = new SummaryRefreshPublisher({ send: jest.fn() } as never, '');

    await expect(publisher.publish(event)).rejects.toThrow(
      'SUMMARY_CENTER_REFRESH_TOPIC_ARN is not configured',
    );
  });
});
