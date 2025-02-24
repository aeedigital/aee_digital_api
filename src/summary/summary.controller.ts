import { Summaries as Schema } from './schemas/summaries.schema';
import { FilterDto } from './dto/filter-summaries.dto';
import { CreateSummariesDto as CreateDto } from './dto/create-summaries.dto';
import { SummaryService as Service } from './summary.service';

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
import { UpdateSummaryDto } from './dto/update-summary.dto';

@Controller('summaries')
export class SummariesController {
  constructor(private readonly service: Service) { }

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
  update(@Param('id') id: string, @Body() updateDto: UpdateSummaryDto) {
    return this.service.update(id, updateDto);
  }

  @Patch(':id/validated-by-coord')
  updateValidatedByCoord(@Param('id') id: string) {
    const validatedByCoordAt = new Date();

    const updatedPass: UpdateSummaryDto = {
      validatedByCoordAt,
    }

    return this.service.update(id, updatedPass);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
