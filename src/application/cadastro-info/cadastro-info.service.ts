import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FormsAppService } from '../forms/forms.service';
import {
  CadastroInfoRepository,
  CreateCadastroInfoInput,
} from '../../domain/repositories/cadastro-info.repository';
import { CadastroInfo } from '../../domain/entities/cadastro-info';
import { CADASTRO_INFO_REPOSITORY } from '../../domain/repositories/repository.tokens';

@Injectable()
export class CadastroInfoAppService {
  constructor(
    @Inject(CADASTRO_INFO_REPOSITORY)
    private readonly repository: CadastroInfoRepository,
    private readonly formsService: FormsAppService,
  ) {}

  private parseBrazilDate(field: string, value: string): Date {
    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) {
      throw new BadRequestException(`${field} must be in DD/MM/YYYY format`);
    }
    const [, ddRaw, mmRaw, yyyyRaw] = match;
    const day = Number(ddRaw);
    const month = Number(mmRaw);
    const year = Number(yyyyRaw);
    const date = new Date(year, month - 1, day);

    const isValidDate =
      !Number.isNaN(date.getTime()) &&
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day;

    if (!isValidDate) {
      throw new BadRequestException(`${field} is not a valid date`);
    }
    return date;
  }

  private validateDateRange(startDate: string, endDate: string): void {
    const start = this.parseBrazilDate('START_DATE', startDate);
    const end = this.parseBrazilDate('END_DATE', endDate);

    if (start.getTime() > end.getTime()) {
      throw new BadRequestException('START_DATE must be before or equal to END_DATE');
    }
  }

  async save(data: CreateCadastroInfoInput): Promise<CadastroInfo> {
    this.validateDateRange(data.startDate, data.endDate);
    await this.formsService.findOne(data.formId);

    const active = await this.repository.findActive();
    if (!active) {
      return this.repository.create(data);
    }

    return this.repository.update(active.id, data);
  }

  async findActive(): Promise<CadastroInfo> {
    const active = await this.repository.findActive();
    if (!active) {
      throw new NotFoundException('Cadastro info not found');
    }
    return active;
  }
}
