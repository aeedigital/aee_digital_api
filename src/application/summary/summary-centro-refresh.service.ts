import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Centro } from '../../domain/entities/centro';
import { CentroSummaryProfile } from '../../domain/repositories/centro.repository';
import {
  CENTRO_REPOSITORY,
  SUMMARY_REPOSITORY,
} from '../../domain/repositories/repository.tokens';
import { CentroRepository } from '../../domain/repositories/centro.repository';
import { Summary } from '../../domain/entities/summary';
import { SummarySourceVersion } from '../../domain/entities/centro';
import { SummaryRepository } from '../../domain/repositories/summary.repository';
import { flattenSnapshot, derivePublicationAuthorization } from './summary.snapshot';
import { GeocodingService } from '../centros/geocoding.service';
import {
  hasSufficientAddress,
  hashAddress,
  toCentroAddress,
} from '../../centros/location/location.utils';
import { CentroAddress as GeocodingAddress } from '../../centros/location/location.types';

type CentroAddressProfileField = keyof Pick<
  CentroSummaryProfile,
  'endereco' | 'cep' | 'bairro' | 'cidade' | 'estado' | 'pais'
>;

const ADDRESS_FIELD_BY_LABEL: Record<string, CentroAddressProfileField> = {
  ENDERECO: 'endereco',
  'ENDERECO DO CENTRO': 'endereco',
  'ENDERECO DA INSTITUICAO': 'endereco',
  CEP: 'cep',
  'CODIGO POSTAL': 'cep',
  BAIRRO: 'bairro',
  CIDADE: 'cidade',
  ESTADO: 'estado',
  PAIS: 'pais',
};

const INVALID_PROFILE_VALUES = new Set([
  '',
  '-',
  'N/A',
  'NA',
  'NAN',
  'FALSE',
  'NAO INFORMADO',
  'SEM ENDERECO',
  'NAO SE APLICA',
]);

const DAY_BY_KEY: Record<string, keyof NonNullable<CentroSummaryProfile['funcionamento']>> = {
  'SEGUNDA-FEIRA': 'segunda',
  SEGUNDA: 'segunda',
  TERCA: 'terca',
  'TERCA-FEIRA': 'terca',
  QUARTA: 'quarta',
  'QUARTA-FEIRA': 'quarta',
  QUINTA: 'quinta',
  'QUINTA-FEIRA': 'quinta',
  SEXTA: 'sexta',
  'SEXTA-FEIRA': 'sexta',
  SABADO: 'sabado',
  DOMINGO: 'domingo',
};

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleUpperCase('pt-BR')
    .replace(/\s+/g, ' ');
}

function validValue(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  return INVALID_PROFILE_VALUES.has(normalizeText(text)) ? undefined : text;
}

function latestAnswerById(
  questions: Summary['questions'],
  questionId: string,
): string | undefined {
  const matches = questions.filter((question) => question.questionId === questionId);
  return matches.length ? matches[matches.length - 1].answer : undefined;
}

function authorizedToPublish(summary: Summary, questions: Summary['questions']): boolean {
  if (typeof summary.publicationAuthorized === 'boolean') {
    return summary.publicationAuthorized;
  }
  if (summary.formSnapshot) {
    return derivePublicationAuthorization(summary.formSnapshot);
  }

  const matching = questions.filter((question) =>
    question.questionId === '659467a52f490be057cc4341' ||
    (normalizeText(question.questionLabel).includes('AUTORIZA') &&
      normalizeText(question.questionLabel).includes('DIVULG') &&
      normalizeText(question.questionLabel).includes('SITE')),
  );
  return ['TRUE', 'SIM', 'S', '1'].includes(
    normalizeText(matching[matching.length - 1]?.answer),
  );
}

function normalizeTime(value: unknown): string | undefined {
  const match = /^(\d{1,2})(?::|h)(\d{2})$/i.exec(String(value ?? '').trim());
  if (!match) return undefined;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return undefined;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function deriveFunctioning(summary: Summary): CentroSummaryProfile['funcionamento'] {
  const schedule: NonNullable<CentroSummaryProfile['funcionamento']> = {
    segunda: [],
    terca: [],
    quarta: [],
    quinta: [],
    sexta: [],
    sabado: [],
    domingo: [],
  };
  const encounters = [
    ...(summary.attendance?.activities.flatMap((activity) => activity.encounters) ?? []),
    ...(summary.attendance?.audiences.flatMap((audience) => audience.encounters) ?? []),
  ];

  encounters.forEach((encounter) => {
    const day = DAY_BY_KEY[normalizeText(encounter.day)];
    const time = normalizeTime(encounter.startTime);
    if (day && time && !schedule[day].includes(time)) {
      schedule[day].push(time);
    }
  });

  Object.values(schedule).forEach((times) => times.sort());
  return encounters.length && Object.values(schedule).some((times) => times.length)
    ? schedule
    : undefined;
}

function deriveProfile(summary: Summary): CentroSummaryProfile {
  const questions = summary.formSnapshot
    ? flattenSnapshot(summary.formSnapshot)
    : summary.questions;
  const profile: CentroSummaryProfile = {};

  questions.forEach((question) => {
    const field = ADDRESS_FIELD_BY_LABEL[normalizeText(question.questionLabel)];
    if (!field) return;
    const value = validValue(question.answer);
    if (value) {
      profile[field] = value;
    }
  });

  const authorized = authorizedToPublish(summary, questions);
  profile.telefone = authorized
    ? validValue(latestAnswerById(questions, '61df432fdf23b90014a944b0'))
        ?? null
    : null;
  profile.site = authorized
    ? validValue(latestAnswerById(questions, '61df432fdf23b90014a944b3'))
        ?? null
    : null;

  const funcionamento = deriveFunctioning(summary);
  if (funcionamento) {
    profile.funcionamento = funcionamento;
  }

  return profile;
}

function sourceVersion(summary: Summary): SummarySourceVersion {
  const fallback = summary.updatedAt || summary.createdAt || new Date(0);
  return {
    updatedAt: summary.updatedAt || summary.createdAt || fallback,
    createdAt: summary.createdAt || summary.updatedAt || fallback,
    summaryId: summary.id,
  };
}

function toGeocodingAddress(centro: Centro): GeocodingAddress {
  return toCentroAddress({
    ENDERECO: centro.endereco,
    CEP: centro.cep,
    BAIRRO: centro.bairro,
    CIDADE: centro.cidade,
    ESTADO: centro.estado,
    PAIS: centro.pais,
  });
}

@Injectable()
export class SummaryCentroRefreshService {
  constructor(
    @Inject(SUMMARY_REPOSITORY)
    private readonly summariesRepository: SummaryRepository,
    @Inject(CENTRO_REPOSITORY)
    private readonly centrosRepository: CentroRepository,
    private readonly geocodingService: GeocodingService,
  ) {}

  async refresh(centroId: string): Promise<void> {
    if (!centroId.trim()) {
      throw new TypeError('centroId is required');
    }

    const [summary] = await this.summariesRepository.findLatestByCentroIds({
      centroIds: [centroId],
    });
    if (!summary) {
      throw new NotFoundException(`No summary found for center ${centroId}`);
    }
    if (summary.centroId !== centroId) {
      throw new Error('Latest summary belongs to a different center');
    }

    const centro = await this.centrosRepository.findById(centroId);
    if (!centro) {
      throw new NotFoundException(`Center ${centroId} not found`);
    }

    const profile = deriveProfile(summary);
    const previousAddress = toGeocodingAddress(centro);
    const nextAddress = toCentroAddress({
      ENDERECO: profile.endereco ?? centro.endereco,
      CEP: profile.cep ?? centro.cep,
      BAIRRO: profile.bairro ?? centro.bairro,
      CIDADE: profile.cidade ?? centro.cidade,
      ESTADO: profile.estado ?? centro.estado,
      PAIS: profile.pais ?? centro.pais,
    });
    const addressChanged =
      hashAddress(previousAddress) !== hashAddress(nextAddress);
    if (addressChanged) {
      profile.location = {
        status: 'PENDENTE',
        addressHash: hashAddress(nextAddress),
        ...(!hasSufficientAddress(nextAddress)
          ? { errorCode: 'ENDERECO_INSUFICIENTE' }
          : {}),
      };
    }

    const applied = await this.centrosRepository.applySummaryProfileIfNewer(
      centroId,
      sourceVersion(summary),
      profile,
    );
    const currentCentro = applied
      ? ({ ...centro, ...profile } as Centro)
      : await this.centrosRepository.findById(centroId);
    if (!currentCentro) {
      throw new NotFoundException(`Center ${centroId} not found`);
    }

    const currentAddress = toGeocodingAddress(currentCentro);
    const hasAddressProfile = [
      profile.endereco,
      profile.cep,
      profile.bairro,
      profile.cidade,
      profile.estado,
      profile.pais,
    ].some((value) => value !== undefined);
    const locationNeedsUpdate =
      currentCentro.location?.status === 'PENDENTE' ||
      currentCentro.location?.status === 'ERRO' ||
      (Boolean(currentCentro.location) &&
        currentCentro.location?.addressHash !== hashAddress(currentAddress));
    if (
      (applied && (addressChanged || (hasAddressProfile && !currentCentro.location))) ||
      locationNeedsUpdate
    ) {
      await this.geocodingService.updateLocation(centroId);
    }
  }
}
