import { Controller } from '@nestjs/common';
import { FormService } from './forms.service';
import { Form } from './schemas/forms.schema';
import { FilterDto } from './dto/filter-form.dto';
import { GenericController } from '../base/generic.controller';
import { CreateFormDto } from './dto/create-form.dto';

@Controller('api/v1/forms')
export class FormController extends GenericController<
  CreateFormDto,
  FilterDto,
  Form
> {
  constructor(private readonly formsService: FormService) {
    super(formsService);
  }
}
