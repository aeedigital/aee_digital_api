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
  default     = "dist/lambda.handler"
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

variable "summary_center_refresh_worker_timeout_seconds" {
  description = "Timeout in seconds for the center summary refresh worker"
  type        = number
  default     = 30

  validation {
    condition     = var.summary_center_refresh_worker_timeout_seconds >= 1 && var.summary_center_refresh_worker_timeout_seconds <= 900
    error_message = "summary_center_refresh_worker_timeout_seconds must be between 1 and 900."
  }
}

variable "summary_center_refresh_enabled" {
  description = "Enable summary refresh publishing and SQS consumption"
  type        = bool
  default     = false
}

variable "api_live_version" {
  description = "Currently served API Lambda version; required to keep live pinned during plans"
  type        = string

  validation {
    condition     = can(regex("^[1-9][0-9]*$", var.api_live_version))
    error_message = "api_live_version must be a published numeric Lambda version."
  }
}

variable "worker_live_version" {
  description = "Currently served worker version; null only before its first deployment"
  type        = string
  default     = null
  nullable    = true

  validation {
    condition     = var.worker_live_version == null || can(regex("^[1-9][0-9]*$", var.worker_live_version))
    error_message = "worker_live_version must be null or a published numeric Lambda version."
  }
}

variable "lambda_nonsecret_env" {
  description = "Non-sensitive environment variables for the Lambda function"
  type        = map(string)
  default     = {}
}

variable "parameter_environment" {
  description = "Environment path segment for runtime parameters in Systems Manager"
  type        = string
  default     = "prod"

  validation {
    condition     = can(regex("^[A-Za-z0-9_-]+$", var.parameter_environment))
    error_message = "parameter_environment must be a single path segment."
  }
}

variable "answers_write_disabled" {
  description = "Temporarily block Answer mutations during a maintenance window"
  type        = bool
  default     = false
}

variable "lambda_arch" {
  description = "Lambda architecture (arm64 or x86_64)"
  type        = string
  default     = "arm64"
}

variable "api_stage" {
  description = "API Gateway stage name"
  type        = string
  default     = "prod"
}

variable "dashboard_projections_function_name" {
  description = "Lambda function invoked synchronously for dashboard projections"
  type        = string
  default     = "dashboard-projections"
}

variable "dashboard_projections_function_arn" {
  description = "Exact ARN allowed for dashboard projection invocation"
  type        = string
  default     = "arn:aws:lambda:us-east-1:115186094843:function:dashboard-projections"
}

variable "dashboard_projections_queue_url" {
  description = "SQS queue URL that receives center.finished.v1 events"
  type        = string
  default     = "https://sqs.us-east-1.amazonaws.com/115186094843/dashboard-projections-queue"
}

variable "dashboard_projections_queue_arn" {
  description = "Exact SQS ARN allowed for dashboard projection events"
  type        = string
  default     = "arn:aws:sqs:us-east-1:115186094843:dashboard-projections-queue"
}
