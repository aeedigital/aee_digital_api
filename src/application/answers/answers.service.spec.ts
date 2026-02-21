import { NotFoundException } from '@nestjs/common';
import { AnswersAppService } from './answers.service';
import { AnswerRepository } from '../../domain/repositories/answer.repository';
import { Answer } from '../../domain/entities/answer';

describe('AnswersAppService', () => {
  let service: AnswersAppService;
  let repository: jest.Mocked<AnswerRepository>;

  const sampleAnswer: Answer = {
    id: 'a1',
    questionId: 'q1',
    centroId: 'c1',
    answer: 'yes',
    quizId: 'quiz1',
  };

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findByCentroIds: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      updateOrCreate: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<AnswerRepository>;
    service = new AnswersAppService(repository);
  });

  it('creates an answer', async () => {
    repository.create.mockResolvedValue(sampleAnswer);
    await expect(
      service.create({
        questionId: 'q1',
        centroId: 'c1',
        answer: 'yes',
        quizId: 'quiz1',
      }),
    ).resolves.toEqual(sampleAnswer);
  });

  it('finds all answers', async () => {
    repository.findAll.mockResolvedValue([sampleAnswer]);
    await expect(service.findAll({ questionId: 'q1' })).resolves.toEqual([sampleAnswer]);
  });

  it('returns one answer when it exists', async () => {
    repository.findById.mockResolvedValue(sampleAnswer);
    await expect(service.findOne('a1')).resolves.toEqual(sampleAnswer);
  });

  it('throws when answer does not exist', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates an answer', async () => {
    repository.update.mockResolvedValue(sampleAnswer);
    await expect(
      service.update('a1', { answer: 'no' }),
    ).resolves.toEqual(sampleAnswer);
  });

  it('updateOrCreate delegates to repository', async () => {
    repository.updateOrCreate.mockResolvedValue(sampleAnswer);
    await expect(
      service.updateOrCreate({ id: 'a1' }, { questionId: 'q1', centroId: 'c1', answer: 'yes' }),
    ).resolves.toEqual(sampleAnswer);
  });

  it('deletes an answer', async () => {
    repository.delete.mockResolvedValue(undefined);
    await expect(service.delete('a1')).resolves.toBeUndefined();
  });

  it('finds answers by center ids', async () => {
    repository.findByCentroIds.mockResolvedValue([sampleAnswer]);
    await expect(service.findByCentroIds({ centroIds: ['c1'] })).resolves.toEqual([
      sampleAnswer,
    ]);
  });
});
