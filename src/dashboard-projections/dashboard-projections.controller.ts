import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { IsOptional, Matches } from 'class-validator';
import { CadastroInfoAppService } from '../application/cadastro-info/cadastro-info.service';
import { DashboardProjectionsService } from './dashboard-projections.service';

class ProjectionRangeDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string;
}

@Controller('dashboard-projections')
export class DashboardProjectionsController {
  constructor(
    private readonly projections: DashboardProjectionsService,
    private readonly cadastroInfo: CadastroInfoAppService,
  ) {}

  @Get('global')
  async global(@Query(ValidationPipe) range: ProjectionRangeDto) {
    return this.query('global', undefined, range);
  }

  @Get('regions/:id')
  async region(
    @Param('id') id: string,
    @Query(ValidationPipe) range: ProjectionRangeDto,
  ) {
    return this.query('region', id, range);
  }

  private async query(
    scopeType: 'global' | 'region',
    scopeId: string | undefined,
    range: ProjectionRangeDto,
  ) {
    if (Boolean(range.from) !== Boolean(range.to)) {
      throw new BadRequestException('from and to must be provided together');
    }
    if (range.from && range.to && range.from > range.to) {
      throw new BadRequestException('from must be before or equal to to');
    }
    const active = await this.cadastroInfo.findActive();
    return this.projections.query({
      scopeType,
      scopeId,
      cycleId: active.cycleId,
      from: range.from,
      to: range.to,
    });
  }
}
