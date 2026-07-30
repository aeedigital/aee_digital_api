import { validate } from 'class-validator';
import { UpdateCentroDto } from '../centros/dto/update-centro.dto';
import { UpdateFormDto } from '../forms/dto/update-form.dto';
import { UpdatePessoasDto } from '../pessoas/dto/update-pessoas.dto';
import { UpdateQuestionsDto } from '../questions/dto/update-questions.dto';

describe('Update DTOs', () => {
  it.each([
    [UpdateCentroDto, { ENDERECO: 'Rua Nova' }],
    [UpdateFormDto, { NAME: 'Formulário atualizado' }],
    [UpdatePessoasDto, { CELULAR: '11999999999' }],
    [UpdateQuestionsDto, { ROLE: 'coord_regional' }],
  ])('accepts a partial payload for %p', async (Dto, payload) => {
    const dto = Object.assign(new Dto(), payload);

    await expect(validate(dto)).resolves.toEqual([]);
  });
});
