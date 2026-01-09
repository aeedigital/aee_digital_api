import { NotFoundException } from '@nestjs/common';
import { QuestionsAppService } from './questions.service';
import { QuestionRepository } from '../../domain/repositories/question.repository';
import { QuestionEntity } from '../../domain/entities/question';

describe('QuestionsAppService', () => {
  let service: QuestionsAppService;
  let repository: jest.Mocked<QuestionRepository>;

  const question: QuestionEntity = {
    id: 'q1',
    question: 'Pergunta?',
    answerType: 'text',
    isRequired: true,
    isMultiple: false,
    presetValues: [],
    role: 'admin',
  };

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      updateOrCreate: jest.fn(),
      delete: jest.fn(),
    };
    service = new QuestionsAppService(repository);
  });

  it('creates a question', async () => {
    repository.create.mockResolvedValue(question);
    await expect(service.create(question)).resolves.toEqual(question);
  });

  it('finds all questions', async () => {
    repository.findAll.mockResolvedValue([question]);
    await expect(service.findAll({ role: 'admin' })).resolves.toEqual([question]);
  });

  it('finds one question', async () => {
    repository.findById.mockResolvedValue(question);
    await expect(service.findOne('q1')).resolves.toEqual(question);
  });

  it('throws when question not found', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates a question', async () => {
    repository.update.mockResolvedValue(question);
    await expect(service.update('q1', { role: 'user' })).resolves.toEqual(question);
  });

  it('updateOrCreate delegates to repository', async () => {
    repository.updateOrCreate.mockResolvedValue(question);
    await expect(service.updateOrCreate({ id: 'q1' }, question)).resolves.toEqual(question);
  });

  it('deletes a question', async () => {
    repository.delete.mockResolvedValue(undefined);
    await expect(service.delete('q1')).resolves.toBeUndefined();
  });
});
