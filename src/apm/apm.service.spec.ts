jest.mock('elastic-apm-node', () => ({
  start: jest.fn(),
}));

describe('apm service bootstrap', () => {
  it('starts apm on import', async () => {
    await import('./apm.service');
    const apm = await import('elastic-apm-node');
    expect(apm.start).toHaveBeenCalled();
  });
});
