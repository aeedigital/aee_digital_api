import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class LocationUpdateTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const configuredToken = process.env.LOCATION_UPDATE_TOKEN?.trim();
    if (!configuredToken) {
      throw new ServiceUnavailableException(
        'Atualização operacional de localização não configurada',
      );
    }

    const request = context.switchToHttp().getRequest();
    const receivedHeader = request.headers['x-location-update-token'];
    const receivedToken = Array.isArray(receivedHeader)
      ? receivedHeader[0]
      : receivedHeader;

    if (
      typeof receivedToken !== 'string' ||
      !this.tokensMatch(receivedToken, configuredToken)
    ) {
      throw new UnauthorizedException('Token de atualização inválido');
    }
    return true;
  }

  private tokensMatch(received: string, expected: string): boolean {
    const receivedBuffer = Buffer.from(received);
    const expectedBuffer = Buffer.from(expected);
    return (
      receivedBuffer.length === expectedBuffer.length &&
      timingSafeEqual(receivedBuffer, expectedBuffer)
    );
  }
}
