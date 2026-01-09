export const extractId = (value: any): string | undefined => {
  if (value === null || value === undefined) return undefined;
  return value._id?.toString?.() ?? value.toString?.() ?? value;
};
