.PHONY: help install start dev stop clean build test-api get-token

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	npm install

start: ## Start infrastructure services (PostgreSQL and Keycloak)
	docker-compose up -d
	@echo "Waiting for services to be ready..."
	@sleep 5
	@docker-compose ps

stop: ## Stop infrastructure services
	docker-compose down

clean: ## Stop services and remove volumes
	docker-compose down -v
	rm -rf node_modules dist logs/*.log

dev: ## Start development server
	npm run dev

build: ## Build for production
	npm run build

test-api: ## Test API endpoints (requires TOKEN env var)
	@./scripts/test-api.sh

get-token: ## Get JWT token from Keycloak (usage: make get-token USER=testuser PASS=testpass)
	@./scripts/get-token.sh $(USER) $(PASS)

logs: ## View application logs
	tail -f logs/combined.log

db-shell: ## Connect to PostgreSQL database
	docker exec -it node-api-postgres psql -U postgres -d node_api_db

keycloak-shell: ## Open Keycloak admin console in browser
	@echo "Opening Keycloak admin console..."
	@open http://localhost:11000 || xdg-open http://localhost:11000 || echo "Please open http://localhost:11000 manually"

api-docs: ## Open API documentation in browser
	@echo "Opening API documentation..."
	@open http://localhost:3000/api-docs || xdg-open http://localhost:3000/api-docs || echo "Please open http://localhost:3000/api-docs manually"

reset: clean install start ## Reset everything (clean, install, start)

setup: install start ## Complete setup (install deps and start services)
	@echo ""
	@echo "Setup complete! Next steps:"
	@echo "1. Configure Keycloak at http://localhost:11000 (admin/admin)"
	@echo "2. Update .env with Keycloak client secret"
	@echo "3. Run 'make dev' to start the API server"
	@echo ""
	@echo "See QUICKSTART.md for detailed instructions"
