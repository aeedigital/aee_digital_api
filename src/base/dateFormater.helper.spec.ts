import { format } from './dateFormater.helper';

describe('dateFormater.helper', () => {
  it('converts dd/mm/yyyy to Date', () => {
    const result = format('05/08/2024', 'dd/mm/yyyy');
    expect(result.toISOString().startsWith('2024-08-05')).toBe(true);
  });
});
