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
