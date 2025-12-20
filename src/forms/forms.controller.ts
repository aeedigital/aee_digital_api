import { FormsAppService as Service } from '../application/forms/forms.service';
import { Form } from '../domain/entities/form';
import { FilterDto } from './dto/filter-form.dto';
import { CreateFormDto as CreateDto } from './dto/create-form.dto';

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

@Controller('forms')
export class FormsController {
  constructor(private readonly service: Service) {}

  private toFilter(filterDto: FilterDto) {
    return {
      name: filterDto.NAME,
      version: filterDto.VERSION as any,
      createdBy: filterDto.CREATEDBY,
      fields: filterDto.fields,
    };
  }

  private toInput(dto: CreateDto) {
    return {
      name: dto.NAME,
      version: dto.VERSION as any,
      createdBy: dto.CREATEDBY,
      pages: dto.PAGES?.map((page) => ({
        name: page.NAME,
        role: page.ROLE,
        quizes: page.QUIZES?.map((quiz) => ({
          category: quiz.CATEGORY,
          questions: quiz.QUESTIONS?.map((question) => ({
            group: question.GROUP,
            isMultiple: question.IS_MULTIPLE,
          })),
        })),
      })),
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new resource' })
  create(@Body() createDto: CreateDto) {
    return this.service.create(this.toInput(createDto));
  }

  @Get()
  findAll(@Query(ValidationPipe) filterDto: FilterDto): Promise<Form[]> {
    return this.service.findAll(this.toFilter(filterDto));
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Form> {
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
