let capturedValidator: ((value: any) => boolean) | null = null;

jest.mock('class-validator', () => {
  const actual = jest.requireActual('class-validator');
  return {
    ...actual,
    Validate: (validator: any) => {
      capturedValidator = validator;
      return () => undefined;
    },
  };
});

describe('IsStringOrBoolean', () => {
  it('validates boolean and string boolean values', async () => {
    const { IsStringOrBoolean } = await import('./stringorboolean.validator');
    IsStringOrBoolean()({} as any, 'value');

    expect(capturedValidator).toBeDefined();
    expect(capturedValidator?.(true)).toBe(true);
    expect(capturedValidator?.('true')).toBe(true);
    expect(capturedValidator?.('false')).toBe(true);
    expect(capturedValidator?.(123)).toBe(false);
  });
});
