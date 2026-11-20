# Runtime configuration and secrets

## Parameter Store layout

Lambda runtime secrets use AWS Systems Manager Parameter Store `SecureString` parameters:

```text
/${project}/${environment}/${NAME}
```

Use the AWS-managed `alias/aws/ssm` KMS key unless a separately approved key is required. `PARAMETER_PROJECT` and `PARAMETER_ENVIRONMENT` are non-secret Lambda settings that select the project and environment segments of the path. Terraform derives the project segment from `var.project` and defaults the existing environment segment to `prod`. Do not pass secret values through Terraform variables, Terraform state, Lambda environment variables, command-line arguments, logs, or deployment artifacts.

## Runtime inventory

| Consumer | Secure parameters |
|---|---|
| HTTP API Lambda | `MONGODB_URI`, `LOCATION_UPDATE_TOKEN` |
| Summary refresh worker Lambda | `MONGODB_URI`, `GEOAPIFY_API_KEY` |
| Local geocoding maintenance script | `GEOAPIFY_API_KEY`, `LOCATION_UPDATE_TOKEN` |

`NODE_ENV`, `PORT`, `AWS_REGION`, MongoDB pool/timeouts, Lambda function names, queue URLs, topic ARNs, and API stage names are configuration rather than credentials. Terraform accepts these through `lambda_nonsecret_env`; do not put credentials in that map. Review any new runtime consumer before adding parameters; grant each Lambda access only to the names it needs.

## Runtime loading

When `PARAMETER_ENVIRONMENT` is set, the Lambda loads only its required parameters with decryption during cold start and caches them in that execution environment. Missing parameters or denied access are startup failures; there is no fallback to an embedded URI or a plaintext Lambda setting.

When `PARAMETER_ENVIRONMENT` is unset, local development reads values from an untracked `.env` file. `.env.example` contains placeholders only. Tests and Memory persistence must not contact AWS.

## Provisioning and rotation

Use the approved secret manager or secure operator input to provision `SecureString` values. Specify the target environment explicitly. Provisioning tools must not accept secret values as command-line arguments or print them. Verify parameter names, types, and IAM access without retrieving or displaying values.

After rotation, recycle or redeploy the affected Lambda execution environments so the cold-start cache reloads the updated value. Do not provision production parameters or deploy changes without explicit approval.

## Gated Lambda rollout

The existing AWS environment uses separate `candidate` and `live` aliases for the API and summary refresh worker. Terraform plans pin the API `live` alias to the version currently served; the worker's existing `live` version is pinned when present. Its initial alias is created with the first worker version while the SQS event source mapping is disabled.

Use `scripts/deploy.sh plan --target infrastructure` to build the artifact and create a reviewed plan outside the repository. The plan mode checks the fixed target account and reads current aliases but does not apply changes. Apply an inspected plan only with its printed path and explicit account confirmation:

```bash
./scripts/deploy.sh apply <plan-file> --confirm-account 115186094843
```

Candidate deployments use `plan --target candidate` followed by `candidate <plan-file> --confirm-account ...`; they do not move `live`. The default Terraform setting keeps `SUMMARY_CENTER_REFRESH_ENABLED=false`, which also leaves the worker event source mapping disabled. Complete the separate SecureString provisioning gate and run the candidate checks before promotion.

Promotion uses a plan based on candidate alias versions. Promote once with refresh disabled to move approved code into `live`; enabling SNS publishing and SQS consumption requires a separate `plan --target promotion --enable-refresh` and explicit approval. The candidate smoke script queries SSM metadata with `DescribeParameters` only and never prints values; Lambda candidates load their own required parameters at startup.

Monitor API and worker Lambda errors, throttles, and duration, queue depth/oldest-message age, and DLQ depth. To roll back, first apply an approved infrastructure plan with refresh disabled, then use `scripts/deploy.sh rollback api <version> --confirm-account 115186094843` and/or the corresponding `worker` command. Preserve messages in SQS/DLQ for investigation and replay. See the [feature rollout quickstart](../specs/001-summary-centro-sync/quickstart.md) for the full command sequence.
