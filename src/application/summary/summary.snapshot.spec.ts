import {
  buildFormSnapshot,
  deriveAttendance,
  derivePublicationAuthorization,
  flattenSnapshot,
} from './summary.snapshot';
import { Form } from '../../domain/entities/form';
import { Answer } from '../../domain/entities/answer';

describe('summary snapshot v2', () => {
  const form: Form = {
    id: 'f1',
    name: 'Cadastro',
    version: 2,
    createdBy: 'u1',
    pages: [{
      name: 'Atividades',
      quizes: [{
        category: 'Assistência Espiritual',
        questions: [{
          isMultiple: true,
          group: [
            { id: 'day', question: 'Dia da semana', answerType: 'String' },
            { id: 'time', question: 'Horário de Início', answerType: 'Time' },
            { id: 'note', question: 'Observação', answerType: 'String' },
          ],
        }],
      }, {
        category: 'Consentimento',
        questions: [{
          isMultiple: false,
          group: [{
            id: '659467a52f490be057cc4341',
            question: 'Autoriza divulgar no site?',
            answerType: 'Boolean',
          }],
        }],
      }],
    }],
  };

  const answers: Answer[] = [
    { id: 'a1', centroId: 'c1', questionId: 'day', answer: 'Segunda-feira', groupInstanceId: 'g1', groupOccurrenceOrder: 0 },
    { id: 'a2', centroId: 'c1', questionId: 'time', answer: '19h30', groupInstanceId: 'g1', groupOccurrenceOrder: 0 },
    { id: 'a3', centroId: 'c1', questionId: 'day', answer: 'terça', groupInstanceId: 'g2', groupOccurrenceOrder: 1 },
    { id: 'a4', centroId: 'c1', questionId: 'time', answer: '20:00', groupInstanceId: 'g2', groupOccurrenceOrder: 1 },
    { id: 'a5', centroId: 'c1', questionId: '659467a52f490be057cc4341', answer: 'TRUE' },
  ];

  it('preserves every occurrence and blank answer in the snapshot', () => {
    const flat = flattenSnapshot(buildFormSnapshot(form, answers));
    expect(flat.filter((item) => item.questionId === 'day')).toHaveLength(2);
    expect(flat.filter((item) => item.questionId === 'note')).toEqual([
      expect.objectContaining({ answer: '', groupInstanceId: 'g1' }),
      expect.objectContaining({ answer: '', groupInstanceId: 'g2' }),
    ]);
  });

  it('derives normalized attendance and publication consent', () => {
    const snapshot = buildFormSnapshot(form, answers);
    expect(derivePublicationAuthorization(snapshot)).toBe(true);
    expect(deriveAttendance(snapshot).activities[0]).toEqual(
      expect.objectContaining({
        code: 'ASSISTENCIA_ESPIRITUAL',
        audience: 'PUBLICO_GERAL',
        encounters: [
          expect.objectContaining({ day: 'SEGUNDA-FEIRA', startTime: '19:30' }),
          expect.objectContaining({ day: 'TERCA-FEIRA', startTime: '20:00' }),
        ],
      }),
    );
  });
});
