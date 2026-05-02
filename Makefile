.PHONY: dev web mobile install typecheck lint

dev: ## Start web + mobile concurrently
	pnpm dev

web: ## Start only the web app (localhost:3000)
	pnpm --filter @cardvault/web dev

mobile: ## Start only the mobile app (Expo)
	pnpm --filter @cardvault/mobile dev

install: ## Install all dependencies
	pnpm install

typecheck: ## Type-check all packages
	pnpm typecheck

lint: ## Lint all packages
	pnpm lint

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*##"}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'
