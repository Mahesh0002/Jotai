.PHONY: start stop logs pull-model test clean

# Default target
start:
	docker compose up --build -d
	@echo "Services starting... Run 'make logs' to see output"

stop:
	docker compose down

logs:
	docker compose logs -f

pull-model:
	docker compose exec ollama ollama pull qwen2.5:3b-instruct-q4_K_M
	docker compose exec ollama ollama pull nomic-embed-text

test:
	cd backend && npm test
	cd runner && python -m pytest -v

test-backend:
	cd backend && npm test

test-runner:
	cd runner && python -m pytest -v

clean:
	docker compose down -v
	rm -rf backend/node_modules runner/__pycache__ runner/services/__pycache__ runner/agents/__pycache__ runner/actions/__pycache__ runner/events/__pycache__

dev-backend:
	cd backend && npm run dev

dev-runner:
	cd runner && python app.py

migrate:
	cd backend && node src/db/migrate.js

install:
	cd backend && npm install
	cd runner && pip install -r requirements.txt

# Run everything locally without Docker (requires Ollama running on localhost:11434)
local-start:
	@echo "Starting Ollama (must be installed)..."
	@ollama serve & \
	sleep 3 && \
	cd backend && npm run dev & \
	cd runner && python app.py

# Health checks
health:
	@curl -s http://localhost:5000/health | jq .
	@curl -s http://localhost:8000/health | jq .

# Smoke tests
smoke:
	@curl -s http://localhost:5000/health
	@curl -s http://localhost:8000/health
	@curl -s -X POST http://localhost:8000/api/runner/trigger \
	  -H 'content-type: application/json' \
	  -d '{"intent":"what is my status?","sessionId":"smoke"}'
	@curl -s -X POST http://localhost:8000/api/runner/trigger \
	  -H 'content-type: application/json' \
	  -d '{"intent":"update my schedule from my calendar","sessionId":"smoke"}'
	@curl -s -X POST http://localhost:8000/api/runner/trigger \
	  -H 'content-type: application/json' \
	  -d '{"intent":"find my notes about focus","sessionId":"smoke"}'