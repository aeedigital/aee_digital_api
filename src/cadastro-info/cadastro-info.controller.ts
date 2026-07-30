import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { CadastroInfoAppService } from '../application/cadastro-info/cadastro-info.service';
import { mapProps } from '../base/mappers/object.mapper';
import { CreateCadastroInfoInput } from '../domain/repositories/cadastro-info.repository';
import { SaveCadastroInfoDto } from './dto/save-cadastro-info.dto';
import { toCadastroInfoResponse } from './cadastro-info.presenter';

@Controller('cadastro-info')
export class CadastroInfoController {
  constructor(private readonly service: CadastroInfoAppService) {}

  private toCreateInput(dto: SaveCadastroInfoDto): CreateCadastroInfoInput {
    return mapProps<any, CreateCadastroInfoInput>(dto as any, {
      START_DATE: 'startDate',
      END_DATE: 'endDate',
      FORM_ID: 'formId',
      IS_ACTIVE: 'isActive',
    });
  }

  @Post()
  @ApiOperation({ summary: 'Save cadastro info config' })
  save(@Body() body: SaveCadastroInfoDto) {
    return this.service.save(this.toCreateInput(body)).then(toCadastroInfoResponse);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active cadastro info config' })
  findActive() {
    return this.service.findActive().then(toCadastroInfoResponse);
  }
}
