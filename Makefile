# MCP LND Server Makefile

.PHONY: help build clean dev lint format validate test

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Build the TypeScript project
	npm run build

dev: ## Run the server in development mode with auto-reload
	npm run dev

lint: ## Run linter
	npm run lint

format: ## Format code with Prettier
	npm run format

validate: ## Run all validation (lint, format check, type check)
	npm run validate

test: ## Run tests
	npm test

clean: ## Remove build artifacts
	rm -rf dist
	rm -rf node_modules
