#!/bin/bash

# Script para inicializar LocalStack com infraestrutura básica
# Execute após `docker-compose up -d`

LOCALSTACK_URL="http://localhost:4566"
REGION="us-east-1"
AWS_CREDS="--endpoint-url=$LOCALSTACK_URL --region=$REGION --access-key test --secret-key test"

echo "⏳ Aguardando LocalStack ficar pronto..."
sleep 10

echo "🚀 Iniciando configuração do LocalStack..."

# 1. Criar IAM Role para Lambda
echo "📋 Criando IAM Role..."
aws iam create-role \
  $AWS_CREDS \
  --role-name aee-lambda-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "lambda.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }' 2>/dev/null || echo "Role já existe"

# 2. Criar DynamoDB Table (para referência futura)
echo "🗄️  Criando DynamoDB Table..."
aws dynamodb create-table \
  $AWS_CREDS \
  --table-name aee_forms \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST 2>/dev/null || echo "Tabela já existe"

# 3. Criar Bucket S3 (para referência futura)
echo "🪣 Criando S3 Bucket..."
aws s3 mb \
  s3://aee-digital-bucket \
  $AWS_CREDS 2>/dev/null || echo "Bucket já existe"

echo "✅ LocalStack configurado!"
echo ""
echo "📍 Serviços disponíveis:"
echo "   - API Gateway: http://localhost:4566"
echo "   - DynamoDB: http://localhost:4566"
echo "   - Lambda: http://localhost:4566"
echo "   - S3: http://localhost:4566"
echo "   - LocalStack Admin UI: http://localhost:8080"
echo ""
echo "🔗 Use http://localhost:4566 no seu frontend como endpoint base"
