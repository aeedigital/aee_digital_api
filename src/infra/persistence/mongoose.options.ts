import { ConfigService } from '@nestjs/config';

const parsePositiveInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export function createMongooseConnectionOptions(configService: ConfigService) {
  const uri = configService.get<string>('MONGODB_URI')?.trim();
  if (!uri) {
    throw new Error(
      'MONGODB_URI must be configured when Mongo persistence is enabled',
    );
  }

  return {
    uri,
    retryReads: true,
    retryWrites: true,
    family: 4 as const,
    appName: 'aee_digital_api',
    minPoolSize: 0,
    maxPoolSize: parsePositiveInt(
      configService.get<string>('MONGODB_MAX_POOL_SIZE'),
      10,
    ),
    maxIdleTimeMS: parsePositiveInt(
      configService.get<string>('MONGODB_MAX_IDLE_TIME_MS'),
      30000,
    ),
    connectTimeoutMS: parsePositiveInt(
      configService.get<string>('MONGODB_CONNECT_TIMEOUT_MS'),
      10000,
    ),
    socketTimeoutMS: parsePositiveInt(
      configService.get<string>('MONGODB_SOCKET_TIMEOUT_MS'),
      45000,
    ),
    serverSelectionTimeoutMS: parsePositiveInt(
      configService.get<string>('MONGODB_SERVER_SELECTION_TIMEOUT_MS'),
      5000,
    ),
  };
}
