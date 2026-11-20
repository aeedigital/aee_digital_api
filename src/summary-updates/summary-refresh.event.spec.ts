import { parseSummaryRefreshEvent } from './summary-refresh.event';

const validEvent = {
  schemaVersion: 'center.summary-refresh.v1',
  eventId: 'summary:s1',
  summaryId: 's1',
  centroId: 'c1',
  sourceVersion: {
    updatedAt: '2026-01-02T03:04:05.000Z',
    createdAt: '2026-01-01T03:04:05.000Z',
    summaryId: 's1',
  },
};

describe('parseSummaryRefreshEvent', () => {
  it('accepts a valid event matching the versioned contract', () => {
    expect(parseSummaryRefreshEvent(validEvent)).toEqual(validEvent);
  });

  it.each([
    { ...validEvent, schemaVersion: 'center.summary-refresh.v2' },
    { ...validEvent, unexpected: true },
    { ...validEvent, sourceVersion: { ...validEvent.sourceVersion, summaryId: '' } },
    {
      ...validEvent,
      sourceVersion: { ...validEvent.sourceVersion, updatedAt: '2026-01-02' },
    },
  ])('rejects invalid event payloads', (event) => {
    expect(() => parseSummaryRefreshEvent(event)).toThrow(TypeError);
  });
});
