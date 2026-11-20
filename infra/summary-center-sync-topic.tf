resource "aws_sns_topic" "center_summary_refresh" {
  name = "${var.project}-center-summary-refresh"
}
