import { Controller } from '@nestjs/common';
import { GenericController } from '../base/generic.controller';
import { QuestionsService } from './questions.service';
import { Question } from './schemas/questions.schema';
import { FilterDto } from './dto/filter-questions.dto';
import { CreateQuestionsDto } from './dto/create-questions.dto';

@Controller('api/v1/questions')
export class QuestionsController extends GenericController<
  CreateQuestionsDto,
  FilterDto,
  Question
> {
  constructor(private readonly questionsService: QuestionsService) {
    super(questionsService);
  }
}