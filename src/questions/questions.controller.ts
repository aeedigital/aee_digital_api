import { QuestionsAppService as Service } from '../application/questions/questions.service';
import { QuestionEntity } from '../domain/entities/question';
import { FilterDto } from './dto/filter-questions.dto';
import { CreateQuestionsDto as CreateDto } from './dto/create-questions.dto';
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

  private toUpdateInput(dto: CreateDto): UpdateQuestionInput {
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
    return this.service.create(this.toCreateInput(createDto));
  }

  @Get()
  findAll(
    @Query(ValidationPipe) filterDto: FilterDto,
  ): Promise<QuestionEntity[]> {
    return this.service.findAll(this.toFilter(filterDto));
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<QuestionEntity> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: CreateDto) {
    return this.service.update(id, this.toUpdateInput(updateDto));
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
