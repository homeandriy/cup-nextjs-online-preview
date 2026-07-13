.DEFAULT_GOAL := help

CYPRESS_SPEC ?=

.PHONY: help dev up down build lint cypress logs

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "%-12s %s\n", $$1, $$2}'

dev: ## Start Next.js development server in the foreground
	docker compose up --build next-app

up: ## Start Next.js development server in the background
	docker compose up -d next-app

down: ## Stop project containers
	docker compose down

build: ## Create a production Next.js build inside the running app container
	docker compose exec next-app npm run build

lint: ## Run ESLint inside the running app container
	docker compose exec next-app npm run lint

cypress: ## Run Cypress tests; optionally set CYPRESS_SPEC=cypress/e2e/example.cy.ts
	docker compose run --rm cypress npx cypress run $(if $(CYPRESS_SPEC),--spec $(CYPRESS_SPEC))

logs: ## Follow Next.js container logs
	docker compose logs -f next-app
