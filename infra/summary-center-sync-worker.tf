data "aws_iam_policy_document" "summary_center_refresh_worker_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "summary_center_refresh_worker" {
  name               = "${var.project}-summary-center-refresh-worker-role"
  assume_role_policy = data.aws_iam_policy_document.summary_center_refresh_worker_assume.json
}

resource "aws_iam_role_policy_attachment" "summary_center_refresh_worker_basic" {
  role       = aws_iam_role.summary_center_refresh_worker.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "summary_center_refresh_worker_permissions" {
  name = "${var.project}-summary-center-refresh-worker"
  role = aws_iam_role.summary_center_refresh_worker.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ReadWorkerRuntimeParameters"
        Effect = "Allow"
        Action = ["ssm:GetParameter", "ssm:GetParameters"]
        Resource = [
          "arn:aws:ssm:${var.region}:${data.aws_caller_identity.current.account_id}:parameter/${var.project}/${var.parameter_environment}/MONGODB_URI",
          "arn:aws:ssm:${var.region}:${data.aws_caller_identity.current.account_id}:parameter/${var.project}/${var.parameter_environment}/GEOAPIFY_API_KEY",
        ]
      },
      {
        Sid      = "DecryptWorkerSecureStrings"
        Effect   = "Allow"
        Action   = ["kms:Decrypt"]
        Resource = data.aws_kms_alias.ssm.target_key_arn
        Condition = {
          StringEquals = {
            "kms:ViaService" = "ssm.${var.region}.amazonaws.com"
          }
        }
      },
      {
        Sid      = "ConsumeCenterSummaryRefreshQueue"
        Effect   = "Allow"
        Action   = ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"]
        Resource = aws_sqs_queue.center_summary_refresh.arn
      }
    ]
  })
}

resource "aws_iam_role_policy" "summary_center_refresh_publish" {
  name = "${var.project}-summary-center-refresh-publish"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "sns:Publish"
      Resource = aws_sns_topic.center_summary_refresh.arn
    }]
  })
}

resource "aws_lambda_function" "summary_center_refresh_worker" {
  function_name = "${var.project}-summary-center-refresh-worker"
  role          = aws_iam_role.summary_center_refresh_worker.arn
  handler       = "dist/summary-updates.lambda.handler"
  runtime       = "nodejs20.x"
  architectures = [var.lambda_arch]

  s3_bucket         = aws_s3_object.lambda_package.bucket
  s3_key            = aws_s3_object.lambda_package.key
  s3_object_version = aws_s3_object.lambda_package.version_id
  source_code_hash  = filebase64sha256(var.lambda_package)

  memory_size = var.lambda_memory_mb
  timeout     = var.summary_center_refresh_worker_timeout_seconds
  publish     = true

  environment {
    variables = {
      PARAMETER_ENVIRONMENT = var.parameter_environment
      PARAMETER_PROJECT     = var.project
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.summary_center_refresh_worker_basic,
    aws_iam_role_policy.summary_center_refresh_worker_permissions,
  ]
}

resource "aws_lambda_alias" "summary_center_refresh_worker_live" {
  name             = "live"
  description      = "Versao aprovada do worker de sincronizacao"
  function_name    = aws_lambda_function.summary_center_refresh_worker.function_name
  function_version = var.worker_live_version == null ? aws_lambda_function.summary_center_refresh_worker.version : var.worker_live_version
}

resource "aws_lambda_alias" "summary_center_refresh_worker_candidate" {
  name             = "candidate"
  description      = "Versao candidata do worker de sincronizacao"
  function_name    = aws_lambda_function.summary_center_refresh_worker.function_name
  function_version = aws_lambda_function.summary_center_refresh_worker.version
}

resource "aws_lambda_event_source_mapping" "summary_center_refresh_worker" {
  event_source_arn = aws_sqs_queue.center_summary_refresh.arn
  function_name    = aws_lambda_alias.summary_center_refresh_worker_live.arn
  enabled          = var.summary_center_refresh_enabled
  batch_size       = 10

  function_response_types = ["ReportBatchItemFailures"]
}
