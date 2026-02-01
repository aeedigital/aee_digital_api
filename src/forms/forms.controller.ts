import { FormsAppService as Service } from '../application/forms/forms.service';
import { Form } from '../domain/entities/form';
import { FilterDto } from './dto/filter-form.dto';
import { CreateFormDto as CreateDto } from './dto/create-form.dto';
import {
  CreateFormInput,
  UpdateFormInput,
} from '../domain/repositories/form.repository';

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
import { toFormResponse } from './form.presenter';

@Controller('forms')
export class FormsController {
  constructor(private readonly service: Service) {}

  private toFilter(filterDto: FilterDto) {
    return mapProps(filterDto, {
      NAME: 'name',
      VERSION: 'version',
      CREATEDBY: 'createdBy',
      fields: 'fields',
    });
  }

  private toCreateInput(dto: CreateDto): CreateFormInput {
    const payload = mapProps<any, Omit<CreateFormInput, 'pages'>>(dto as any, {
      NAME: 'name',
      VERSION: 'version',
      CREATEDBY: 'createdBy',
    });
    return {
      ...payload,
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

  private toUpdateInput(dto: CreateDto): UpdateFormInput {
    const payload = mapProps<any, Omit<UpdateFormInput, 'pages'>>(dto as any, {
      NAME: 'name',
      VERSION: 'version',
      CREATEDBY: 'createdBy',
    });
    return {
      ...payload,
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
    return this.service.create(this.toCreateInput(createDto)).then(toFormResponse);
  }

  @Get()
  findAll(@Query(ValidationPipe) filterDto: FilterDto): Promise<any[]> {
    return this.service.findAll(this.toFilter(filterDto)).then((items) => items.map(toFormResponse));
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<any> {
    return this.service.findOne(id).then(toFormResponse);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: CreateDto) {
    return this.service.update(id, this.toUpdateInput(updateDto)).then(toFormResponse);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
