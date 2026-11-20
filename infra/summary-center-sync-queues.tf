resource "aws_sqs_queue" "center_summary_refresh_dlq" {
  name                      = "${var.project}-center-summary-refresh-dlq"
  message_retention_seconds = 1209600
  sqs_managed_sse_enabled   = true
}

resource "aws_sqs_queue" "center_summary_refresh" {
  name                       = "${var.project}-center-summary-refresh"
  message_retention_seconds  = 345600
  visibility_timeout_seconds = var.summary_center_refresh_worker_timeout_seconds * 6
  sqs_managed_sse_enabled    = true

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.center_summary_refresh_dlq.arn
    maxReceiveCount     = 5
  })
}
