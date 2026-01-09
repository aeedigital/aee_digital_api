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
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { UpdateDto } from './dto/update-answer.dto';
import { mapProps } from '../base/mappers/object.mapper';

@Controller('answers')
export class AnswersController {
  constructor(private readonly service: AnswersAppService) {}

  private toFilter(filterDto: FilterDto) {
    return mapProps(filterDto, {
      QUESTION_ID: 'questionId',
      CENTRO_ID: 'centroId',
      QUIZ_ID: 'quizId',
      ANSWER: 'answer',
      fields: 'fields',
    });
  }

  private toCreateInput(createDto: CreateDto): CreateAnswerInput {
    return mapProps<any, CreateAnswerInput>(createDto as any, {
      QUESTION_ID: 'questionId',
      CENTRO_ID: 'centroId',
      ANSWER: 'answer',
      QUIZ_ID: 'quizId',
    });
  }

  private toUpdateInput(updateDto: UpdateDto): UpdateAnswerInput {
    return mapProps<any, UpdateAnswerInput>(updateDto as any, {
      QUESTION_ID: 'questionId',
      CENTRO_ID: 'centroId',
      ANSWER: 'answer',
      QUIZ_ID: 'quizId',
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new resource' })
  create(@Body() createDto: CreateDto) {
    return this.service.create(this.toCreateInput(createDto));
  }

  @Get()
  findAll(@Query(ValidationPipe) filterDto: FilterDto): Promise<Answer[]> {
    return this.service.findAll(this.toFilter(filterDto));
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Answer> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateDto) {
    return this.service.update(id, this.toUpdateInput(updateDto));
  }

  @Put()
  updateOrCreate(
    @Body() updateDto: UpdateDto,
    @Query('centroId') CENTRO_ID?: string,
    @Query('questionId') QUESTION_ID?: string,
    @Query('answerId') _id?: string,
  ) {
    const mappedFilter = mapProps({ CENTRO_ID, QUESTION_ID, _id }, {
      CENTRO_ID: 'centroId',
      QUESTION_ID: 'questionId',
      _id: 'id',
    });

    return this.service.updateOrCreate(
      mappedFilter,
      this.toCreateInput(updateDto as any),
    );
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
