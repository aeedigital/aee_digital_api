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
import { FormService } from './forms.service';
import { Form, FormDocument } from './schemas/forms.schema';
import { FilterDto } from './dto/filter-form.dto';

@Controller('api/v1/atividade_generic_form')
export class FormController {
  constructor(private readonly formsService: FormService) {}

  @Post()
  create(@Body() FormDocument: FormDocument) {
    return this.formsService.create(FormDocument);
  }

  @Get()
  findAll(@Query(ValidationPipe) filterDto: FilterDto): Promise<FormDocument[]> {
    return this.formsService.findAll(filterDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<FormDocument> {
    return this.formsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: FormDocument) {
    return this.formsService.update(id, updateDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.formsService.delete(id);
  }
}
