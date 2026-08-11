terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region              = var.region
  allowed_account_ids = ["115186094843"]
}

# Assume role policy for Lambda
data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_role" {
  name               = "${var.project}-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "dashboard_projections_invoke" {
  name = "${var.project}-dashboard-projections-invoke"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "lambda:InvokeFunction"
      Resource = var.dashboard_projections_function_arn
    }]
  })
}

resource "aws_s3_bucket" "lambda_artifacts" {
  bucket = "${var.project}-lambda-artifacts-115186094843-${var.region}"
}

resource "aws_s3_bucket_public_access_block" "lambda_artifacts" {
  bucket = aws_s3_bucket.lambda_artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "lambda_artifacts" {
  bucket = aws_s3_bucket.lambda_artifacts.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_object" "lambda_package" {
  bucket      = aws_s3_bucket.lambda_artifacts.id
  key         = "${var.project}.zip"
  source      = var.lambda_package
  source_hash = filebase64sha256(var.lambda_package)

  depends_on = [aws_s3_bucket_versioning.lambda_artifacts]
}

resource "aws_lambda_function" "api" {
  function_name = "${var.project}-api"
  role          = aws_iam_role.lambda_role.arn
  handler       = var.lambda_handler
  runtime       = "nodejs20.x"
  architectures = [var.lambda_arch]

  s3_bucket         = aws_s3_object.lambda_package.bucket
  s3_key            = aws_s3_object.lambda_package.key
  s3_object_version = aws_s3_object.lambda_package.version_id
  source_code_hash  = filebase64sha256(var.lambda_package)

  memory_size = var.lambda_memory_mb
  timeout     = var.lambda_timeout_seconds
  publish     = true

  environment {
    variables = merge(var.lambda_env, {
      ANSWERS_WRITE_DISABLED              = tostring(var.answers_write_disabled)
      DASHBOARD_PROJECTIONS_FUNCTION_NAME = var.dashboard_projections_function_name
    })
  }

  # Keep log retention lean; adjust if needed.
  depends_on = [aws_iam_role_policy_attachment.lambda_basic]
}

resource "aws_lambda_alias" "live" {
  name             = "live"
  description      = "Versao imutavel atualmente exposta em producao"
  function_name    = aws_lambda_function.api.function_name
  function_version = aws_lambda_function.api.version
}

# API Gateway REST
resource "aws_api_gateway_rest_api" "api" {
  name = "${var.project}-api-gw"
  body = jsonencode(local.api_spec)
}

# Rotas explícitas para o API Gateway; atualize sempre que uma rota for criada/migrada
locals {
  api_routes = [
    { method = "GET", path = "/" },
    { method = "GET", path = "/clearcache" },
    { method = "POST", path = "/cadastro-info" },
    { method = "GET", path = "/cadastro-info/active" },
    { method = "GET", path = "/forms" },
    { method = "POST", path = "/forms" },
    { method = "GET", path = "/forms/{id}" },
    { method = "PATCH", path = "/forms/{id}" },
    { method = "DELETE", path = "/forms/{id}" },
    { method = "GET", path = "/answers" },
    { method = "POST", path = "/answers" },
    { method = "PUT", path = "/answers" },
    { method = "GET", path = "/answers/{id}" },
    { method = "PATCH", path = "/answers/{id}" },
    { method = "DELETE", path = "/answers/{id}" },
    { method = "GET", path = "/centros" },
    { method = "POST", path = "/centros" },
    { method = "GET", path = "/centros/{id}" },
    { method = "PATCH", path = "/centros/{id}" },
    { method = "DELETE", path = "/centros/{id}" },
    { method = "PUT", path = "/centros/{id}/localizacao" },
    { method = "GET", path = "/centros/{id}/summaries" },
    { method = "GET", path = "/pessoas" },
    { method = "POST", path = "/pessoas" },
    { method = "GET", path = "/pessoas/{id}" },
    { method = "PATCH", path = "/pessoas/{id}" },
    { method = "DELETE", path = "/pessoas/{id}" },
    { method = "GET", path = "/regionais" },
    { method = "POST", path = "/regionais" },
    { method = "GET", path = "/regionais/overview" },
    { method = "GET", path = "/regionais/{id}" },
    { method = "PATCH", path = "/regionais/{id}" },
    { method = "DELETE", path = "/regionais/{id}" },
    { method = "GET", path = "/regionais/{id}/summaries" },
    { method = "GET", path = "/regionais/{id}/centros" },
    { method = "GET", path = "/regionais/{id}/coord-summary" },
    { method = "GET", path = "/regionais/{id}/centros-with-answers" },
    { method = "GET", path = "/passes" },
    { method = "POST", path = "/passes" },
    { method = "GET", path = "/passes/{id}" },
    { method = "PATCH", path = "/passes/{id}" },
    { method = "DELETE", path = "/passes/{id}" },
    { method = "PATCH", path = "/passes/{id}/last-logged-in" },
    { method = "GET", path = "/summaries" },
    { method = "POST", path = "/summaries" },
    { method = "GET", path = "/summaries/stats" },
    { method = "GET", path = "/summaries/{id}" },
    { method = "PATCH", path = "/summaries/{id}" },
    { method = "DELETE", path = "/summaries/{id}" },
    { method = "PATCH", path = "/summaries/{id}/validated-by-coord" },
    { method = "GET", path = "/questions" },
    { method = "POST", path = "/questions" },
    { method = "GET", path = "/questions/{id}" },
    { method = "PATCH", path = "/questions/{id}" },
    { method = "DELETE", path = "/questions/{id}" },
    { method = "GET", path = "/api" },      # Swagger UI
    { method = "GET", path = "/api-json" }, # Swagger JSON
  ]
}

# Caminhos únicos (sem "/") e metadados
locals {
  api_routes_by_path = {
    for path in distinct([for r in local.api_routes : r.path]) :
    path => [for r in local.api_routes : r if r.path == path]
  }

  api_paths = {
    for path, routes in local.api_routes_by_path :
    path => merge(
      merge([
        for r in routes : {
          (r.method == "ANY" ? "x-amazon-apigateway-any-method" : lower(r.method)) = {
            "x-amazon-apigateway-integration" = {
              uri        = aws_lambda_alias.live.invoke_arn
              httpMethod = "POST"
              type       = "aws_proxy"
            }
          }
        }
      ]...),
      {
        options = {
          "x-amazon-apigateway-integration" = {
            uri        = aws_lambda_alias.live.invoke_arn
            httpMethod = "POST"
            type       = "aws_proxy"
          }
        }
      },
    )
  }

  api_spec = {
    swagger = "2.0"
    info = {
      title   = "${var.project}-api"
      version = "1.0"
    }
    paths = local.api_paths
  }
}

resource "aws_api_gateway_deployment" "deployment" {
  depends_on  = [aws_api_gateway_rest_api.api]
  rest_api_id = aws_api_gateway_rest_api.api.id

  triggers = {
    redeployment = sha1(jsonencode(local.api_spec))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "prod" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  deployment_id = aws_api_gateway_deployment.deployment.id
  stage_name    = var.api_stage
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  qualifier     = aws_lambda_alias.live.name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

output "invoke_url" {
  value       = aws_api_gateway_stage.prod.invoke_url
  description = "Invoke URL base for the API Gateway stage"
}
