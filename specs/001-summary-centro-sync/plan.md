# Implementation Plan: Atualização assíncrona dos dados do centro

**Branch**: `feature/update-centro-info` | **Date**: 2026-11-20 | **Spec**: [spec.md](./spec.md)

**Input**: Atualizar o registro geral do centro após aceitar uma nova summary.

## Summary

Após persistir uma summary, a API confirma o recebimento sem aguardar o processamento do centro. Um evento sem dados pessoais seguirá por SNS para uma fila SQS assinada e será consumido por uma Lambda de trabalho. O worker lê a summary persistida, atualiza os campos do centro e recalcula a localização geográfica. As consultas de centro passam a usar o funcionamento persistido; summaries antigas não serão usadas como fallback e não haverá preenchimento retroativo.

## Technical Context

**Language/Version**: TypeScript 5.9, Node.js 20.x

**Primary Dependencies**: NestJS 11, Fastify 5, Mongoose 8, AWS SDK v3 SQS (installed); add SNS client for topic publication

**Storage**: MongoDB via Mongoose in production; in-memory repositories for tests; SNS topic and SQS queues in AWS

**Testing**: Jest unit/e2e tests, Nest build, Terraform validation

**Target Platform**: API Gateway + HTTP Lambda; separate Lambda handler for SQS events; AWS resources managed with Terraform

**Project Type**: Backend web service

**Performance Goals**: Summary submission returns after persistence and event handoff, without waiting for center updates or geocoding. No numeric latency or throughput target is specified.

**Constraints**: Preserve the summary response contract; no user-queryable processing status; no retroactive functionality backfill or summary fallback; keep processing idempotent and prevent stale summaries from overwriting newer center data; do not include contact/address PII in event messages. Use operational replay rather than a transactional outbox if SNS publication fails after summary persistence.

**Scale/Scope**: One center profile per accepted summary; public phone/site updates require positive disclosure authorization; contact, address, functionality and geolocation fields are synchronized; legacy center data is not backfilled.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Evidence |
|---|---|---|
| Preserve public API contracts | PASS | Summary response shape remains unchanged; source and eventual freshness changes for center data are explicit in the spec. |
| Respect layered architecture | PASS | Business mapping stays in application services; AWS and Mongo details stay in infrastructure. |
| Verify behavior with focused tests | PASS | Plan includes service, repository, worker, contract, and infrastructure checks. |
| Protect data and runtime boundaries | PASS | Event carries identifiers/version only; no production data scripts or credential changes are planned. |
| Keep changes small and failures explicit | PASS | Existing summary/centro modules are extended; processing failures are surfaced operationally, without a user status endpoint. |

**Gate result**: PASS. No constitution violations require an exception.

## Project Structure

### Documentation

```text
specs/001-summary-centro-sync/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code

```text
src/
├── application/
│   ├── summary/                 # Summary creation and derived data
│   └── centros/                 # Centro reads/updates and location guard
├── summary/                     # HTTP controller, DTOs, snapshots
├── centros/                     # HTTP controller, schema, presenter
├── dashboard-projections/       # Existing direct SQS publishing pattern
├── infra/
│   ├── mongo/
│   └── memory/
├── lambda.ts                    # Existing HTTP/Fastify Lambda handler
├── summary-updates/             # SQS worker module
└── summary-updates.lambda.ts    # Separate SQS Lambda entrypoint

infra/
└── main.tf                      # API and new SNS/SQS/worker resources

test/
└── *.e2e-spec.ts                # Existing HTTP e2e suite
```

**Structure Decision**: Keep the current NestJS API and its HTTP-only Lambda handler. Add an SQS-specific worker entrypoint and application module, reusing the existing domain repositories and center location validation. Define the topic, subscription queue, dead-letter queue, event source mapping, and worker permissions in Terraform. Keep `ATENDIMENTOS` summary presentation behavior separate from the persisted `FUNCIONAMENTO` field. If SNS publication fails after summary persistence, return a non-success response and log identifiers for operator replay; do not add an outbox in this scope. The persisted summary may remain even though the request failed, so client retries can create another summary.

## Constitution Check (post-design)

| Gate | Status | Evidence |
|---|---|---|
| Preserve public API contracts | PASS | Existing summary response shape and center field names remain; no processing-status route is added. The no-backfill behavior is explicitly approved in the spec. |
| Respect layered architecture | PASS | The worker uses application services and repository contracts; AWS event delivery stays in infrastructure. |
| Verify behavior with focused tests | PASS | Quickstart defines focused service/worker checks, build, and Terraform validation. |
| Protect data and runtime boundaries | PASS | Events contain identifiers and version only; provider credentials remain outside source and Terraform plaintext. |
| Keep changes small and failures explicit | PASS | No historical migration or status API; SQS failures use retries/DLQ, and publication failures are not swallowed. |

**Post-design gate result**: PASS. No constitution violations require an exception.

## Complexity Tracking

No constitution violations.
