variable "project" {
  description = "Prefix/name for created resources"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "lambda_package" {
  description = "Path to the zipped Lambda artifact (relative to this module)"
  type        = string
}

variable "lambda_handler" {
  description = "Handler entrypoint"
  type        = string
  default     = "dist/src/lambda.handler"
}

variable "lambda_memory_mb" {
  description = "Lambda memory in MB"
  type        = number
  default     = 256
}

variable "lambda_timeout_seconds" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 15
}

variable "lambda_env" {
  description = "Environment variables for the Lambda function"
  type        = map(string)
  default     = {}
}

variable "api_stage" {
  description = "API Gateway stage name"
  type        = string
  default     = "prod"
}
