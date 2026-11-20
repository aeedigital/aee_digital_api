import { SQSEvent } from 'aws-lambda';
import { processSummaryRefreshBatch } from '../summary-updates.lambda';

const validEvent = {
  schemaVersion: 'center.summary-refresh.v1',
  eventId: 'center-summary-refresh-s1',
  summaryId: 's1',
  centroId: 'c1',
  sourceVersion: {
    updatedAt: '2026-03-02T10:00:00.000Z',
    createdAt: '2026-03-01T10:00:00.000Z',
    summaryId: 's1',
  },
};

function sqsEvent(
  records: Array<{ messageId: string; body: string }>,
): SQSEvent {
  return {
    Records: records.map((record) => ({
      messageId: record.messageId,
      body: record.body,
    })) as SQSEvent['Records'],
  } as SQSEvent;
}

describe('processSummaryRefreshBatch', () => {
  it('marks invalid records as failures without invoking the processor', async () => {
    const processor = { refresh: jest.fn().mockResolvedValue(undefined) };

    await expect(
      processSummaryRefreshBatch(
        sqsEvent([{ messageId: 'm1', body: '{invalid json' }]),
        processor,
      ),
    ).resolves.toEqual({
      batchItemFailures: [{ itemIdentifier: 'm1' }],
    });
    expect(processor.refresh).not.toHaveBeenCalled();
  });

  it('acknowledges successfully processed records', async () => {
    const processor = { refresh: jest.fn().mockResolvedValue(undefined) };

    await expect(
      processSummaryRefreshBatch(
        sqsEvent([{ messageId: 'm1', body: JSON.stringify(validEvent) }]),
        processor,
      ),
    ).resolves.toEqual({ batchItemFailures: [] });
    expect(processor.refresh).toHaveBeenCalledWith('c1');
  });

  it('returns only failed record identifiers for partial batch failures', async () => {
    const processor = {
      refresh: jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('database unavailable')),
    };

    await expect(
      processSummaryRefreshBatch(
        sqsEvent([
          { messageId: 'm1', body: JSON.stringify(validEvent) },
          {
            messageId: 'm2',
            body: JSON.stringify({ ...validEvent, eventId: 'event-2' }),
          },
        ]),
        processor,
      ),
    ).resolves.toEqual({
      batchItemFailures: [{ itemIdentifier: 'm2' }],
    });
  });

  it('processes duplicate events again so pending geocoding can be retried', async () => {
    const processor = { refresh: jest.fn().mockResolvedValue(undefined) };
    const duplicate = JSON.stringify(validEvent);

    await processSummaryRefreshBatch(
      sqsEvent([
        { messageId: 'm1', body: duplicate },
        { messageId: 'm2', body: duplicate },
      ]),
      processor,
    );

    expect(processor.refresh).toHaveBeenCalledTimes(2);
    expect(processor.refresh).toHaveBeenNthCalledWith(1, 'c1');
    expect(processor.refresh).toHaveBeenNthCalledWith(2, 'c1');
  });
});
