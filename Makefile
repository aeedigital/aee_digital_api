.PHONY: help dev-up dev-down dev-logs dev-clean lint test test-cov test-e2e build pre-deploy

help:
	@echo "🚀 Comandos disponíveis:"
	@echo ""
	@echo "Desenvolvimento:"
	@echo "  make dev-up          - Inicia Docker com API"
	@echo "  make dev-down        - Para os containers"
	@echo "  make dev-logs        - Mostra logs da API"
	@echo "  make dev-clean       - Remove containers"
	@echo ""
	@echo "Testing:"
	@echo "  make test            - Roda testes unitários"
	@echo "  make test-watch      - Testes em modo watch"
	@echo "  make test-cov        - Testes com cobertura"
	@echo "  make test-e2e        - Testes E2E"
	@echo ""
	@echo "Build & Deploy:"
	@echo "  make lint            - Lint do código"
	@echo "  make build           - Build de produção"
	@echo "  make pre-deploy      - Executa: lint, test:cov, build, test:e2e"
	@echo ""

dev-up:
	npm run docker:up

dev-down:
	npm run docker:down

dev-logs:
	npm run docker:logs

dev-clean:
	npm run docker:clean
	@echo "✅ Ambiente local limpo"

lint:
	npm run lint

test:
	npm run test

test-watch:
	npm run test:watch

test-cov:
	npm run test:cov

test-e2e:
	npm run test:e2e

build:
	npm run build

pre-deploy:
	npm run pre-deploy

.DEFAULT_GOAL := help
