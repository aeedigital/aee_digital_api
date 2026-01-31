project                = "aee-digital"
region                 = "us-east-1"
lambda_package         = "../dist.zip" # ajuste para o caminho real do zip
lambda_handler         = "dist/src/lambda.handler"
lambda_memory_mb       = 256
lambda_timeout_seconds = 15
lambda_env = {
  NODE_ENV = "production"
}
api_stage = "prod"
