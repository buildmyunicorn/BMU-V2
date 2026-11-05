# Startup Preflight 2.0 — Google Cloud Deployment Guide (`startuppreflight` / `europe-west1`)

This guide walks you through deploying **Startup Preflight 2.0** to **Google Cloud Run** + **Google Cloud SQL (PostgreSQL 16)** using **Google Cloud Vertex AI** (enterprise-grade, tied directly to your GCP project and billing, with zero Google Workspace / AI Studio dependency).

---

## Architecture Overview

```
                                      ┌────────────────────────┐
                                      │   Google Cloud IAM     │
                                      │  (roles/aiplatform.user│
                                      └───────────┬────────────┘
                                                  │ (ADC Token)
┌────────────────┐      ┌─────────────────────────▼──────────────┐      ┌───────────────────────┐
│ Browser / User ├─────►│  Cloud Run (startuppreflight-web)      ├─────►│  Vertex AI Models     │
└────────────────┘      │  Node.js Next.js Standalone (Port 8080)│      │  gemini-2.5-flash     │
                        └─────────────┬──────────────────────────┘      │  gemini-2.5-pro       │
                                      │ (Unix Socket)                   └───────────────────────┘
                                      ▼
                        ┌────────────────────────────────────────┐
                        │  Cloud SQL (PostgreSQL 16)             │
                        │  Instance: spf-postgres                │
                        │  Database: startuppreflight_prod       │
                        └────────────────────────────────────────┘
```

---

## Step 1: Set Up Project & CLI on Your Mac

```bash
# 1. Log in with your new Google Account
gcloud auth login

# 2. Create and activate a configuration for startuppreflight
gcloud config configurations create startuppreflight
gcloud config set account tom@startuppreflight.com
gcloud config set project startuppreflight
gcloud config set run/region europe-west1

# 3. Enable Required Google Cloud APIs (including Vertex AI)
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  aiplatform.googleapis.com \
  --project=startuppreflight
```

---

## Step 2: Grant Vertex AI Permissions to the Cloud Run Service Account

Cloud Run uses its default Compute service account to execute. Grant it access to call Vertex AI without any API keys:

```bash
# 1. Retrieve the project number
PROJECT_NUM=$(gcloud projects describe startuppreflight --format="value(projectNumber)")

# 2. Grant Vertex AI User role to Cloud Run's service account
gcloud projects add-iam-policy-binding startuppreflight \
  --member="serviceAccount:${PROJECT_NUM}-compute@developer.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

---

## Step 3: Create Cloud SQL PostgreSQL 16 Instance

```bash
# 1. Create the PostgreSQL 16 instance in europe-west1
gcloud sql instances create spf-postgres \
  --database-version=POSTGRES_16 \
  --edition=ENTERPRISE \
  --tier=db-f1-micro \
  --region=europe-west1 \
  --storage-auto-increase \
  --project=startuppreflight

# 2. Create the production database
gcloud sql databases create startuppreflight_prod \
  --instance=spf-postgres \
  --project=startuppreflight

# 3. Create the database user
gcloud sql users create spf_db_user \
  --instance=spf-postgres \
  --password="CHANGE_ME_SECURE_PASSWORD" \
  --project=startuppreflight
```

---

## Step 4: Push Drizzle Schema & Restore Existing Data to Cloud SQL

Before migrating, your current data from the old project has already been exported to `backups/latest_backup.json` (via `npm run db:backup`).

```bash
# 1. Get Cloud SQL Public IP and authorize your current Mac IP
SQL_IP=$(gcloud sql instances describe spf-postgres --project=startuppreflight --format="value(ipAddresses[0].ipAddress)")
MY_IP=$(curl -s https://api.ipify.org)

gcloud sql instances patch spf-postgres \
  --authorized-networks="$MY_IP/32" \
  --project=startuppreflight \
  --quiet

# 2. Point Drizzle to the new Cloud SQL instance
export DATABASE_URL="postgresql://spf_db_user:CHANGE_ME_SECURE_PASSWORD@$SQL_IP:5432/startuppreflight_prod"

# 3. Create fresh table structures
npm run db:push

# 4. Restore your users, admin panel records, vouchers, entitlements & plans
npm run db:restore

# 5. Remove your public IP once migration is completed
gcloud sql instances patch spf-postgres \
  --authorized-networks="" \
  --project=startuppreflight \
  --quiet
```

---

## Step 5: Deploy to Google Cloud Run with Vertex AI

Generate a 32-byte hexadecimal random secret for cookie encryption:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Deploy the Next.js app with `GOOGLE_GENAI_USE_VERTEXAI=true`:

```bash
gcloud run deploy startuppreflight-web \
  --source . \
  --project=startuppreflight \
  --region=europe-west1 \
  --allow-unauthenticated \
  --add-cloudsql-instances="startuppreflight:europe-west1:spf-postgres" \
  --set-env-vars="NODE_ENV=production,\
GOOGLE_GENAI_USE_VERTEXAI=true,\
GOOGLE_CLOUD_PROJECT=startuppreflight,\
GOOGLE_CLOUD_LOCATION=europe-west1,\
MAX_DAILY_PLATFORM_AI_CALLS=500,\
BETTER_AUTH_SECRET=YOUR_32_BYTE_HEX_SECRET,\
SUPER_ADMIN_MASTER_PASSWORD=YOUR_STRONG_ADMIN_PASSWORD,\
DATABASE_URL=postgresql://spf_db_user:CHANGE_ME_SECURE_PASSWORD@localhost/startuppreflight_prod?host=/cloudsql/startuppreflight:europe-west1:spf-postgres"
```

---

## Step 6: Vertex AI & Billing Protection Checklist

1. **Zero-Key Security (Vertex AI ADC)**:
   * By setting `GOOGLE_GENAI_USE_VERTEXAI=true`, the platform authenticates via Google Cloud Application Default Credentials (ADC) backed by Cloud Run's IAM service account.
   * No API keys need to be stored in environment variables, rotated, or exposed.
2. **AI Billing Circuit Breaker (`MAX_DAILY_PLATFORM_AI_CALLS=500`)**:
   * Enforced server-side in `src/lib/ai/router.ts`. Caps total platform AI calls at **500 calls per 24 hours** across all users, plus **8 calls/min** and **60 calls/hr** per user, and `maxOutputTokens: 2048`.
   * Automatically switches to deterministic smart-synthesizer fallback when the daily ceiling is reached.
3. **Google Cloud Billing Alerts**:
   * Set budget alerts at **€15, €30, and €50/month** in [Google Cloud Console → Billing → Budgets & Alerts](https://console.cloud.google.com/billing/budgets).

---

## Step 7: Custom Domain Setup & WWW Handling

The domain DNS is managed in **Cloudflare** (`coen.ns.cloudflare.com` / `ines.ns.cloudflare.com`).

### 1. Apex Domain (`startuppreflight.com`):
- Mapped in Cloud Run to `startuppreflight-web` in `europe-west1`.
- DNS in Cloudflare has 4 A records pointing to Google Frontend IPs (`216.239.32.21`, `216.239.34.21`, `216.239.36.21`, `216.239.38.21`) and 4 AAAA records.

### 2. WWW Subdomain (`www.startuppreflight.com`):
To ensure `www.startuppreflight.com` resolves cleanly to `startuppreflight.com`:

#### Recommended Approach: Cloudflare 301 Redirect (Canonical Apex)
Consolidates all SEO authority, cookies, and traffic onto `https://startuppreflight.com`:
1. In Cloudflare DNS:
   - Add a CNAME record: `www` pointing to `startuppreflight.com` (Proxy status: **Proxied** / Orange Cloud).
2. In Cloudflare Rules -> **Redirect Rules**:
   - Rule name: `Redirect WWW to Apex`
   - Match: `Hostname equals www.startuppreflight.com`
   - Target URL (Dynamic): `concat("https://startuppreflight.com", http.request.uri.path)`
   - Status: `301 Moved Permanently` (Preserve query string: checked).

#### Alternative Approach: Direct Cloud Run Mapping
1. Cloud Run domain mapping for `www.startuppreflight.com` has been provisioned:
   ```bash
   gcloud beta run domain-mappings create --service=startuppreflight-web --domain=www.startuppreflight.com --region=europe-west1 --project=startuppreflight
   ```
2. In Cloudflare DNS:
   - Add CNAME record: Name `www`, Target `ghs.googlehosted.com.`, Proxy status: **DNS Only** (Grey Cloud) until certificate issues.

