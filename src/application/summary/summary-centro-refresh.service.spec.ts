import { Centro } from '../../domain/entities/centro';
import { CentroRepository } from '../../domain/repositories/centro.repository';
import { Summary } from '../../domain/entities/summary';
import { SummaryRepository } from '../../domain/repositories/summary.repository';
import { hashAddress, toCentroAddress } from '../../centros/location/location.utils';
import { GeocodingService } from '../centros/geocoding.service';
import { SummaryCentroRefreshService } from './summary-centro-refresh.service';

const addressQuestionId = 'address-question';
const phoneQuestionId = '61df432fdf23b90014a944b0';
const siteQuestionId = '61df432fdf23b90014a944b3';
const authorizationQuestionId = '659467a52f490be057cc4341';

const currentAddress = toCentroAddress({
  ENDERECO: 'Rua Antiga, 10',
  CEP: '01234-000',
  BAIRRO: 'Centro',
  CIDADE: 'São Paulo',
  ESTADO: 'SP',
  PAIS: 'Brasil',
});

const currentCentro: Centro = {
  id: 'c1',
  nomeCentro: 'Centro',
  nomeCurto: 'C',
  cnpjCentro: '123',
  dataFundacao: '2020-01-01',
  regional: 'r1',
  endereco: currentAddress.ENDERECO,
  cep: currentAddress.CEP,
  bairro: currentAddress.BAIRRO,
  cidade: currentAddress.CIDADE,
  estado: currentAddress.ESTADO,
  pais: currentAddress.PAIS,
  funcionamento: {
    segunda: [],
    terca: [],
    quarta: [],
    quinta: [],
    sexta: [],
    sabado: [],
    domingo: [],
  },
  location: {
    status: 'CONFIRMADA',
    addressHash: hashAddress(currentAddress),
  },
};

function createSummary(
  answers: Array<{ questionId: string; rawValue: string }>,
  overrides: Partial<Summary> = {},
): Summary {
  const updatedAt = new Date('2026-03-02T10:00:00.000Z');
  const createdAt = new Date('2026-03-01T10:00:00.000Z');
  return {
    id: 's1',
    formId: 'f1',
    centroId: 'c1',
    questions: [],
    schemaVersion: 2,
    formSnapshot: {
      id: 'f1',
      name: 'Cadastro',
      version: 1,
      pages: [
        {
          pageKey: 'page:0',
          pageName: 'Cadastro',
          order: 0,
          quizzes: [
            {
              quizKey: 'page:0/quiz:0',
              category: 'Cadastro',
              order: 0,
              groups: [
                {
                  groupKey: 'page:0/quiz:0/group:0',
                  isMultiple: false,
                  order: 0,
                  questions: [
                    {
                      questionId: addressQuestionId,
                      label: 'Endereço',
                      answerType: 'String',
                      isRequired: false,
                      presetValues: [],
                      order: 0,
                    },
                    {
                      questionId: phoneQuestionId,
                      label: 'Telefone',
                      answerType: 'String',
                      isRequired: false,
                      presetValues: [],
                      order: 1,
                    },
                    {
                      questionId: siteQuestionId,
                      label: 'Site',
                      answerType: 'String',
                      isRequired: false,
                      presetValues: [],
                      order: 2,
                    },
                    {
                      questionId: authorizationQuestionId,
                      label: 'Autoriza divulgar no site?',
                      answerType: 'Boolean',
                      isRequired: false,
                      presetValues: [],
                      order: 3,
                    },
                  ],
                  occurrences: [
                    {
                      occurrenceId: 'occurrence:0',
                      order: 0,
                      answers: answers.map((answer) => ({
                        ...answer,
                        displayValue: answer.rawValue,
                      })),
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    attendance: {
      activities: [
        {
          code: 'ASSISTENCIA_ESPIRITUAL',
          name: 'Assistência Espiritual',
          encounters: [
            {
              day: 'SEGUNDA-FEIRA',
              startTime: '19:30',
              groupInstanceId: 'activity:0',
            },
          ],
        },
      ],
      audiences: [],
    },
    createdAt,
    updatedAt,
    ...overrides,
  };
}

describe('SummaryCentroRefreshService', () => {
  let summaryRepository: { findLatestByCentroIds: jest.Mock };
  let centroRepository: {
    findById: jest.Mock;
    applySummaryProfileIfNewer: jest.Mock;
  };
  let geocodingService: { updateLocation: jest.Mock };
  let service: SummaryCentroRefreshService;

  beforeEach(() => {
    summaryRepository = {
      findLatestByCentroIds: jest.fn(),
    };
    centroRepository = {
      findById: jest.fn().mockResolvedValue(currentCentro),
      applySummaryProfileIfNewer: jest.fn().mockResolvedValue(true),
    };
    geocodingService = {
      updateLocation: jest.fn().mockResolvedValue(undefined),
    };
    service = new SummaryCentroRefreshService(
      summaryRepository as unknown as SummaryRepository,
      centroRepository as unknown as CentroRepository,
      geocodingService as unknown as GeocodingService,
    );
  });

  it('derives address, authorized contacts, and schedule from the persisted snapshot', async () => {
    const summary = createSummary([
      { questionId: addressQuestionId, rawValue: 'Rua Nova, 123' },
      { questionId: phoneQuestionId, rawValue: '11 3333-4444' },
      { questionId: siteQuestionId, rawValue: 'https://centro.example' },
      { questionId: authorizationQuestionId, rawValue: 'SIM' },
    ]);
    summary.publicationAuthorized = true;
    summaryRepository.findLatestByCentroIds.mockResolvedValue([summary]);

    await service.refresh('c1');

    expect(centroRepository.applySummaryProfileIfNewer).toHaveBeenCalledWith(
      'c1',
      {
        updatedAt: summary.updatedAt,
        createdAt: summary.createdAt,
        summaryId: 's1',
      },
      expect.objectContaining({
        endereco: 'Rua Nova, 123',
        telefone: '11 3333-4444',
        site: 'https://centro.example',
        funcionamento: {
          segunda: ['19:30'],
          terca: [],
          quarta: [],
          quinta: [],
          sexta: [],
          sabado: [],
          domingo: [],
        },
        location: expect.objectContaining({
          status: 'PENDENTE',
          addressHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        }),
      }),
    );
    expect(geocodingService.updateLocation).toHaveBeenCalledWith('c1');
  });

  it('clears invalid contacts even when disclosure is authorized', async () => {
    const summary = createSummary([
      { questionId: phoneQuestionId, rawValue: '   ' },
      { questionId: siteQuestionId, rawValue: 'Não se aplica' },
    ]);
    summary.publicationAuthorized = true;
    summaryRepository.findLatestByCentroIds.mockResolvedValue([summary]);

    await service.refresh('c1');

    expect(centroRepository.applySummaryProfileIfNewer).toHaveBeenCalledWith(
      'c1',
      expect.any(Object),
      expect.objectContaining({ telefone: null, site: null }),
    );
  });

  it('clears contacts when the latest summary does not authorize disclosure', async () => {
    const summary = createSummary([
      { questionId: phoneQuestionId, rawValue: '11 3333-4444' },
      { questionId: siteQuestionId, rawValue: 'https://centro.example' },
    ]);
    summary.publicationAuthorized = false;
    summaryRepository.findLatestByCentroIds.mockResolvedValue([summary]);

    await service.refresh('c1');

    expect(centroRepository.applySummaryProfileIfNewer).toHaveBeenCalledWith(
      'c1',
      expect.any(Object),
      expect.objectContaining({ telefone: null, site: null }),
    );
  });

  it('preserves missing address and functioning while using versioned persistence', async () => {
    const summary = createSummary(
      [{ questionId: authorizationQuestionId, rawValue: 'FALSE' }],
      {
        attendance: { activities: [], audiences: [] },
      },
    );
    summaryRepository.findLatestByCentroIds.mockResolvedValue([summary]);

    await service.refresh('c1');

    const [, profile] =
      centroRepository.applySummaryProfileIfNewer.mock.calls[0]!;
    expect(profile).not.toHaveProperty('endereco');
    expect(profile).not.toHaveProperty('funcionamento');
    expect(centroRepository.applySummaryProfileIfNewer).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({
        summaryId: 's1',
        createdAt: summary.createdAt,
        updatedAt: summary.updatedAt,
      }),
      expect.any(Object),
    );
  });

  it('retries geocoding when a duplicate summary finds a pending location', async () => {
    const summary = createSummary([]);
    summaryRepository.findLatestByCentroIds.mockResolvedValue([summary]);
    centroRepository.applySummaryProfileIfNewer.mockResolvedValue(false);
    centroRepository.findById.mockResolvedValue({
      ...currentCentro,
      location: {
        status: 'PENDENTE',
        addressHash: hashAddress(currentAddress),
      },
    });

    await service.refresh('c1');

    expect(geocodingService.updateLocation).toHaveBeenCalledWith('c1');
  });
});
