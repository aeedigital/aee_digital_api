import { QuestionsAppService as Service } from '../application/questions/questions.service';
import { QuestionEntity } from '../domain/entities/question';
import { FilterDto } from './dto/filter-questions.dto';
import { CreateQuestionsDto as CreateDto } from './dto/create-questions.dto';
import { UpdateQuestionsDto } from './dto/update-questions.dto';
import {
  CreateQuestionInput,
  UpdateQuestionInput,
} from '../domain/repositories/question.repository';

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
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { mapProps } from '../base/mappers/object.mapper';
import { toQuestionResponse } from './question.presenter';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly service: Service) {}

  private toFilter(filterDto: FilterDto) {
    return mapProps(filterDto, {
      QUESTION: 'question',
      ANSWER_TYPE: 'answerType',
      IS_REQUIRED: 'isRequired',
      IS_MULTIPLE: 'isMultiple',
      ROLE: 'role',
      fields: 'fields',
    });
  }

  private toCreateInput(dto: CreateDto): CreateQuestionInput {
    return mapProps<any, CreateQuestionInput>(dto as any, {
      QUESTION: 'question',
      ANSWER_TYPE: 'answerType',
      IS_REQUIRED: 'isRequired',
      IS_MULTIPLE: 'isMultiple',
      PRESET_VALUES: 'presetValues',
      ROLE: 'role',
    });
  }

  private toUpdateInput(dto: UpdateQuestionsDto): UpdateQuestionInput {
    return mapProps<any, UpdateQuestionInput>(dto as any, {
      QUESTION: 'question',
      ANSWER_TYPE: 'answerType',
      IS_REQUIRED: 'isRequired',
      IS_MULTIPLE: 'isMultiple',
      PRESET_VALUES: 'presetValues',
      ROLE: 'role',
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new resource' })
  create(@Body() createDto: CreateDto) {
    return this.service.create(this.toCreateInput(createDto)).then(toQuestionResponse);
  }

  @Get()
  findAll(
    @Query(ValidationPipe) filterDto: FilterDto,
  ): Promise<any[]> {
    return this.service.findAll(this.toFilter(filterDto)).then((items) => items.map(toQuestionResponse));
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<any> {
    return this.service.findOne(id).then(toQuestionResponse);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateQuestionsDto) {
    return this.service.update(id, this.toUpdateInput(updateDto)).then(toQuestionResponse);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
