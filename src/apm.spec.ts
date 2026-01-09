jest.mock('elastic-apm-node', () => ({
  start: jest.fn(),
}));

describe('apm bootstrap', () => {
  it('starts apm on import', async () => {
    await import('./apm');
    const apm = await import('elastic-apm-node');
    expect(apm.start).toHaveBeenCalled();
  });
});
