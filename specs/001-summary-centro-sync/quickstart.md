# Quickstart: validate center summary synchronization

## Prerequisites

- Node.js 20.x and the repository dependencies.
- Terraform 1.5 or later for infrastructure formatting/validation.
- Unit tests must use mocked SNS, SQS, Mongo, and geocoding clients. Do not point tests at production AWS or production MongoDB.

## Focused application validation

From the repository root:

```bash
npm test -- --runInBand application/summary/summary.service.spec.ts application/centros/centros.service.spec.ts
npm test -- --runInBand summary-updates
npm run build
```

Expected results:

1. Creating a summary persists it, publishes a versioned event, and returns without waiting for the worker or geocoding.
2. The worker persists valid functionality, address, and authorized public contacts from the saved summary.
3. Center reads return persisted `FUNCIONAMENTO` and do not query old summaries for a fallback; the separate `ATENDIMENTOS` response remains available under its existing behavior.
4. Missing/invalid address or functionality preserves stored values; missing authorization or invalid public contact values removes public phone/site as specified.
5. A changed address invalidates the previous geocoded location. A failed or stale geocoding result never confirms coordinates for a different address.
6. Duplicate or stale events do not revert a newer center profile. Individual failed SQS records are retried while successfully processed records are acknowledged.
7. No user-facing status route is added; background failures are visible through operational logs/metrics and the dead-letter queue.
8. If SNS publication fails after summary persistence, the API returns a non-success response and logs both IDs. Replaying the event for that summary is safe; a caller retry can create another summary and this trade-off is documented.

## Infrastructure validation

```bash
terraform -chdir=infra fmt -check -recursive
terraform -chdir=infra init -backend=false
terraform -chdir=infra validate
```

Expected result: Terraform configuration is formatted and validates the SNS topic, subscription queue, queue policy, dead-letter redrive, worker Lambda, event source mapping, and least-privilege permissions. Do not run `terraform apply` as part of this quickstart.
