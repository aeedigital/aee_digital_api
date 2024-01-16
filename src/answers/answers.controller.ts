import { AnswersService as Service } from './answers.service';
import { Answer as Schema } from './schemas/answers.schema';
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
  constructor(private readonly service: Service) {}

  @Post()
  @ApiOperation({ summary: 'Create a new resource' })
  create(@Body() createDto: CreateDto) {
    return this.service.create(createDto);
  }

  @Get()
  findAll(@Query(ValidationPipe) filterDto: FilterDto): Promise<Schema[]> {
    return this.service.findAll(filterDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Schema> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateDto) {
    return this.service.update(id, updateDto);
  }

  @Put()
  updateOrCreate(
    @Body() updateDto: UpdateDto,
    @Query('centroId') CENTRO_ID?: string,
    @Query('questionId') QUESTION_ID?: string,
    @Query('answerId') _id?: string,
  ) {
    const filter = { CENTRO_ID, QUESTION_ID, _id };
    return this.service.updateOrCreate(filter, updateDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
