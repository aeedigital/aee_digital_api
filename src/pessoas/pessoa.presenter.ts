import { Person } from '../domain/entities/person';

export function toPessoaResponse(person: Person) {
  return {
    _id: person.id,
    NOME: person.name,
    'E-MAIL': person.email,
    CELULAR: person.celular,
  };
}
