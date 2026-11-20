resource "aws_sqs_queue_policy" "center_summary_refresh" {
  queue_url = aws_sqs_queue.center_summary_refresh.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "AllowOnlyCenterSummaryRefreshTopic"
      Effect = "Allow"
      Principal = {
        Service = "sns.amazonaws.com"
      }
      Action   = "sqs:SendMessage"
      Resource = aws_sqs_queue.center_summary_refresh.arn
      Condition = {
        ArnEquals = {
          "aws:SourceArn" = aws_sns_topic.center_summary_refresh.arn
        }
        StringEquals = {
          "aws:SourceAccount" = data.aws_caller_identity.current.account_id
        }
      }
    }]
  })
}

resource "aws_sns_topic_subscription" "center_summary_refresh" {
  topic_arn            = aws_sns_topic.center_summary_refresh.arn
  protocol             = "sqs"
  endpoint             = aws_sqs_queue.center_summary_refresh.arn
  raw_message_delivery = true

  depends_on = [aws_sqs_queue_policy.center_summary_refresh]
}
