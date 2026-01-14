export const getPersistenceDriver = (): string =>
  (process.env.PERSISTENCE_DRIVER || 'mongo').toLowerCase();

export const isMemoryDriver = (): boolean => getPersistenceDriver() === 'memory';
