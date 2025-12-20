import { AnswersAppService } from '../application/answers/answers.service';
import { Answer } from '../domain/entities/answer';
import { FilterDto } from './dto/filter-answers.dto';
import { CreateAnswersDto as CreateDto } from './dto/create-answers.dto';

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

@Controller('answers')
export class AnswersController {
  constructor(private readonly service: AnswersAppService) {}

  private toFilter(filterDto: FilterDto) {
    return {
      questionId: filterDto.QUESTION_ID,
      centroId: filterDto.CENTRO_ID,
      quizId: filterDto.QUIZ_ID,
      answer: filterDto.ANSWER,
    };
  }

  private toCreateInput(createDto: CreateDto) {
    return {
      questionId: createDto.QUESTION_ID,
      centroId: createDto.CENTRO_ID,
      answer: createDto.ANSWER,
      quizId: createDto.QUIZ_ID,
    };
  }

  private toUpdateInput(updateDto: UpdateDto) {
    return {
      questionId: updateDto.QUESTION_ID,
      centroId: updateDto.CENTRO_ID,
      answer: updateDto.ANSWER,
      quizId: updateDto.QUIZ_ID,
    };
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
    const filter = { CENTRO_ID, QUESTION_ID, _id };
    const mappedFilter = {
      centroId: filter.CENTRO_ID,
      questionId: filter.QUESTION_ID,
      id: filter._id,
    };

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
