import { QuestionsAppService as Service } from '../application/questions/questions.service';
import { QuestionEntity } from '../domain/entities/question';
import { FilterDto } from './dto/filter-questions.dto';
import { CreateQuestionsDto as CreateDto } from './dto/create-questions.dto';

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

@Controller('questions')
export class QuestionsController {
  constructor(private readonly service: Service) {}

  private toFilter(filterDto: FilterDto) {
    return {
      question: filterDto.QUESTION,
      answerType: filterDto.ANSWER_TYPE,
      isRequired: filterDto.IS_REQUIRED,
      isMultiple: filterDto.IS_MULTIPLE,
      role: filterDto.ROLE,
      fields: filterDto.fields,
    };
  }

  private toInput(dto: CreateDto) {
    return {
      question: dto.QUESTION,
      answerType: dto.ANSWER_TYPE,
      isRequired: dto.IS_REQUIRED,
      isMultiple: dto.IS_MULTIPLE,
      presetValues: dto.PRESET_VALUES,
      role: dto.ROLE,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new resource' })
  create(@Body() createDto: CreateDto) {
    return this.service.create(this.toInput(createDto));
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
    return this.service.update(id, this.toInput(updateDto));
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
