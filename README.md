<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Localização geográfica dos centros

A API apenas valida e persiste `LOCALIZACAO`; ela nunca chama o
[Geoapify](https://www.geoapify.com/). Criações e alterações reais de endereço
ficam com `STATUS=PENDENTE`, sem conservar as coordenadas anteriores.

O script externo `scripts/geocode-centros.mjs` consulta os centros pela API,
monta o endereço estruturado, chama o Geoapify e salva o resultado em
`PUT /centros/:id/localizacao`. Essa rota exige o header operacional
`x-location-update-token` e valida que `ENDERECO_HASH` ainda corresponde ao endereço
atual. Se o endereço mudar durante o processamento, a API responde `409` e não
persiste as coordenadas antigas.

No CRUD comum, `LOCALIZACAO`, latitude e longitude continuam somente leitura.
Somente localizações com `STATUS=CONFIRMADA` devem ser exibidas
automaticamente no mapa.

O plano gratuito exige as atribuições “Powered by Geoapify” e
“© OpenStreetMap contributors” na interface que utiliza os dados. A cota deve
ser acompanhada no dashboard do projeto Geoapify.

Para examinar a base sem consumir chamadas:

```bash
ALL_CENTROS=true npm run geocode:centros
```

Para executar o backfill:

```bash
API_BASE_URL=https://api.exemplo \
GEOAPIFY_API_KEY=... \
LOCATION_UPDATE_TOKEN=... \
ALL_CENTROS=true \
DRY_RUN=false \
npm run geocode:centros
```

Também é possível limitar com `REGIONAL_ID` ou `CENTRO_IDS`, controlar
`CONCURRENCY`, `INTERVAL_MS` e `MAX_CALLS`, ou usar `FORCE=true` para consultar
novamente resultados já confirmados. O dry-run não chama o Geoapify nem altera
centros. O script gera relatórios JSON e CSV.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).
