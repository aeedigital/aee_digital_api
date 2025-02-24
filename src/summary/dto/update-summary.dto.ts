import { PartialType } from '@nestjs/mapped-types';
import { CreateSummariesDto } from './create-summaries.dto';

export class UpdateSummaryDto extends PartialType(CreateSummariesDto) {}
