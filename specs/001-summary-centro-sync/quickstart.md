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

No separate AWS environment is created. Set the approved AWS profile and region, and confirm the account target is `115186094843`. The deploy script's default mode is read-only planning; it never applies changes implicitly.

1. Provision the API and worker `SecureString` values using the approved secure input flow. This is the separate T009 gate. Check parameter names/types through `DescribeParameters`; do not retrieve or print values.
2. Create and review the additive infrastructure plan:

   ```bash
   AWS_PROFILE=<approved-profile> AWS_REGION=us-east-1 ./scripts/deploy.sh plan --target infrastructure
   ```

   The script builds the Lambda artifact, reads the current API `live` version, and pins it in the plan. On the first worker deployment, no worker `live` alias exists yet; its initial alias is created from the new version while consumption remains disabled. Terraform plan files and integrity metadata are written outside the repository with restrictive permissions. Treat them as sensitive because Terraform can retain prior state values; do not share or commit them. The script redacts sensitive-looking values from displayed plan output.
3. Inspect the complete plan. Apply only after approval, using the exact plan path printed by the script:

   ```bash
   ./scripts/deploy.sh apply <plan-file> --confirm-account 115186094843
   ```

   This provisions SNS/SQS/DLQ, IAM, worker and candidate versions while keeping `live` pinned and summary publishing/consumption disabled.
4. Build and apply a candidate plan without moving `live`:

   ```bash
   ./scripts/deploy.sh plan --target candidate
   ./scripts/deploy.sh candidate <plan-file> --confirm-account 115186094843
   ```

   After T009 is complete, run the smoke checks. They use `DescribeParameters` for metadata and invoke only the `candidate` aliases; the worker invocation contains an invalid event and must return it as a batch failure. It does not publish to SNS/SQS or write to Mongo.

   ```bash
   PARAMETER_PROJECT=<project> PARAMETER_ENVIRONMENT=<environment> \
     AWS_REGION=us-east-1 node scripts/smoke/summary-center-candidate.mjs
   ```
5. Record the current and candidate alias versions. After manual approval, promote code with synchronization still disabled:

   ```bash
   ./scripts/deploy.sh plan --target promotion
   ./scripts/deploy.sh promote <plan-file> --confirm-account 115186094843
   ```

   Enabling synchronization is a separate, explicit promotion plan:

   ```bash
   ./scripts/deploy.sh plan --target promotion --enable-refresh
   ./scripts/deploy.sh promote <plan-file> --confirm-account 115186094843
   ```

   This enables API SNS publishing and the worker's SQS event source mapping together. Do this only after SSM values and candidate checks are confirmed.
6. Monitor API/worker Lambda `Errors`, `Throttles`, and `Duration`, source queue visible/in-flight messages and oldest-message age, and DLQ visible messages. Do not log contact/address data. Observe naturally submitted summaries only; do not create production test summaries or publish synthetic messages.
7. For rollback, first create and approve an `infrastructure` plan to disable publishing and SQS consumption. Then restore the recorded previous versions:

   ```bash
   ./scripts/deploy.sh plan --target infrastructure
   ./scripts/deploy.sh apply <plan-file> --confirm-account 115186094843
   ./scripts/deploy.sh rollback api <previous-version> --confirm-account 115186094843
   ./scripts/deploy.sh rollback worker <previous-version> --confirm-account 115186094843
   ```

   Keep queued messages for diagnosis/replay; never purge them automatically. The rollback command updates only the selected `live` alias and requires the approved account confirmation.

Do not run raw `terraform apply`. `apply`, candidate deployment, promotion, and rollback require an explicit mode, reviewed plan or published version, and account confirmation.
