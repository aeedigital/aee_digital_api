import { PassesService as Service } from './passes.service';
import { Passes as Schema } from './schemas/passes.schema';
import { FilterDto } from './dto/filter-passes.dto';
import { CreatePassesDto as CreateDto } from './dto/create-passes.dto';

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

@Controller('passes')
export class PassesController {
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
  update(@Param('id') id: string, @Body() updateDto: UpdatePassesDto) {
    return this.service.update(id, updateDto);
  }

  @Patch(':id/last-logged-in')
  updateLastLoggedIn(@Param('id') id: string) {
    const lastLogged = new Date();

    const updatedPass: UpdatePassesDto = {
      lastLogged,
    }

    return this.service.update(id, updatedPass);
  }


  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
