import { AnswersAppService } from '../application/answers/answers.service';
import { Answer } from '../domain/entities/answer';
import { FilterDto } from './dto/filter-answers.dto';
import { CreateAnswersDto as CreateDto } from './dto/create-answers.dto';
import {
  CreateAnswerInput,
  UpdateAnswerInput,
} from '../domain/repositories/answer.repository';

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ValidationPipe,
  Put,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation } from '@nestjs/swagger';
import { UpdateDto } from './dto/update-answer.dto';
import { mapProps } from '../base/mappers/object.mapper';
import { toAnswerResponse } from './answer.presenter';

@Controller('answers')
export class AnswersController {
  constructor(
    private readonly service: AnswersAppService,
    @Optional() private readonly configService?: ConfigService,
  ) {}

  private assertWritesEnabled() {
    if (this.configService?.get<string>('ANSWERS_WRITE_DISABLED') === 'true') {
      throw new ServiceUnavailableException(
        'A gravacao de respostas esta temporariamente em manutencao',
      );
    }
  }

  private toFilter(filterDto: FilterDto) {
    return mapProps(filterDto, {
      QUESTION_ID: 'questionId',
      CENTRO_ID: 'centroId',
      QUIZ_ID: 'quizId',
      ANSWER: 'answer',
      FORM_ID: 'formId',
      GROUP_KEY: 'groupKey',
      GROUP_INSTANCE_ID: 'groupInstanceId',
      fields: 'fields',
    });
  }

  private toCreateInput(createDto: CreateDto): CreateAnswerInput {
    return mapProps<any, CreateAnswerInput>(createDto as any, {
      QUESTION_ID: 'questionId',
      CENTRO_ID: 'centroId',
      ANSWER: 'answer',
      QUIZ_ID: 'quizId',
      FORM_ID: 'formId',
      GROUP_KEY: 'groupKey',
      GROUP_INSTANCE_ID: 'groupInstanceId',
      GROUP_OCCURRENCE_ORDER: 'groupOccurrenceOrder',
      QUESTION_ORDER: 'questionOrder',
    });
  }

  private toUpdateInput(updateDto: UpdateDto): UpdateAnswerInput {
    return mapProps<any, UpdateAnswerInput>(updateDto as any, {
      QUESTION_ID: 'questionId',
      CENTRO_ID: 'centroId',
      ANSWER: 'answer',
      QUIZ_ID: 'quizId',
      FORM_ID: 'formId',
      GROUP_KEY: 'groupKey',
      GROUP_INSTANCE_ID: 'groupInstanceId',
      GROUP_OCCURRENCE_ORDER: 'groupOccurrenceOrder',
      QUESTION_ORDER: 'questionOrder',
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new resource' })
  create(@Body() createDto: CreateDto) {
    this.assertWritesEnabled();
    return this.service.create(this.toCreateInput(createDto)).then(toAnswerResponse);
  }

  @Get()
  findAll(@Query(ValidationPipe) filterDto: FilterDto): Promise<any[]> {
    return this.service.findAll(this.toFilter(filterDto)).then((items) => items.map(toAnswerResponse));
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<any> {
    return this.service.findOne(id).then(toAnswerResponse);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateDto) {
    this.assertWritesEnabled();
    return this.service.update(id, this.toUpdateInput(updateDto)).then(toAnswerResponse);
  }

  @Put()
  updateOrCreate(
    @Body() updateDto: UpdateDto,
    @Query('centroId') CENTRO_ID?: string,
    @Query('questionId') QUESTION_ID?: string,
    @Query('answerId') _id?: string,
  ) {
    this.assertWritesEnabled();
    const mappedFilter = mapProps({ CENTRO_ID, QUESTION_ID, _id }, {
      CENTRO_ID: 'centroId',
      QUESTION_ID: 'questionId',
      _id: 'id',
    });

    return this.service.updateOrCreate(
      mappedFilter,
      this.toCreateInput(updateDto as any),
    ).then(toAnswerResponse);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    this.assertWritesEnabled();
    return this.service.delete(id);
  }
}
