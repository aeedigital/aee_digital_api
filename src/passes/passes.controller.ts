import { PassesAppService as Service } from '../application/passes/passes.service';
import { Pass } from '../domain/entities/pass';
import { FilterDto } from './dto/filter-passes.dto';
import { CreatePassesDto as CreateDto } from './dto/create-passes.dto';
import {
  CreatePassInput,
  UpdatePassInput,
} from '../domain/repositories/pass.repository';

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
import { UpdatePassesDto } from './dto/update-pass.dto';
import { mapProps } from '../base/mappers/object.mapper';
import { toPassResponse } from './pass.presenter';

@Controller('passes')
export class PassesController {
  constructor(private readonly service: Service) {}

  private toFilter(filterDto: FilterDto): Record<string, any> {
    const filter: Record<string, any> = { ...(filterDto as any) };
    if ((filter as any).scope_id) {
      filter.scopeId = (filter as any).scope_id;
      delete (filter as any).scope_id;
    }
    return filter;
  }

  private toCreateInput(dto: CreateDto): CreatePassInput {
    const payload = mapProps<any, CreatePassInput>(dto as any, {
      user: 'user',
      pass: 'pass',
      scope_id: 'scopeId',
      groups: 'groups',
      lastLogged: 'lastLogged',
    });
    return {
      ...payload,
      lastLogged: dto.lastLogged ?? null,
    };
  }

  private toUpdateInput(dto: UpdatePassesDto): UpdatePassInput {
    return mapProps<any, UpdatePassInput>(dto as any, {
      user: 'user',
      pass: 'pass',
      scope_id: 'scopeId',
      groups: 'groups',
      lastLogged: 'lastLogged',
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new resource' })
  create(@Body() createDto: CreateDto) {
    return this.service.create(this.toCreateInput(createDto)).then(toPassResponse);
  }

  @Get()
  findAll(@Query(ValidationPipe) filterDto: FilterDto): Promise<any[]> {
    return this.service.findAll(this.toFilter(filterDto)).then((items) => items.map(toPassResponse));
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<any> {
    return this.service.findOne(id).then(toPassResponse);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdatePassesDto) {
    return this.service.update(id, this.toUpdateInput(updateDto)).then(toPassResponse);
  }

  @Patch(':id/last-logged-in')
  updateLastLoggedIn(@Param('id') id: string) {
    const lastLogged = new Date();

    const updatedPass: UpdatePassesDto = {
      lastLogged,
    }

    return this.service.update(id, this.toUpdateInput(updatedPass)).then(toPassResponse);
  }


  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
