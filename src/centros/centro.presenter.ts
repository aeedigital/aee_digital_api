import { Centro } from '../domain/entities/centro';

export function toCentroResponse(centro: Centro) {
  return {
    _id: centro.id,
    FUNCIONAMENTO: centro.funcionamento,
    NOME_CENTRO: centro.nomeCentro,
    NOME_CURTO: centro.nomeCurto,
    CNPJ_CENTRO: centro.cnpjCentro,
    DATA_FUNDACAO: centro.dataFundacao,
    REGIONAL: centro.regional,
    ENDERECO: centro.endereco,
    CEP: centro.cep,
    BAIRRO: centro.bairro,
    CIDADE: centro.cidade,
    ESTADO: centro.estado,
    PAIS: centro.pais,
    createdAt: centro.createdAt,
    updatedAt: centro.updatedAt,
  };
}
