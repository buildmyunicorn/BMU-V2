# Build My Unicorn (BMU) 2.0 — Phase 1 Google Cloud Deployment Guide (`bmu-v3` / `europe-west1`)

This guide walks you through deploying **Phase 1** (Landing Page `/`, Email/Password Sign-Up `/register`, Login `/login`, 60-Second Onboarding `/onboarding`, and Temp Founder Workspace `/workspace`) to **Google Cloud SQL for PostgreSQL** + **Google Cloud Run** directly from your terminal.

---

## Step 1: Set Your Google Cloud Project & Create Cloud SQL Instance

```powershell
gcloud config set project bmu-v3

gcloud services enable run.googleapis.com sqladmin.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com --project=bmu-v3

gcloud sql instances create bmu-postgres --database-version=POSTGRES_16 --edition=ENTERPRISE --tier=db-f1-micro --region=europe-west1 --storage-auto-increase --project=bmu-v3
```

---

## Step 2: Create the Database (`bmu_prod`) and User (`bmu_user`)

```powershell
# 1. Create the PostgreSQL database
gcloud sql databases create bmu_prod --instance=bmu-postgres --project=bmu-v3

# 2. Create the database user
gcloud sql users create bmu_user --instance=bmu-postgres --password="Clanmahonrd01!" --project=bmu-v3
```

---

## Step 3: Push the Drizzle Schema & Seed Data to Cloud SQL

```powershell
# 1. Get the Cloud SQL IP and authorize your current IP
$SQL_IP = (gcloud sql instances describe bmu-postgres --project=bmu-v3 --format="value(ipAddresses[0].ipAddress)")
$MY_IP = (Invoke-RestMethod -Uri "https://api.ipify.org")
gcloud sql instances patch bmu-postgres --authorized-networks="$MY_IP/32" --project=bmu-v3 --quiet

# 2. Point Drizzle to Cloud SQL and push tables + seed data
$env:DATABASE_URL = "postgresql://bmu_user:Clanmahonrd01!@$SQL_IP`:5432/bmu_prod"
npm run db:push
npm run db:seed
```

---

## Step 4: Deploy Phase 1 to Google Cloud Run (`gcloud run deploy`)

```powershell
gcloud run deploy bmu-v2 `
  --source . `
  --project=bmu-v3 `
  --region=europe-west1 `
  --allow-unauthenticated `
  --add-cloudsql-instances="bmu-v3:europe-west1:bmu-postgres" `
  --set-env-vars="NODE_ENV=production,BETTER_AUTH_SECRET=bmu-v3-prod-secret-2026,DATABASE_URL=postgresql://bmu_user:Clanmahonrd01!@localhost/bmu_prod?host=/cloudsql/bmu-v3:europe-west1:bmu-postgres"
```
