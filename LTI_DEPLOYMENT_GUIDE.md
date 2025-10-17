# LTI 1.3 Backend Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the LTI 1.3 backend to Google Cloud Run with Google Cloud Firestore for data persistence.

## Architecture

- **Backend**: Express.js (TypeScript)
- **Hosting**: Google Cloud Run
- **Database**: Google Cloud Firestore
- **Authentication**: Firebase Authentication
- **Secrets**: Google Cloud Secret Manager
- **Container Registry**: Google Container Registry (GCR)

---

## Prerequisites

1. Google Cloud Platform account
2. gcloud CLI installed and configured
3. Docker installed locally (for testing)
4. Firebase project created
5. Classera sandbox/production credentials

---

## Step 1: Set Up Google Cloud Project

```bash
# Set your project ID
export PROJECT_ID="your-project-id"

# Set the project
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable firestore.googleapis.com
```

---

## Step 2: Set Up Google Cloud Firestore

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to Firestore
3. Click "Create Database"
4. Choose "Native Mode"
5. Select your preferred region (e.g., `us-central1`)
6. Click "Create"

The Firestore collections will be created automatically when the application runs:
- `lti_sessions`
- `users`
- `lti_contexts`
- `lti_resource_links`
- `lti_launches`
- `lti_grade_passbacks`

---

## Step 3: Generate RSA Key Pair

Run the backend locally once to generate RSA keys:

```bash
cd server
npm install
npm run server:dev
```

The server will generate and print an RSA private key. Copy this key for the next step.

---

## Step 4: Store Secrets in Google Secret Manager

```bash
# Store Firebase Service Account JSON
gcloud secrets create firebase-service-account \
  --data-file=path/to/firebase-service-account.json

# Store LTI Private Key
echo "-----BEGIN PRIVATE KEY-----
YOUR_PRIVATE_KEY_HERE
-----END PRIVATE KEY-----" | gcloud secrets create lti-private-key --data-file=-

# Store Classera Staging Token
echo "e815fcea52034d3bd84cc47fcf0bd713c6094519" | \
  gcloud secrets create classera-token-staging --data-file=-

# Store Classera Production Token
echo "e469dc5086ef1491afaece7452ff3dd8d5e2a73a" | \
  gcloud secrets create classera-token-production --data-file=-

# Store Classera Client ID
echo "5ee30a16-c764-47d1-8314-effae92c950a" | \
  gcloud secrets create classera-client-id --data-file=-
```

---

## Step 5: Create Service Account

```bash
# Create service account
gcloud iam service-accounts create lti-backend-sa \
  --display-name="LTI Backend Service Account"

# Grant Firestore access
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:lti-backend-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

# Grant Secret Manager access
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:lti-backend-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## Step 6: Build and Deploy to Cloud Run

### Option A: Using Cloud Build (Recommended)

```bash
# Submit build
gcloud builds submit --config cloudbuild.yaml

# The Cloud Build configuration will automatically:
# 1. Build the Docker image
# 2. Push to Container Registry
# 3. Deploy to Cloud Run
```

### Option B: Manual Deployment

```bash
# Build Docker image
docker build -t gcr.io/$PROJECT_ID/mashroui-lti-backend:latest .

# Push to Container Registry
docker push gcr.io/$PROJECT_ID/mashroui-lti-backend:latest

# Deploy to Cloud Run
gcloud run deploy mashroui-lti-backend \
  --image gcr.io/$PROJECT_ID/mashroui-lti-backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 1 \
  --max-instances 10 \
  --service-account lti-backend-sa@$PROJECT_ID.iam.gserviceaccount.com \
  --set-env-vars NODE_ENV=production,PORT=8080,CLASSERA_CLIENT_ID=5ee30a16-c764-47d1-8314-effae92c950a,CLASSERA_DEPLOYMENT_ID=27,FRONTEND_URL=https://your-frontend-domain.com \
  --set-secrets FIREBASE_SERVICE_ACCOUNT=firebase-service-account:latest,LTI_PRIVATE_KEY=lti-private-key:latest,CLASSERA_TOKEN_STAGING=classera-token-staging:latest,CLASSERA_TOKEN_PRODUCTION=classera-token-production:latest
```

---

## Step 7: Configure Custom Domain (Optional)

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service mashroui-lti-backend \
  --domain lti.yourdomain.com \
  --region us-central1

# Follow the DNS configuration instructions provided by the command
```

---

## Step 8: Configure Classera

### For Sandbox Environment

1. Log into Classera sandbox: https://partners.classera.com
   - Username: `mou_partner`
   - Password: `53D06F24fa93`

2. Navigate to LTI Tool Provider settings

3. Register your tool with these settings:
   - **Tool Name**: MyProject Platform
   - **Initiate Login URL**: `https://YOUR_CLOUD_RUN_URL/api/lti/login`
   - **Target Link URI**: `https://YOUR_CLOUD_RUN_URL/lti/launch`
   - **JWKS URL**: `https://YOUR_CLOUD_RUN_URL/api/lti/.well-known/jwks.json`
   - **Client ID**: `5ee30a16-c764-47d1-8314-effae92c950a`
   - **Deployment ID**: `27`

4. Enable these placements:
   - Course Navigation
   - Assignment Selection (for Deep Linking)

5. Save the configuration

### For Production Environment

Follow the same steps as sandbox, but use production credentials and update `NODE_ENV=production` in Cloud Run environment variables.

---

## Step 9: Test the Integration

1. In Classera, navigate to a test course
2. Click on the LTI tool in the course navigation
3. You should be redirected through the LTI authentication flow
4. Verify you're logged into your application automatically
5. Check Firestore to confirm user data was created

---

## Monitoring and Logging

### View Logs

```bash
# Stream logs
gcloud run services logs tail mashroui-lti-backend --region us-central1

# View in Cloud Console
https://console.cloud.google.com/logs
```

### Monitor Performance

```bash
# View metrics in Cloud Console
https://console.cloud.google.com/run/detail/us-central1/mashroui-lti-backend/metrics
```

---

## Local Development

### Start Backend and Frontend Together

```bash
npm run dev
```

This will start:
- Vite frontend on port 5173
- Express backend on port 3001

### Environment Variables for Local Development

Create `server/.env`:

```
PORT=3001
NODE_ENV=development

CLASSERA_CLIENT_ID=5ee30a16-c764-47d1-8314-effae92c950a
CLASSERA_DEPLOYMENT_ID=27
CLASSERA_TOKEN_STAGING=e815fcea52034d3bd84cc47fcf0bd713c6094519

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

LTI_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=https://partners.classera.com,http://localhost:5173
```

### Test with ngrok

For local testing with Classera:

```bash
# Install ngrok
# Start your backend
npm run server:dev

# In another terminal, expose port 3001
ngrok http 3001

# Use the ngrok URL in Classera configuration
```

---

## Troubleshooting

### Issue: "Invalid nonce"

**Solution**: Check that sessions are being stored properly in Firestore and that the nonce hasn't expired (10 minutes).

### Issue: "Invalid signature"

**Solution**: Verify the JWKS endpoint is accessible and returning the correct public key.

### Issue: "Failed to create user"

**Solution**: Check Firebase Admin SDK credentials and Firestore permissions.

### Issue: Grade passback fails

**Solution**: Verify Classera OAuth token and AGS endpoint URL are correct.

---

## Security Checklist

- [ ] All secrets stored in Google Secret Manager
- [ ] Service account has minimum required permissions
- [ ] CORS configured to only allow Classera domains
- [ ] Rate limiting enabled on login endpoint
- [ ] HTTPS enforced (automatic with Cloud Run)
- [ ] Firestore security rules configured
- [ ] Environment variables never committed to Git

---

## API Endpoints

- `GET /health` - Health check endpoint
- `POST /api/lti/login` - LTI login initiation
- `POST /lti/launch` - LTI launch handler (receives id_token)
- `POST /api/lti/grades` - Submit grades to Classera
- `GET /api/lti/.well-known/jwks.json` - Public key endpoint

---

## Support

For issues or questions:
1. Check Cloud Run logs
2. Check Firestore for data
3. Verify Classera configuration
4. Review this deployment guide

---

## Updating the Deployment

```bash
# Make code changes
# Commit to Git

# Rebuild and redeploy
gcloud builds submit --config cloudbuild.yaml

# Or manually
docker build -t gcr.io/$PROJECT_ID/mashroui-lti-backend:latest .
docker push gcr.io/$PROJECT_ID/mashroui-lti-backend:latest
gcloud run services update mashroui-lti-backend \
  --image gcr.io/$PROJECT_ID/mashroui-lti-backend:latest \
  --region us-central1
```
