# Quickstart: validate center summary synchronization

## Prerequisites

- Node.js 20.x and the repository dependencies.
- Terraform 1.5 or later for infrastructure formatting/validation.
- Unit tests must use mocked SSM, SNS, SQS, Mongo, and geocoding clients. Do not point tests at production AWS or production MongoDB.
- Local tests and memory mode must not contact Parameter Store. The Lambda in the existing AWS environment uses `PARAMETER_ENVIRONMENT` to choose its SSM path prefix.

## Focused application validation

From the repository root:

```bash
npm test -- --runInBand services/parameter-store.service.spec.ts services/parameter-store.provisioner.spec.ts
npm test -- --runInBand application/summary/summary.service.spec.ts application/centros/centros.service.spec.ts
npm test -- --runInBand summary-updates
npm run test:deploy-safety
npm run build
```

Expected results:

1. With `SUMMARY_CENTER_REFRESH_ENABLED=true`, creating a summary persists it, publishes a versioned event, and returns without waiting for the worker or geocoding. With the default `false`, the summary persists without publishing a refresh event.
2. The worker persists valid functionality, address, and authorized public contacts from the saved summary.
3. Center reads return persisted `FUNCIONAMENTO` and do not query old summaries for a fallback; the separate `ATENDIMENTOS` response remains available under its existing behavior.
4. Missing/invalid address or functionality preserves stored values; missing authorization or invalid public contact values removes public phone/site as specified.
5. A changed address invalidates the previous geocoded location. A failed or stale geocoding result never confirms coordinates for a different address.
6. Duplicate or stale events do not revert a newer center profile. Individual failed SQS records are retried while successfully processed records are acknowledged.
7. No user-facing status route is added; background failures are visible through operational logs/metrics and the dead-letter queue.
8. If enabled SNS publication fails after summary persistence, the API returns a non-success response and logs both IDs. Replaying the event for that summary is safe; a caller retry can create another summary and this trade-off is documented.
9. In Lambda mode, required secrets are loaded from SSM `SecureString` with decryption and cached for the execution environment. Missing parameters or denied access fail startup; local `.env` mode remains independent of AWS.

## Operational replay after a publish failure

The summary is already persisted when SNS publication fails. Before replaying, use the API/worker CloudWatch logs to confirm the `summaryId` and `centroId`, verify that the summary exists, and check whether a newer summary for that center has already been processed. Do not copy contact, address, answer, or other personal data into the event or logs.

Reconstruct the original event from the persisted summary metadata and publish it only after an operator approves replay. Use the same `summaryId` for `eventId` (`center-summary-refresh-<summaryId>`), set `sourceVersion.summaryId` to that ID, and use the persisted `updatedAt` and `createdAt` timestamps in ISO date-time format:

```json
{
  "schemaVersion": "center.summary-refresh.v1",
  "eventId": "center-summary-refresh-<summaryId>",
  "summaryId": "<summaryId>",
  "centroId": "<centroId>",
  "sourceVersion": {
    "updatedAt": "<summary-updatedAt-ISO>",
    "createdAt": "<summary-createdAt-ISO>",
    "summaryId": "<summaryId>"
  }
}
```

Save only this identifier/version payload to a restricted temporary file, then publish it to the configured topic from an authorized operator environment:

```bash
aws sns publish \
  --topic-arn "$SUMMARY_CENTER_REFRESH_TOPIC_ARN" \
  --message file://./center-summary-refresh-event.json
```

After publication, check the worker's CloudWatch log group (`/aws/lambda/<project>-summary-center-refresh-worker`) and the source queue/DLQ `ApproximateNumberOfMessages` attributes. Investigate the failure before replaying a DLQ message; do not purge either queue. SNS publication failure happens after persistence, so retrying the original HTTP request may create another summary. Prefer replaying the existing summary event to avoid that duplicate.

## Pre-deployment validation

```bash
terraform -chdir=infra fmt -check -recursive
terraform -chdir=infra init -backend=false
terraform -chdir=infra validate
```

Expected result: Terraform configuration is formatted and validates the SNS topic, subscription queue, queue policy, dead-letter redrive, worker Lambda, event source mapping, SSM parameter-name configuration, and least-privilege read permissions. Do not put secret values in Terraform inputs/state or run `terraform apply` as part of automated validation.

## Gated deployment in the existing AWS environment

No separate AWS environment is created. Deployment proceeds in explicit stages:

1. Provision/update SSM `SecureString` values through the approved bootstrap flow; verify names/types through `DescribeParameters` and IAM policy only, never call `GetParameter` or retrieve values.
2. Read the current `live` alias versions using AWS read-only commands and pin those exact versions as required Terraform inputs. Review a Terraform plan; apply only additive resources while summary publishing and the SQS event source mapping remain disabled.
3. Deploy candidate Lambda versions without moving the `live` aliases. Run read-only API health/configuration checks and the worker validation-only smoke check; do not insert a test summary or publish a test message to production.
4. Require operator approval, then promote aliases and enable publishing/consumption. Observe naturally submitted summaries, Lambda errors, queue depth, and DLQ; do not log contact/address data.
5. If checks fail, disable publishing and the event source mapping, restore prior aliases, and retain messages for investigation/replay.

The deployment script must not apply Terraform automatically. `terraform apply` and promotion are explicit operator actions after review; never run them as part of the quickstart or tests.
