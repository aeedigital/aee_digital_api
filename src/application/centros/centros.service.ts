import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CentroAddress,
  CentroFilter,
  CentroRepository,
  CreateCentroInput,
  SaveCentroLocationInput,
  UpdateCentroInput,
} from '../../domain/repositories/centro.repository';
import { Centro, CentroLocation } from '../../domain/entities/centro';
import { CENTRO_REPOSITORY } from '../../domain/repositories/repository.tokens';
import { SummaryAppService } from '../summary/summary.service';
import { SummaryFilter } from '../../domain/repositories/summary.repository';
import { Summary } from '../../domain/entities/summary';
import {
  hasSufficientAddress,
  hashAddress,
  isValidCoordinate,
  toCentroAddress,
} from '../../centros/location/location.utils';

const ADDRESS_FIELDS: (keyof CentroAddress)[] = [
  'endereco',
  'cep',
  'bairro',
  'cidade',
  'estado',
  'pais',
];

export type CentroFindOptions = {
  includeAttendance?: boolean;
};

@Injectable()
export class CentrosAppService {
  constructor(
    @Inject(CENTRO_REPOSITORY)
    private readonly repository: CentroRepository,
    private readonly summariesService: SummaryAppService,
  ) {}

  create(data: CreateCentroInput): Promise<Centro> {
    return this.repository.create({
      ...data,
      location: this.pendingLocation(data),
    });
  }

  async findAll(
    filter?: CentroFilter,
    options: CentroFindOptions = {},
  ): Promise<Centro[]> {
    const centros = await this.repository.findAll(filter);
    return options.includeAttendance
      ? this.withLatestAttendance(centros)
      : centros;
  }

  async findOne(id: string): Promise<Centro> {
    const centro = await this.repository.findById(id);
    if (!centro) {
      throw new NotFoundException('Centro not found');
    }
    return (await this.withLatestAttendance([centro]))[0];
  }

  async update(id: string, data: UpdateCentroInput): Promise<Centro> {
    const current = await this.findOne(id);
    const addressChanged = ADDRESS_FIELDS.some((field) =>
      Object.prototype.hasOwnProperty.call(data, field),
    );

    if (!addressChanged) {
      return this.repository.update(id, data);
    }

    const merged = { ...current, ...data };
    const nextHash = this.addressHash(merged);
    return this.repository.update(id, {
      ...data,
      ...(current.location?.addressHash === nextHash
        ? {}
        : { location: this.pendingLocation(merged) }),
    });
  }

  async saveLocation(id: string, data: SaveCentroLocationInput): Promise<Centro> {
    const current = await this.findOne(id);
    if (data.addressHash !== this.addressHash(current)) {
      throw new ConflictException(
        'O endereço do centro mudou depois da consulta de geocodificação',
      );
    }

    return this.repository.saveLocation(
      id,
      this.toAddress(current),
      this.toStoredLocation(data),
    );
  }

  updateOrCreate(
    filter: Partial<CentroFilter> & { id?: string },
    data: CreateCentroInput,
  ): Promise<Centro> {
    return this.repository.updateOrCreate(filter, data);
  }

  delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  findSummaries(id: string, filter: SummaryFilter): Promise<Summary[]> {
    const query: SummaryFilter = { ...filter, centroId: id };
    return this.summariesService.findAll(query);
  }

  private async withLatestAttendance(centros: Centro[]): Promise<Centro[]> {
    const ids = centros.map((centro) => centro.id).filter(Boolean);
    if (!ids.length) return centros;
    const summaries = await this.summariesService.findLatestByCentroIds({
      centroIds: ids,
      fields:
        'CENTRO_ID,ATENDIMENTOS,DIVULGACAO_AUTORIZADA,createdAt,updatedAt',
    });
    const byCentro = new Map(
      summaries.map((summary) => [summary.centroId, summary]),
    );
    return centros.map((centro) => {
      const summary = byCentro.get(centro.id);
      if (!summary?.publicationAuthorized || !summary.attendance) return centro;
      return {
        ...centro,
        funcionamento: this.toLegacyFuncionamento(summary),
        attendanceSummary: summary,
      };
    });
  }

  private toLegacyFuncionamento(summary: Summary): Centro['funcionamento'] {
    const result: Centro['funcionamento'] = {
      segunda: [],
      terca: [],
      quarta: [],
      quinta: [],
      sexta: [],
      sabado: [],
      domingo: [],
    };
    const keyByDay: Record<string, keyof Centro['funcionamento']> = {
      'SEGUNDA-FEIRA': 'segunda',
      'TERCA-FEIRA': 'terca',
      'QUARTA-FEIRA': 'quarta',
      'QUINTA-FEIRA': 'quinta',
      'SEXTA-FEIRA': 'sexta',
      SABADO: 'sabado',
      DOMINGO: 'domingo',
    };
    summary.attendance?.activities.forEach((activity) =>
      activity.encounters.forEach((encounter) => {
        const key = keyByDay[encounter.day];
        if (key && !result[key].includes(encounter.startTime)) {
          result[key].push(encounter.startTime);
        }
      }),
    );
    Object.values(result).forEach((times) => times.sort());
    return result;
  }

  private pendingLocation(source: Partial<Centro>): CentroLocation {
    const address = this.toHashAddress(source);
    return {
      status: 'PENDENTE',
      addressHash: hashAddress(address),
      ...(hasSufficientAddress(address)
        ? {}
        : { errorCode: 'ENDERECO_INSUFICIENTE' }),
    };
  }

  private toStoredLocation(data: SaveCentroLocationInput): CentroLocation {
    const hasPoint =
      data.status === 'CONFIRMADA' || data.status === 'APROXIMADA';

    if (
      hasPoint &&
      !isValidCoordinate(data.latitude!, data.longitude!)
    ) {
      throw new BadRequestException(
        'Latitude ou longitude fora das faixas válidas',
      );
    }
    if (
      !hasPoint &&
      (data.latitude !== undefined || data.longitude !== undefined)
    ) {
      throw new BadRequestException(
        `STATUS=${data.status} não pode possuir coordenadas`,
      );
    }

    return {
      ...data,
      updatedAt: new Date(),
    };
  }

  private addressHash(source: Partial<Centro>): string {
    return hashAddress(this.toHashAddress(source));
  }

  private toHashAddress(source: Partial<Centro>) {
    return toCentroAddress({
      ENDERECO: source.endereco,
      CEP: source.cep,
      BAIRRO: source.bairro,
      CIDADE: source.cidade,
      ESTADO: source.estado,
      PAIS: source.pais,
    });
  }

  private toAddress(source: Centro): CentroAddress {
    return {
      endereco: source.endereco,
      cep: source.cep,
      bairro: source.bairro,
      cidade: source.cidade,
      estado: source.estado,
      pais: source.pais,
    };
  }
}
