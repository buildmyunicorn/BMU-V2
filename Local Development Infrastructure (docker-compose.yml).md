version: '3.9'

services:
  postgres:
    image: pgvector/pgvector:pg16
    container_name: bmu_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: bmu_user
      POSTGRES_PASSWORD: bmu_local_password
      POSTGRES_DB: bmu_dev
    ports:
      - '5432:5432'
    volumes:
      - bmu_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U bmu_user -d bmu_dev']
      interval: 5s
      timeout: 5s
      retries: 5

  mailpit:
    image: axllent/mailpit:latest
    container_name: bmu_mailpit
    restart: unless-stopped
    ports:
      - '8025:8025' # Web UI to view Co-Founder Invites & Auth Emails locally (http://localhost:8025)
      - '1025:1025' # SMTP port for local app

volumes:
  bmu_pgdata: