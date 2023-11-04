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

@Controller('generic')
export class GenericController<T, F, S> {
  constructor(private readonly service: any) {}

  @Post()
  create(@Body() createDto: T) {
    return this.service.create(createDto);
  }

  @Get()
  findAll(@Query(ValidationPipe) filterDto: F): Promise<S[]> {
    return this.service.findAll(filterDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<S[]> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: T) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
